import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import './SplashScreen.css'

const LETTERS      = 'IMMERSIA'.split('')
const IMMERSIA_END = 0.28 + 0.10 * (LETTERS.length - 1)
const LAB_END      = IMMERSIA_END + 0.36
const SLOGAN_TEXT  = 'FEELING THE INTERACTION'

// ── Audio ────────────────────────────────────────────────────────────────────

function createReverb(ctx: AudioContext, duration = 1.2): ConvolverNode {
    const len = ctx.sampleRate * duration
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
        const data = buf.getChannelData(c)
        for (let i = 0; i < len; i++)
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8)
    }
    const conv = ctx.createConvolver()
    conv.buffer = buf
    return conv
}

function playLetterSound(ctx: AudioContext, rev: ConvolverNode, index: number) {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    const dry  = ctx.createGain()
    const wet  = ctx.createGain()
    osc.connect(gain)
    gain.connect(dry);  dry.connect(ctx.destination)
    gain.connect(rev);  rev.connect(wet);  wet.connect(ctx.destination)
    dry.gain.value = 0.6
    wet.gain.value = 0.4
    osc.type = 'sine'
    osc.frequency.value = 110 + index * 12
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
}

function playLabSound(ctx: AudioContext, rev: ConvolverNode) {
    ;[110, 165, 220].forEach((freq, i) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        const wet  = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.connect(rev);  rev.connect(wet);  wet.connect(ctx.destination)
        wet.gain.value = 0.5
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0,  ctx.currentTime + i * 0.04)
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.04 + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 1.2)
        osc.start(ctx.currentTime + i * 0.04)
        osc.stop(ctx.currentTime  + i * 0.04 + 1.2)
    })
}

// ── Three.js background ──────────────────────────────────────────────────────

function useThreeBackground(mountRef: RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const w = window.innerWidth
        const h = window.innerHeight

        const scene    = new THREE.Scene()
        const camera   = new THREE.PerspectiveCamera(75, w / h, 0.1, 100)
        camera.position.z = 6

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.setSize(w, h, false)
        renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
        mount.appendChild(renderer.domElement)

        // Floating particles
        const COUNT = 600
        const positions = new Float32Array(COUNT * 3)
        const velocities = new Float32Array(COUNT)
        for (let i = 0; i < COUNT; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 22
            positions[i * 3 + 1] = (Math.random() - 0.5) * 14
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6
            velocities[i] = Math.random() * 0.004 + 0.001
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const mat = new THREE.PointsMaterial({
            color: 0x0077EE, size: 0.05,
            transparent: true, opacity: 0.55, sizeAttenuation: true,
        })
        scene.add(new THREE.Points(geo, mat))


        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight, false)
        }
        window.addEventListener('resize', onResize)

        let raf = 0
        const posAttr = geo.attributes.position as THREE.BufferAttribute
        const tick = () => {
            raf = requestAnimationFrame(tick)
            for (let i = 0; i < COUNT; i++) {
                posAttr.array[i * 3 + 1] = (posAttr.array[i * 3 + 1] as number) + velocities[i]
                if ((posAttr.array[i * 3 + 1] as number) > 7) posAttr.array[i * 3 + 1] = -7
            }
            posAttr.needsUpdate = true
renderer.render(scene, camera)
        }
        tick()

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('resize', onResize)
            geo.dispose()
            mat.dispose()
            renderer.dispose()
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
        }
    }, [])
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props { onComplete?: () => void }

const SplashScreen = ({ onComplete }: Props) => {
    const containerRef = useRef<HTMLHeadingElement>(null)
    const labRef       = useRef<HTMLSpanElement>(null)
    const mountRef     = useRef<HTMLDivElement>(null)
    const bgGlowRef    = useRef<HTMLDivElement>(null)
    const scanRef      = useRef<HTMLDivElement>(null)
    const burstRef     = useRef<HTMLDivElement>(null)
    const audioCtxRef  = useRef<AudioContext | null>(null)
    const reverbRef    = useRef<ConvolverNode | null>(null)
    const tlRef        = useRef<gsap.core.Timeline | null>(null)

    const [started, setStarted]       = useState(false)
    const [audioEnabled, setAudioEnabled] = useState(true)
    const [sloganCount, setSloganCount]   = useState(0)
    const audioEnabledRef = useRef(true)

    useThreeBackground(mountRef)

    const runAnimation = useCallback((withAudio: boolean) => {
        const letters = containerRef.current?.querySelectorAll<HTMLSpanElement>('.letter')
        const lab     = labRef.current
        const bgGlow  = bgGlowRef.current
        const scan    = scanRef.current
        const burst   = burstRef.current
        if (!letters?.length || !lab) return

        tlRef.current?.kill()
        letters.forEach(el => el.classList.remove('letter--filled'))
        setSloganCount(0)

        const actx = withAudio ? audioCtxRef.current : null
        const rev  = withAudio ? reverbRef.current  : null

        // prefers-reduced-motion: skip all motion, jump to end
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            Array.from(letters).forEach(el => el.classList.add('letter--filled'))
            gsap.set(lab, { opacity: 1, x: 0 })
            setSloganCount(SLOGAN_TEXT.length)
            gsap.delayedCall(0.4, () => onComplete?.())
            return
        }

        const tl = gsap.timeline()
        tlRef.current = tl

        // Energy burst — start from scale(0.6), not 0 (Emil: nothing appears from nothing)
        if (burst) {
            tl.set(burst, { scale: 0.6, opacity: 0.85 }, 0)
              .to(burst, { scale: 2.4, opacity: 0, duration: 0.6, ease: 'expo.out' }, 0)
        }

        // Scan line
        if (scan) {
            tl.set(scan, { top: '-4px', opacity: 1 }, 0)
              .to(scan, {
                  top: '100%', duration: 0.5, ease: 'power1.inOut',
                  onComplete: () => gsap.set(scan, { opacity: 0 }),
              }, 0)
        }

        // Ambient glow
        if (bgGlow) {
            tl.set(bgGlow, { opacity: 0, scale: 0.5 }, 0)
              .to(bgGlow, { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' }, 0)
        }

        // Letters — crystallization stagger
        Array.from(letters).forEach((el, i) => {
            const t = 0.08 + i * 0.10
            tl.set(el, { y: 24, opacity: 0, filter: 'blur(10px) contrast(18)', scale: 1.15 }, 0)
              .to(el, {
                  y: 0, opacity: 1, filter: 'blur(0px) contrast(1)', scale: 1,
                  duration: 0.32,
                  ease: 'power2.out',
                  onComplete: () => {
                      el.classList.add('letter--filled')
                      gsap.fromTo(el,
                          { textShadow: '0 0 32px rgba(0,207,255,1), 0 0 64px rgba(0,150,255,0.5)' },
                          { textShadow: '0 0 8px rgba(0,207,255,0.12)', duration: 0.5, ease: 'power2.out' }
                      )
                      if (actx && rev) playLetterSound(actx, rev, i)
                  },
              }, t)
        })

        // LAB
        tl.set(lab, { x: 40, opacity: 0, filter: 'blur(6px)' }, 0)
          .to(lab, {
              x: 0, opacity: 1, filter: 'blur(0px)',
              duration: 0.36,
              ease: 'back.out(2)',
              onComplete: () => {
                  gsap.fromTo(lab,
                      { textShadow: '0 0 28px rgba(0,180,255,0.95)' },
                      { textShadow: '0 0 8px rgba(0,180,255,0.2)', duration: 0.55, ease: 'power2.out' }
                  )
                  if (actx && rev) playLabSound(actx, rev)
              },
          }, IMMERSIA_END)

        // Slogan typewriter
        const counter = { count: 0 }
        tl.to(counter, {
            count: SLOGAN_TEXT.length,
            duration: 0.9,
            ease: 'none',
            onUpdate()  { setSloganCount(Math.ceil(counter.count)) },
            onComplete() { gsap.delayedCall(0.8, () => onComplete?.()) },
        }, LAB_END)

    }, [onComplete])

    const startedRef = useRef(false)

    const handleStart = useCallback(() => {
        if (startedRef.current) return
        startedRef.current = true
        const actx = new AudioContext()
        actx.resume()
        audioCtxRef.current = actx
        reverbRef.current   = createReverb(actx)
        setStarted(true)
        runAnimation(true)
    }, [runAnimation])

    const toggleAudio = (e: React.MouseEvent) => {
        e.stopPropagation()
        const next = !audioEnabledRef.current
        audioEnabledRef.current = next
        setAudioEnabled(next)
    }

    useEffect(() => () => { tlRef.current?.kill() }, [])

    return (
        <div className='splash-container'>

            {/* ── Background ──────────────────────────────────────────────── */}
            <div className='splash-bg'>
                <div ref={mountRef} className='splash-bg__particles' />
                <div className='splash-bg__grid' />
                <div ref={bgGlowRef} className='splash-bg__glow' />
                <div ref={burstRef}  className='splash-bg__burst' />
                <div ref={scanRef}   className='splash-bg__scan' />
                <div className='splash-bg__vignette' />
            </div>

            {/* ── Click-to-start ───────────────────────────────────────────── */}
            {!started && (
                <div className='start-overlay' onClick={handleStart}>
                    <div className='timer-wrapper'>
                        <svg className='timer-ring' viewBox="0 0 110 110">
                            <circle className='timer-ring__bg'       cx="55" cy="55" r="48" />
                            <circle className='timer-ring__progress' cx="55" cy="55" r="48"
                                onAnimationEnd={handleStart} />
                        </svg>
                        <span className='start-hint'>click para<br />iniciar</span>
                    </div>
                </div>
            )}

            {/* ── Audio toggle ─────────────────────────────────────────────── */}
            {started && (
                <button className='audio-btn' onClick={toggleAudio}
                    title={audioEnabled ? 'Silenciar' : 'Activar audio'}>
                    {audioEnabled ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                    )}
                </button>
            )}

            {/* ── Logo ────────────────────────────────────────────────────── */}
            <div className='splash-content'>
                <h1 ref={containerRef} className='text-logo'>
                    {LETTERS.map((char, i) => (
                        <span
                            key={i}
                            className={`letter${!started ? ' letter--wave' : ''}`}
                            style={!started ? { animationDelay: `${i * 0.1}s` } : undefined}
                        >{char}</span>
                    ))}
                    <span ref={labRef} className='lab'>LAB</span>
                </h1>

                <p className='slogan'>
                    {SLOGAN_TEXT.split('').map((char, i) => (
                        <span
                            key={i}
                            className='slogan-char'
                            style={{ opacity: i < sloganCount ? 1 : 0 }}
                        >{char === ' ' ? '\u00A0' : char}</span>
                    ))}
                    {sloganCount > 0 && sloganCount < SLOGAN_TEXT.length && (
                        <span className='slogan-cursor'>▊</span>
                    )}
                </p>
            </div>
        </div>
    )
}

export default SplashScreen

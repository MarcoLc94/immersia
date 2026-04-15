import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import './SplashScreen.css'

const LETTERS      = 'IMMERSIA'.split('')
const IMMERSIA_END = 0.4 + 0.14 * (LETTERS.length - 1)
const LAB_END      = IMMERSIA_END + 0.5

function playLetterSound(ctx: AudioContext, index: number) {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 600 + index * 40
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
}

function playLabSound(ctx: AudioContext) {
    [0, 4, 7].forEach((semitone, i) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle'
        osc.frequency.value = 880 * Math.pow(2, semitone / 12)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime + i * 0.03)
        osc.stop(ctx.currentTime + 0.4)
    })
}

interface Props { onComplete?: () => void }

const SplashScreen = ({ onComplete }: Props) => {
    const containerRef = useRef<HTMLHeadingElement>(null)
    const labRef       = useRef<HTMLSpanElement>(null)
    const sloganRef    = useRef<HTMLParagraphElement>(null)
    const audioCtxRef  = useRef<AudioContext | null>(null)
    const tweensRef    = useRef<gsap.core.Tween[]>([])
    const [started, setStarted]       = useState(false)
    const [audioEnabled, setAudioEnabled] = useState(true)
    const audioEnabledRef = useRef(true)

    const runAnimation = useCallback((withAudio: boolean) => {
        const letters = containerRef.current?.querySelectorAll<HTMLSpanElement>('.letter')
        const lab     = labRef.current
        const slogan  = sloganRef.current
        if (!letters?.length || !lab || !slogan) return

        tweensRef.current.forEach(t => t.kill())
        tweensRef.current = []
        letters.forEach(el => el.classList.remove('letter--filled'))

        const ctx = withAudio ? audioCtxRef.current : null

        Array.from(letters).forEach((el, i) => {
            gsap.set(el, { y: 40, opacity: 0 })
            tweensRef.current.push(gsap.to(el, {
                y: 0, opacity: 1,
                duration: 0.4,
                delay: i * 0.14,
                ease: 'back.out(2)',
                onComplete: () => {
                    el.classList.add('letter--filled')
                    if (ctx) playLetterSound(ctx, i)
                }
            }))
        })

        gsap.set(lab, { scale: 0.2, opacity: 0, transformOrigin: 'left bottom' })
        tweensRef.current.push(gsap.to(lab, {
            scale: 1, opacity: 1,
            duration: 0.5,
            delay: IMMERSIA_END,
            ease: 'back.out(1.8)',
            onComplete: () => { if (ctx) playLabSound(ctx) }
        }))

        gsap.set(slogan, { opacity: 0 })
        tweensRef.current.push(gsap.to(slogan, {
            opacity: 1,
            duration: 0.8,
            delay: LAB_END,
            ease: 'power2.in',
            onComplete: () => {
                gsap.delayedCall(0.8, () => {
                    onComplete?.()
                })
            }
        }))
    }, [])

    const startedRef = useRef(false)

    const handleStart = useCallback(() => {
        if (startedRef.current) return
        startedRef.current = true
        audioCtxRef.current = new AudioContext()
        audioCtxRef.current.resume()
        setStarted(true)
        runAnimation(true)
    }, [runAnimation])

    const toggleAudio = (e: React.MouseEvent) => {
        e.stopPropagation()
        const next = !audioEnabledRef.current
        audioEnabledRef.current = next
        setAudioEnabled(next)
        if (next && audioCtxRef.current) runAnimation(true)
    }

    useEffect(() => {
        return () => tweensRef.current.forEach(t => t.kill())
    }, [])

    return (
        <div className='splash-container'>

            {/* Overlay click-to-start con timer circular */}
            {!started && (
                <div className='start-overlay' onClick={handleStart}>
                    <div className='timer-wrapper'>
                        <svg className='timer-ring' viewBox="0 0 110 110">
                            <circle className='timer-ring__bg'       cx="55" cy="55" r="48" />
                            <circle className='timer-ring__progress' cx="55" cy="55" r="48"
                                onAnimationEnd={handleStart} />
                        </svg>
                        <span className='start-hint'>click para<br/>iniciar</span>
                    </div>
                </div>
            )}

            {/* Botón audio (solo visible después de iniciar) */}
            {started && (
                <button className='audio-btn' onClick={toggleAudio} title={audioEnabled ? 'Silenciar' : 'Activar audio'}>
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
                <p ref={sloganRef} className='slogan'>feeling the interaction</p>
            </div>
        </div>
    )
}

export default SplashScreen

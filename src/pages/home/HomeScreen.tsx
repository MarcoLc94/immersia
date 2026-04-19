import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FRAME_COUNT } from './frameCount'
import StudioSection from './sections/StudioSection'
import './HomeScreen.css'

// ── SVG Parallax Elements ─────────────────────────────────────────────────────

const OrbitalRing = () => (
    <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="250" cy="250" r="230" stroke="rgba(0,160,255,0.07)" strokeWidth="1" strokeDasharray="8 16" />
        <circle cx="250" cy="250" r="180" stroke="rgba(0,160,255,0.05)" strokeWidth="0.5" />
        <circle cx="250" cy="250" r="130" stroke="rgba(0,160,255,0.06)" strokeWidth="0.8" strokeDasharray="3 10" />
        <circle cx="250" cy="250" r="6" fill="rgba(0,200,255,0.25)" />
        <circle cx="250" cy="20" r="3.5" fill="rgba(0,200,255,0.3)" />
        <circle cx="480" cy="250" r="3.5" fill="rgba(0,200,255,0.2)" />
    </svg>
)

const GridDots = () => (
    <svg viewBox="0 0 180 140" fill="none">
        {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => (
                <circle
                    key={`${row}-${col}`}
                    cx={col * 22 + 8} cy={row * 22 + 8} r="1.8"
                    fill={`rgba(0,190,255,${0.08 + (col + row) * 0.01})`}
                />
            ))
        )}
    </svg>
)

const WaveLines = () => (
    <svg viewBox="0 0 600 120" fill="none">
        <path d="M0,60 C100,15 200,105 300,60 C400,15 500,105 600,60" stroke="rgba(0,170,255,0.13)" strokeWidth="1" />
        <path d="M0,75 C100,30 200,120 300,75 C400,30 500,120 600,75" stroke="rgba(0,170,255,0.08)" strokeWidth="0.6" />
        <path d="M0,45 C100,0  200,90  300,45 C400,0  500,90  600,45" stroke="rgba(0,170,255,0.06)" strokeWidth="0.5" />
    </svg>
)

const DiamondFrame = () => (
    <svg viewBox="0 0 160 160" fill="none">
        <polygon points="80,8 152,80 80,152 8,80" stroke="rgba(100,80,255,0.14)" strokeWidth="1" />
        <polygon points="80,32 128,80 80,128 32,80" stroke="rgba(100,80,255,0.09)" strokeWidth="0.6" />
        <polygon points="80,56 104,80 80,104 56,80" stroke="rgba(0,200,255,0.15)" strokeWidth="0.8" />
        <circle cx="80" cy="80" r="5" stroke="rgba(0,200,255,0.3)" strokeWidth="1" fill="none" />
    </svg>
)

const ScanLines = () => (
    <svg viewBox="0 0 240 100" fill="none">
        {[0, 16, 32, 48, 64, 80].map((y, i) => (
            <line key={y} x1="0" y1={y} x2={240 - i * 25} y2={y}
                stroke="rgba(0,210,255,0.15)" strokeWidth="0.8" />
        ))}
        <line x1="0" y1="96" x2="60" y2="96" stroke="rgba(0,210,255,0.25)" strokeWidth="1.2" />
    </svg>
)

const CrossTarget = () => (
    <svg viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="38" stroke="rgba(0,200,255,0.12)" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="22" stroke="rgba(0,200,255,0.08)" strokeWidth="0.6" />
        <line x1="50" y1="0" x2="50" y2="28" stroke="rgba(0,210,255,0.2)" strokeWidth="0.8" />
        <line x1="50" y1="72" x2="50" y2="100" stroke="rgba(0,210,255,0.2)" strokeWidth="0.8" />
        <line x1="0" y1="50" x2="28" y2="50" stroke="rgba(0,210,255,0.2)" strokeWidth="0.8" />
        <line x1="72" y1="50" x2="100" y2="50" stroke="rgba(0,210,255,0.2)" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="3.5" fill="rgba(0,210,255,0.35)" />
    </svg>
)

const ArcFragment = () => (
    <svg viewBox="0 0 200 200" fill="none">
        <path d="M40,160 A100,100 0 0,1 160,40" stroke="rgba(0,180,255,0.12)" strokeWidth="1" strokeLinecap="round" />
        <path d="M60,160 A80,80  0 0,1 160,60" stroke="rgba(0,180,255,0.08)" strokeWidth="0.6" strokeLinecap="round" />
        <circle cx="40" cy="160" r="4" fill="rgba(0,200,255,0.3)" />
        <circle cx="160" cy="40" r="4" fill="rgba(0,200,255,0.3)" />
    </svg>
)

// ── Frame drawing helper ───────────────────────────────────────────────────────

function drawCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cw: number, ch: number,
) {
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
}

// ── Word cycling ──────────────────────────────────────────────────────────────

const PHRASES = ['motion.', 'feeling.', 'presence.', 'wonder.']

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { splashDone?: boolean }

const HomeScreen = ({ splashDone = false }: Props) => {
    const stageRef      = useRef<HTMLDivElement>(null)
    const canvasRef     = useRef<HTMLCanvasElement>(null)
    const canvasOpacity = useRef(0)
    const framesRef     = useRef<HTMLImageElement[]>([])
    const frameObjRef   = useRef({ frame: 0 })
    const frameTweenRef = useRef<gsap.core.Tween | null>(null)

    const heroTextRef  = useRef<HTMLDivElement>(null)
    const entryTlRef   = useRef<gsap.core.Timeline | null>(null)
    const exitTlRef    = useRef<gsap.core.Timeline | null>(null)
    const wordRef      = useRef<HTMLSpanElement>(null)
    const phraseIdx    = useRef(0)
    const wordCallRef  = useRef<gsap.core.Tween | null>(null)
    const rafRef       = useRef(0)
    const frameIdxRef  = useRef(0)
    const directionRef = useRef(1)

    const p1 = useRef<HTMLDivElement>(null)
    const p2 = useRef<HTMLDivElement>(null)
    const p3 = useRef<HTMLDivElement>(null)
    const p4 = useRef<HTMLDivElement>(null)
    const p5 = useRef<HTMLDivElement>(null)
    const p6 = useRef<HTMLDivElement>(null)
    const p7 = useRef<HTMLDivElement>(null)

    // ── Canvas size ────────────────────────────────────────────────────────────
    useLayoutEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const setSize = () => {
            canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            // Redraw current frame after resize
            const idx = Math.round(frameObjRef.current.frame)
            const img = framesRef.current[idx]
            if (img?.complete && img.naturalWidth) {
                const ctx = canvas.getContext('2d')
                if (ctx) drawCover(ctx, img, canvas.width, canvas.height)
            }
        }
        setSize()
        window.addEventListener('resize', setSize)
        return () => window.removeEventListener('resize', setSize)
    }, [])

    // ── Preload all frames ─────────────────────────────────────────────────────
    useEffect(() => {
        const imgs: HTMLImageElement[] = []
        for (let i = 0; i < FRAME_COUNT; i++) {
            const img = new Image()
            img.src = `/frames/frame_${String(i + 1).padStart(4, '0')}.png`
            imgs.push(img)
        }
        framesRef.current = imgs
    }, [])

    // ── Mouse → SVG parallax ──────────────────────────────────────────────────
    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        const layers = [
            { el: p1.current, d: 18 },
            { el: p2.current, d: 30 },
            { el: p3.current, d: 12 },
            { el: p4.current, d: 40 },
            { el: p5.current, d: 22 },
            { el: p6.current, d: 35 },
            { el: p7.current, d: 15 },
        ]
        const onMove = (e: MouseEvent) => {
            const r = stage.getBoundingClientRect()
            const nx = (e.clientX - r.left)  / r.width  - 0.5
            const ny = (e.clientY - r.top)   / r.height - 0.5
            layers.forEach(({ el, d }) => {
                if (!el) return
                gsap.to(el, { x: nx * d, y: ny * d, duration: 1.2, ease: 'power2.out' })
            })
        }
        stage.addEventListener('mousemove', onMove)
        return () => stage.removeEventListener('mousemove', onMove)
    }, [])

    // ── Build text timelines ───────────────────────────────────────────────────
    useEffect(() => {
        if (!heroTextRef.current) return
        const entry = gsap.timeline({ paused: true })
        entry
            .fromTo('.hero-eyebrow',
                { y: 32, opacity: 0, filter: 'blur(8px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }
            )
            .fromTo('.hero-hl-line',
                { y: 110, opacity: 0, clipPath: 'inset(0 0 110% 0)', filter: 'blur(4px)' },
                { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)', duration: 1.1, ease: 'power4.out', stagger: 0.18 },
                '-=0.4'
            )
            .fromTo('.hero-sub',
                { y: 36, opacity: 0, filter: 'blur(6px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75, ease: 'power3.out' },
                '-=0.5'
            )
            .fromTo('.hero-cta-wrap',
                { y: 28, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.5)' },
                '-=0.4'
            )
            .fromTo('.hero-scroll-hint',
                { y: 12, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
                '-=0.2'
            )
        entryTlRef.current = entry

        const exit = gsap.timeline({ paused: true })
        exit
            .to('.hero-scroll-hint', { y: -10, opacity: 0, duration: 0.25, ease: 'power2.in' })
            .to('.hero-cta-wrap',    { y: -28, opacity: 0, duration: 0.35, ease: 'power2.in' }, '-=0.1')
            .to('.hero-sub',         { y: -36, opacity: 0, filter: 'blur(4px)', duration: 0.4, ease: 'power3.in' }, '-=0.2')
            .to('.hero-hl-line',     { y: -60, opacity: 0, filter: 'blur(6px)', stagger: 0.1, duration: 0.5, ease: 'power4.in' }, '-=0.25')
            .to('.hero-eyebrow',     { y: -24, opacity: 0, filter: 'blur(8px)', duration: 0.35, ease: 'expo.in' }, '-=0.3')
        exitTlRef.current = exit

        return () => { entry.kill(); exit.kill() }
    }, [])

    // ── Trigger animation when splash done ────────────────────────────────────
    useEffect(() => {
        if (!splashDone) return
        const canvas = canvasRef.current
        if (!canvas) return

        // Fade in canvas
        gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'power2.out' })

        // ── Draw helper ──────────────────────────────────────────────────────
        const drawFrame = (idx: number) => {
            const img = framesRef.current[Math.max(0, Math.min(FRAME_COUNT - 1, idx))]
            if (!img?.complete || !img.naturalWidth) return
            const ctx = canvas.getContext('2d')
            if (ctx) drawCover(ctx, img, canvas.width, canvas.height)
        }

        // ── RAF ping-pong loop ───────────────────────────────────────────────
        let looping = false
        const FPS = 24, interval = 1000 / FPS
        let last = performance.now()

        const tick = (now: number) => {
            rafRef.current = requestAnimationFrame(tick)
            if (now - last < interval) return
            last = now
            drawFrame(frameIdxRef.current)
            frameIdxRef.current += directionRef.current
            if (frameIdxRef.current >= FRAME_COUNT - 1) {
                frameIdxRef.current = FRAME_COUNT - 1; directionRef.current = -1
            } else if (frameIdxRef.current <= 0) {
                frameIdxRef.current = 0; directionRef.current = 1
            }
        }

        const startLoop = () => {
            if (looping) return
            looping = true
            frameIdxRef.current = 0
            directionRef.current = 1
            last = performance.now()
            rafRef.current = requestAnimationFrame(tick)
        }

        const stopLoop = () => {
            if (!looping) return
            looping = false
            cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
        }

        startLoop()

        // ── Seek tween: loop → frame 18 al hacer scroll ─────────────────────
        let seekTween: gsap.core.Tween | null = null

        const stFrames = ScrollTrigger.create({
            trigger: '.home__hero',
            start: 'top top',
            end: 'bottom top',
            onEnter() {
                stopLoop()
                seekTween?.kill()
                const obj = { f: frameIdxRef.current }
                seekTween = gsap.to(obj, {
                    f: 18,
                    duration: 0.9,
                    ease: 'power2.inOut',
                    onUpdate() {
                        frameIdxRef.current = Math.round(obj.f)
                        drawFrame(frameIdxRef.current)
                    },
                })
            },
            onLeaveBack() {
                seekTween?.kill()
                startLoop()
            },
        })

        // ── Text exit/entry ScrollTrigger ────────────────────────────────────
        const stText = ScrollTrigger.create({
            trigger: '.home__hero',
            start: 'top top',
            end: '18% top',
            onLeave:     () => exitTlRef.current?.play(),
            onEnterBack: () => exitTlRef.current?.reverse(),
        })

        // Text entrance
        const t = setTimeout(() => entryTlRef.current?.play(), 500)

        // Word cycling
        const cycleWord = () => {
            const el = wordRef.current
            if (!el) return
            phraseIdx.current = (phraseIdx.current + 1) % PHRASES.length
            gsap.to(el, {
                y: -28, opacity: 0, filter: 'blur(12px)',
                duration: 0.32, ease: 'power3.in',
                onComplete: () => {
                    el.textContent = PHRASES[phraseIdx.current]
                    gsap.fromTo(el,
                        { y: 32, opacity: 0, filter: 'blur(12px)' },
                        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out' }
                    )
                },
            })
            wordCallRef.current = gsap.delayedCall(3, cycleWord)
        }
        wordCallRef.current = gsap.delayedCall(4, cycleWord)

        // Parallax elements fade in
        gsap.fromTo(
            [p1.current, p2.current, p3.current, p4.current, p5.current, p6.current, p7.current],
            { opacity: 0, scale: 0.85 },
            { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out', stagger: 0.12, delay: 0.4 }
        )

        return () => {
            clearTimeout(t)
            stopLoop()
            seekTween?.kill()
            stFrames.kill()
            stText.kill()
            wordCallRef.current?.kill()
        }
    }, [splashDone])

    return (
        <div className="home" ref={stageRef}>

            {/* ── Parallax SVG layer ──────────────────────────────────────────── */}
            <div className="parallax-stage" aria-hidden>
                <div ref={p1} className="p-el p-el--1"><OrbitalRing /></div>
                <div ref={p2} className="p-el p-el--2"><GridDots /></div>
                <div ref={p3} className="p-el p-el--3"><WaveLines /></div>
                <div ref={p4} className="p-el p-el--4"><DiamondFrame /></div>
                <div ref={p5} className="p-el p-el--5"><ScanLines /></div>
                <div ref={p6} className="p-el p-el--6"><CrossTarget /></div>
                <div ref={p7} className="p-el p-el--7"><ArcFragment /></div>
            </div>

            {/* ── Hero section ────────────────────────────────────────────────── */}
            <section className="home__hero">

                {/* Full-screen frame animation canvas */}
                <canvas ref={canvasRef} className="statue-canvas" />

                {/* Hero text */}
                <div className="hero-text" ref={heroTextRef}>
                    <p className="hero-eyebrow">3D · Motion Design · Immersive Web</p>

                    <h1 className="hero-headline">
                        <span className="hero-hl-line">We design</span>
                        <span ref={wordRef} className="hero-hl-line hero-hl-line--em">motion.</span>
                    </h1>

                    <p className="hero-sub">
                        Cinematic 3D experiences &amp; scroll-driven<br />
                        animations for brands that deserve to be felt.
                    </p>

                    <div className="hero-cta-wrap">
                        <button className="hero-btn-primary">Explore our work</button>
                        <button className="hero-btn-secondary">View showreel</button>
                    </div>
                </div>

                {/* Scroll hint */}
                <div className="hero-scroll-hint">
                    <div className="scroll-line" />
                    <span>scroll</span>
                </div>
            </section>

            <StudioSection />
        </div>
    )
}

export default HomeScreen

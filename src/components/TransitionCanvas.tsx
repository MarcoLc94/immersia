import { useEffect, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const FRAME_COUNT = 192
const EXIT_FRAME = 16

interface Props { show: boolean }

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
}

const TransitionCanvas = ({ show }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const framesRef = useRef<HTMLImageElement[]>([])

    useEffect(() => {
        const imgs: HTMLImageElement[] = []
        for (let i = 0; i < FRAME_COUNT; i++) {
            const img = new Image()
            img.src = `/frames/greek-explosion/frame_${String(i + 1).padStart(4, '0')}.jpg`
            imgs.push(img)
        }
        framesRef.current = imgs
    }, [])

    useLayoutEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const setSize = () => {
            canvas.width = window.innerWidth * window.devicePixelRatio
            canvas.height = window.innerHeight * window.devicePixelRatio
        }
        setSize()
        window.addEventListener('resize', setSize)
        return () => window.removeEventListener('resize', setSize)
    }, [])

    useEffect(() => {
        if (!show) return
        const canvas = canvasRef.current
        if (!canvas) return

        const drawFrame = (idx: number) => {
            const img = framesRef.current[Math.max(0, Math.min(FRAME_COUNT - 1, idx))]
            if (!img?.complete || !img.naturalWidth) return
            const ctx = canvas.getContext('2d')
            if (ctx) drawCover(ctx, img, canvas.width, canvas.height)
        }

        drawFrame(EXIT_FRAME)

        let stFrames: ScrollTrigger | null = null
        let stOut: ScrollTrigger | null = null
        let seekAnim: gsap.core.Tween | null = null
        let activeDir = 1

        const setupScrollTrigger = (dir: number) => {
            stFrames = ScrollTrigger.create({
                trigger: '.studio-section',
                start: 'top bottom',
                end: 'top top',
                scrub: true,
                onUpdate(self) {
                    const frame = dir >= 0
                        ? Math.round(EXIT_FRAME + self.progress * (FRAME_COUNT - 1 - EXIT_FRAME))
                        : Math.round(EXIT_FRAME * (1 - self.progress))
                    drawFrame(Math.max(0, Math.min(FRAME_COUNT - 1, frame)))
                },
                onLeave: () => {
                    drawFrame(dir >= 0 ? FRAME_COUNT - 1 : 0)
                    gsap.set(canvas, { opacity: 1 })
                },
            })

            stOut = ScrollTrigger.create({
                trigger: '.studio-section',
                start: 'bottom 60%',
                end: 'bottom top',
                scrub: 1,
                onUpdate(self) {
                    gsap.set(canvas, { opacity: 1 - self.progress })
                },
                onLeaveBack: () => gsap.set(canvas, { opacity: 1 }),
            })
        }

        // seek-start: hero hands off immediately at first scroll pixel
        const onSeekStart = (e: Event) => {
            const detail = (e as CustomEvent).detail ?? {}
            const startFrame: number = detail.frame ?? EXIT_FRAME
            const dir: number = detail.direction ?? 1
            activeDir = dir

            // Show immediately at hero's current frame — zero gap
            drawFrame(startFrame)
            gsap.set(canvas, { visibility: 'visible', opacity: 1 })

            if (startFrame === EXIT_FRAME) {
                // Already at connection frame — go straight to scroll mode
                setupScrollTrigger(dir)
                return
            }

            // Seek to connection frame, then switch to scroll mode
            const distance = Math.abs(startFrame - EXIT_FRAME)
            const duration = Math.max(0.25, (distance / FRAME_COUNT) * 1.5)
            const obj = { f: startFrame }
            seekAnim = gsap.to(obj, {
                f: EXIT_FRAME,
                duration,
                ease: 'power2.inOut',
                onUpdate() { drawFrame(Math.round(obj.f)) },
                onComplete() {
                    seekAnim = null
                    drawFrame(EXIT_FRAME)
                    setupScrollTrigger(dir)
                },
            })
        }

        const onReset = () => {
            seekAnim?.kill(); seekAnim = null
            stFrames?.kill(); stFrames = null
            stOut?.kill(); stOut = null
            gsap.set(canvas, { visibility: 'hidden', opacity: 0 })
            drawFrame(EXIT_FRAME)
            window.dispatchEvent(new CustomEvent('hero-direction', {
                detail: { direction: -activeDir },
            }))
        }

        window.addEventListener('seek-start', onSeekStart)
        window.addEventListener('frame18-reset', onReset)

        return () => {
            window.removeEventListener('seek-start', onSeekStart)
            window.removeEventListener('frame18-reset', onReset)
            seekAnim?.kill()
            stFrames?.kill()
            stOut?.kill()
        }
    }, [show])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                opacity: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
            }}
        />
    )
}

export default TransitionCanvas

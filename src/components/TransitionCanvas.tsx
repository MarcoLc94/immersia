import { useEffect, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const FRAME_COUNT = 192
const EXIT_FRAME  = 18
// Final resting clip: show only right 55vw → clip left 45%
const FINAL_CLIP  = 45

interface Props { show: boolean }

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const dw = img.naturalWidth  * scale
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
            img.src = `/frames/frame_${String(i + 1).padStart(4, '0')}.png`
            imgs.push(img)
        }
        framesRef.current = imgs
    }, [])

    // Canvas pixel buffer matches full viewport so drawCover is identical to hero canvas
    useLayoutEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const setSize = () => {
            canvas.width  = window.innerWidth  * window.devicePixelRatio
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

        const obj = { frame: EXIT_FRAME }

        // Clip starts at 0% (full overlay matching hero canvas) → FINAL_CLIP% (right 55vw only)
        const st = ScrollTrigger.create({
            trigger: '.studio-section',
            start: 'top bottom',
            end:   'top top',
            scrub: 1.5,
            onUpdate(self) {
                obj.frame = EXIT_FRAME + self.progress * (FRAME_COUNT - 1 - EXIT_FRAME)
                drawFrame(Math.round(obj.frame))

                const clipLeft = Math.min(FINAL_CLIP, self.progress * 2 * FINAL_CLIP)
                gsap.set(canvas, {
                    opacity:  Math.min(1, self.progress * 3),
                    clipPath: `inset(0 0 0 ${clipLeft}%)`,
                })
            },
            onLeaveBack: () => gsap.set(canvas, { opacity: 0, clipPath: 'inset(0 0 0 0%)' }),
            onLeave:     () => gsap.set(canvas, { opacity: 1, clipPath: `inset(0 0 0 ${FINAL_CLIP}%)` }),
        })

        const stOut = ScrollTrigger.create({
            trigger: '.studio-section',
            start: 'bottom 60%',
            end:   'bottom top',
            scrub: 1,
            onUpdate(self) {
                gsap.set(canvas, { opacity: 1 - self.progress })
            },
            onLeaveBack: () => gsap.set(canvas, { opacity: 1 }),
        })

        return () => { st.kill(); stOut.kill() }
    }, [show])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position:      'fixed',
                top:           0,
                left:          0,
                width:         '100vw',
                height:        '100vh',
                zIndex:        5,
                opacity:       0,
                pointerEvents: 'none',
                clipPath:      'inset(0 0 0 0%)',
            }}
        />
    )
}

export default TransitionCanvas

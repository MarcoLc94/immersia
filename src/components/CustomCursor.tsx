import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './CustomCursor.css'

const CustomCursor = () => {
    const dotRef   = useRef<HTMLDivElement>(null)
    const ringRef  = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const dot  = dotRef.current
        const ring = ringRef.current
        if (!dot || !ring) return

        let mouseX = window.innerWidth  / 2
        let mouseY = window.innerHeight / 2

        // Dot sigue al instante, ring con lag
        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
            gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.08, ease: 'none' })
            gsap.to(ring, { x: mouseX, y: mouseY, duration: 0.45, ease: 'power2.out' })
        }

        // Hover sobre elementos interactivos → ring se expande
        const onEnter = () => {
            gsap.to(ring, { scale: 1.8, opacity: 0.6, duration: 0.3, ease: 'power2.out' })
            gsap.to(dot,  { scale: 0.4, duration: 0.2, ease: 'power2.out' })
        }
        const onLeave = () => {
            gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' })
            gsap.to(dot,  { scale: 1, duration: 0.2, ease: 'power2.out' })
        }

        // Click → pulse
        const onClick = () => {
            gsap.fromTo(ring,
                { scale: 1 },
                { scale: 2.2, opacity: 0, duration: 0.4, ease: 'power2.out',
                  onComplete: () => gsap.set(ring, { scale: 1, opacity: 1 }) }
            )
        }

        const addListeners = () => {
            document.querySelectorAll('a, button, [role="button"], input, label, select, [data-cursor]')
                .forEach(el => {
                    el.addEventListener('mouseenter', onEnter)
                    el.addEventListener('mouseleave', onLeave)
                })
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('click', onClick)
        addListeners()

        // Re-scan cuando el DOM cambia (Astro hydration, etc.)
        const observer = new MutationObserver(addListeners)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('click', onClick)
            observer.disconnect()
        }
    }, [])

    return (
        <>
            <div ref={dotRef}  className='cursor__dot' />
            <div ref={ringRef} className='cursor__ring' />
        </>
    )
}

export default CustomCursor

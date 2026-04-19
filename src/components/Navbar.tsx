import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Navbar.css'

const LOGO_LETTERS = 'IMMERSIA'.split('')

interface Props { animate?: boolean }

const Navbar = ({ animate = false }: Props) => {
    const logoRef      = useRef<HTMLDivElement>(null)
    const letterRefs   = useRef<HTMLSpanElement[]>([])
    const itemsRef     = useRef<HTMLLIElement[]>([])
    const navRef       = useRef<HTMLElement>(null)
    const animatedRef  = useRef(false)
    const variantRef   = useRef(0)
    const idleCallRef  = useRef<gsap.core.Tween | null>(null)

    // ── Idle logo variants ────────────────────────────────────────────────────
    const playLogoVariant = (v: number) => {
        const letters = letterRefs.current
        if (!letters.length) return
        switch (v % 4) {
            case 0: // Shimmer — cada letra destella en cyan de izquierda a derecha
                gsap.fromTo(letters,
                    { color: '#f3f1ee' },
                    { color: '#00CFFF', duration: 0.08, stagger: 0.06,
                      yoyo: true, repeat: 1, ease: 'none' }
                )
                break
            case 1: // Wave — letras suben en ola
                gsap.fromTo(letters,
                    { y: 0 },
                    { y: -7, duration: 0.18, stagger: 0.055,
                      yoyo: true, repeat: 1, ease: 'sine.inOut' }
                )
                break
            case 2: // Glitch — desplazamiento horizontal caótico
                gsap.to(letters, {
                    x: () => gsap.utils.random(-4, 4),
                    duration: 0.06, stagger: 0.03,
                    yoyo: true, repeat: 3, ease: 'none',
                    onComplete: () => gsap.set(letters, { x: 0 }),
                })
                break
            case 3: // Scale pulse — letras se estiran hacia arriba una a una
                gsap.fromTo(letters,
                    { scaleY: 1, transformOrigin: 'bottom center' },
                    { scaleY: 1.25, duration: 0.14, stagger: 0.05,
                      yoyo: true, repeat: 1, ease: 'power2.out' }
                )
                break
        }
    }

    // ── Idle links variants ───────────────────────────────────────────────────
    const playLinksVariant = (v: number) => {
        const items = itemsRef.current
        if (!items.length) return
        switch (v % 4) {
            case 0: // Stagger wave arriba
                gsap.fromTo(items,
                    { y: 0 },
                    { y: -6, duration: 0.2, stagger: 0.1,
                      yoyo: true, repeat: 1, ease: 'sine.inOut' }
                )
                break
            case 1: // Opacity flicker escalonado
                gsap.fromTo(items,
                    { opacity: 1 },
                    { opacity: 0.2, duration: 0.12, stagger: 0.08,
                      yoyo: true, repeat: 1, ease: 'none' }
                )
                break
            case 2: // Stagger wave abajo
                gsap.fromTo(items,
                    { y: 0 },
                    { y: 5, duration: 0.18, stagger: 0.1,
                      yoyo: true, repeat: 1, ease: 'sine.inOut' }
                )
                break
            case 3: // Scale sutil
                gsap.fromTo(items,
                    { scale: 1 },
                    { scale: 1.12, duration: 0.15, stagger: 0.08,
                      yoyo: true, repeat: 1, ease: 'back.out(2)' }
                )
                break
        }
    }

    // ── Entrada ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!animate || animatedRef.current) return
        const logo  = logoRef.current
        const items = itemsRef.current
        if (!logo || !items.length) return
        animatedRef.current = true

        gsap.fromTo(logo,
            { x: -32, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.9, ease: 'expo.out', delay: 0.2 }
        )
        gsap.fromTo(items[0],
            { y: -48, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)', delay: 0.45 }
        )
        gsap.fromTo(items[1],
            { y: 48, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)', delay: 0.6 }
        )
        gsap.fromTo(items[2],
            { y: -48, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)', delay: 0.75 }
        )

        // Idle loop — empieza 3s después de que termina la entrada
        const scheduleIdle = (delay: number) => {
            idleCallRef.current = gsap.delayedCall(delay, () => {
                playLogoVariant(variantRef.current)
                playLinksVariant(variantRef.current)
                variantRef.current++
                scheduleIdle(3)
            })
        }
        scheduleIdle(3.8)
    }, [animate])

    // ── Scroll scrolled state ─────────────────────────────────────────────────
    useEffect(() => {
        const nav = navRef.current
        if (!nav) return
        const onScroll = () => nav.classList.toggle('navbar--scrolled', window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => () => { idleCallRef.current?.kill() }, [])

    return (
        <nav ref={navRef} className='navbar'>
            <div ref={logoRef} className='navbar__logo'>
                {LOGO_LETTERS.map((char, i) => (
                    <span
                        key={i}
                        className='navbar__logo-letter'
                        ref={el => { if (el) letterRefs.current[i] = el }}
                    >{char}</span>
                ))}
                <span className='navbar__logo-lab'>LAB</span>
            </div>
            <ul className='navbar__links'>
                {['Link', 'Link', 'Link'].map((label, i) => (
                    <li key={i} ref={el => { if (el) itemsRef.current[i] = el }}>
                        <a href='#'>{label}</a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export default Navbar

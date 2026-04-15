import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Navbar.css'

interface Props { animate?: boolean }

const Navbar = ({ animate = false }: Props) => {
    const logoRef     = useRef<HTMLDivElement>(null)
    const itemsRef    = useRef<HTMLLIElement[]>([])
    const navRef      = useRef<HTMLElement>(null)
    const animatedRef = useRef(false)

    useEffect(() => {
        if (!animate || animatedRef.current) return
        const logo  = logoRef.current
        const items = itemsRef.current
        if (!logo || !items.length) return
        animatedRef.current = true

        gsap.to(logo,  { opacity: 1, duration: 1.5, ease: 'power2.out' })
        gsap.to(items, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15 })
    }, [animate])

    useEffect(() => {
        const nav = navRef.current
        if (!nav) return
        const onScroll = () => nav.classList.toggle('navbar--scrolled', window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <nav ref={navRef} className='navbar'>
            <div ref={logoRef} className='navbar__logo'>
                IMMERSIA<span className='navbar__logo-lab'>LAB</span>
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

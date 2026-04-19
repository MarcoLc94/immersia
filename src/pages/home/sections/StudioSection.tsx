import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './StudioSection.css'

gsap.registerPlugin(ScrollTrigger)

const StudioSection = () => {
    const sectionRef   = useRef<HTMLElement>(null)
    const eyebrowRef   = useRef<HTMLParagraphElement>(null)
    const statementRef = useRef<HTMLHeadingElement>(null)
    const dividerRef   = useRef<HTMLDivElement>(null)
    const pillarsRef   = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Eyebrow
            gsap.fromTo(eyebrowRef.current,
                { y: 24, opacity: 0, filter: 'blur(8px)' },
                {
                    y: 0, opacity: 1, filter: 'blur(0px)',
                    duration: 0.8, ease: 'expo.out',
                    scrollTrigger: { trigger: eyebrowRef.current, start: 'top 85%' },
                }
            )

            // Statement — línea a línea
            const lines = statementRef.current?.querySelectorAll('.studio__line')
            if (lines?.length) {
                gsap.fromTo(lines,
                    { y: 80, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
                    {
                        y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)',
                        duration: 1.1, ease: 'power4.out', stagger: 0.15,
                        scrollTrigger: { trigger: statementRef.current, start: 'top 80%' },
                    }
                )
            }

            // Divider
            gsap.fromTo(dividerRef.current,
                { scaleX: 0, opacity: 0 },
                {
                    scaleX: 1, opacity: 1,
                    duration: 1.2, ease: 'expo.out',
                    transformOrigin: 'left center',
                    scrollTrigger: { trigger: dividerRef.current, start: 'top 85%' },
                }
            )

            // Pilares — stagger
            const pillars = pillarsRef.current?.querySelectorAll('.studio__pillar')
            if (pillars?.length) {
                gsap.fromTo(pillars,
                    { y: 60, opacity: 0, filter: 'blur(6px)' },
                    {
                        y: 0, opacity: 1, filter: 'blur(0px)',
                        duration: 0.9, ease: 'power3.out', stagger: 0.18,
                        scrollTrigger: { trigger: pillarsRef.current, start: 'top 80%' },
                    }
                )
            }
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={sectionRef} className='studio-section'>

            <div className='studio__inner'>

                {/* ── Intro ───────────────────────────────────────────────── */}
                <div className='studio__intro'>
                    <p ref={eyebrowRef} className='studio__eyebrow'>The Studio</p>

                    <h2 ref={statementRef} className='studio__statement'>
                        <span className='studio__line'>We craft digital</span>
                        <span className='studio__line studio__line--em'>experiences that</span>
                        <span className='studio__line'>are meant to be felt.</span>
                    </h2>
                </div>

                {/* ── Divider ─────────────────────────────────────────────── */}
                <div ref={dividerRef} className='studio__divider' />

                {/* ── Pillars ─────────────────────────────────────────────── */}
                <div ref={pillarsRef} className='studio__pillars'>

                    <div className='studio__pillar'>
                        <span className='pillar__number'>01</span>
                        <h3 className='pillar__title'>3D</h3>
                        <p className='pillar__desc'>
                            Sculptures, environments and characters rendered in real time.
                            Every scene is built to trigger something visceral.
                        </p>
                    </div>

                    <div className='studio__pillar'>
                        <span className='pillar__number'>02</span>
                        <h3 className='pillar__title'>Motion Design</h3>
                        <p className='pillar__desc'>
                            Sequences with weight, timing and intentionality.
                            Motion that carries meaning rather than decoration.
                        </p>
                    </div>

                    <div className='studio__pillar'>
                        <span className='pillar__number'>03</span>
                        <h3 className='pillar__title'>Immersive Web</h3>
                        <p className='pillar__desc'>
                            Interfaces that respond, breathe and surprise.
                            The browser as a canvas for cinematic interaction.
                        </p>
                    </div>

                </div>
            </div>

        </section>
    )
}

export default StudioSection

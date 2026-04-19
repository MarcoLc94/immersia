import { useState, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import Navbar from './components/Navbar'
import CustomCursor from './components/CustomCursor'
import TransitionCanvas from './components/TransitionCanvas'
import SplashScreen from './pages/splash/SplashScreen'
import HomeScreen from './pages/home/HomeScreen'
import './App.css'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

const App = () => {
    const [splashDone, setSplashDone] = useState(false)
    const [splashMounted, setSplashMounted] = useState(true)
    const [heroVisible, setHeroVisible] = useState(false)

    // ── ScrollSmoother ───────────────────────────────────────────────────────
    useEffect(() => {
        const smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 4,
            effects: true,
            smoothTouch: 0.1,
        })
        return () => smoother.kill()
    }, [])

    const handleSplashComplete = () => {
        setSplashDone(true)
        setTimeout(() => {
            setSplashMounted(false)
            setHeroVisible(true)
        }, 900)
    }

    return (
        <>
            <CustomCursor />
            <TransitionCanvas show={heroVisible} />

            {/* Navbar fuera del wrapper — position: fixed necesita estar aquí */}
            <Navbar animate={heroVisible} />

            {/* ScrollSmoother wrapper */}
            <div id="smooth-wrapper">
                <div id="smooth-content">
                    <HomeScreen splashDone={heroVisible} />
                </div>
            </div>

            {/* Splash — también fuera del wrapper */}
            {splashMounted && (
                <div className={`splash-overlay${splashDone ? ' splash-overlay--hidden' : ''}`}>
                    <SplashScreen onComplete={handleSplashComplete} />
                </div>
            )}
        </>
    )
}

export default App

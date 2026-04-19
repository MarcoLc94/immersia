import { useState } from 'react'
import SplashScreen from './pages/splash/SplashScreen'
import HomeScreen from './pages/home/HomeScreen'
import './App.css'

const App = () => {
    const [splashDone, setSplashDone] = useState(false)
    const [splashMounted, setSplashMounted] = useState(true)
    const [heroVisible, setHeroVisible] = useState(false)

    const handleSplashComplete = () => {
        setSplashDone(true)
        setTimeout(() => {
            setSplashMounted(false)
            setHeroVisible(true)
        }, 900)
    }

    return (
        <>
            <HomeScreen splashDone={heroVisible} />
            {splashMounted && (
                <div className={`splash-overlay${splashDone ? ' splash-overlay--hidden' : ''}`}>
                    <SplashScreen onComplete={handleSplashComplete} />
                </div>
            )}
        </>
    )
}

export default App

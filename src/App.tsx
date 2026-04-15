import { useState } from 'react'
import SplashScreen from './pages/splash/SplashScreen'
import HomeScreen   from './pages/home/HomeScreen'
import './App.css'

const App = () => {
    const [splashDone, setSplashDone] = useState(false)
    return (
        <div className='app-root'>
            <div className='app-layer'>
                <HomeScreen />
            </div>
            <div className={`app-layer app-layer--splash${splashDone ? ' app-layer--hidden' : ''}`}>
                <SplashScreen onComplete={() => setSplashDone(true)} />
            </div>
        </div>
    )
}

export default App

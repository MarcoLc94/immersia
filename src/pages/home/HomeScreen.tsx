import Navbar from "../../components/Navbar"

interface Props { splashDone?: boolean }

const HomeScreen = ({ splashDone = false }: Props) => {
    return (
        <div style={{ background: '#fff', minHeight: '200vh' }}>
            <Navbar animate={splashDone} />
            <section style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                paddingTop: '64px',
                boxSizing: 'border-box',
                fontFamily: 'sans-serif',
                color: '#111',
                fontSize: '1.2rem'
            }}>
                home screen works
            </section>
            <section style={{
                height: '100vh',
                background: '#f5f5f5'
            }} />
        </div>
    )
}

export default HomeScreen

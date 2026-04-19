import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Navbar from "../../components/Navbar"
import './HomeScreen.css'

interface Props { splashDone?: boolean }

const HomeScreen = ({ splashDone = false }: Props) => {
    const stageRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const mountRef = useRef<HTMLDivElement>(null)
    const floatTweenRef = useRef<gsap.core.Tween | null>(null)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isFloatingRef = useRef(false)
    const modelRef = useRef<THREE.Object3D | null>(null)
    const rafRef = useRef<number>(0)

    // ── Ocultar wrapper antes del primer paint ───────────────────────────────
    useLayoutEffect(() => {
        if (wrapperRef.current) gsap.set(wrapperRef.current, { opacity: 0, scale: 0.12 })
    }, [])

    // ── Three.js scene (deferred to RAF so CSS dimensions are computed) ──────
    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        let renderer: THREE.WebGLRenderer | null = null
        let initRaf: number
        let ro: ResizeObserver
        let camDist = 0
        const VIEWPORT_OFFSET = 0.38 // justify-end: cerca del borde derecho

        const init = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) { initRaf = requestAnimationFrame(init); return }

            const scene = new THREE.Scene()
            const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500)

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
            renderer.setPixelRatio(window.devicePixelRatio)
            renderer.setSize(w, h, false)
            renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;'
            mount.appendChild(renderer.domElement)

            const applyLookAt = (aspect: number) => {
                const hFovRad = 2 * Math.atan(Math.tan((50 * Math.PI / 180) / 2) * aspect)
                const halfW = camDist * Math.tan(hFovRad / 2)
                camera.lookAt(-halfW * VIEWPORT_OFFSET, 0, 0)
            }

            ro = new ResizeObserver(() => {
                const nw = mount.clientWidth
                const nh = mount.clientHeight
                if (!nw || !nh) return
                renderer!.setSize(nw, nh, false)
                camera.aspect = nw / nh
                camera.updateProjectionMatrix()
                if (camDist > 0) applyLookAt(nw / nh)
            })
            ro.observe(mount)

            scene.add(new THREE.AmbientLight(0xffffff, 24.0))
            const key = new THREE.DirectionalLight(0xffffff, 56.0)
            key.position.set(6, 8, 5)
            scene.add(key)
            const fill = new THREE.DirectionalLight(0xaaaaff, 32.0)
            fill.position.set(-6, 2, 3)
            scene.add(fill)
            const rim = new THREE.DirectionalLight(0xffffff, 40.0)
            rim.position.set(-2, 4, -8)
            scene.add(rim)

            new GLTFLoader().load(
                '/3d/greek-statue-3d.glb',
                ({ scene: gltf }) => {
                    const box = new THREE.Box3().setFromObject(gltf)
                    const center = box.getCenter(new THREE.Vector3())
                    const size = box.getSize(new THREE.Vector3())
                    gltf.position.sub(center)

                    const maxDim = Math.max(size.x, size.y, size.z)
                    const fovRad = (50 * Math.PI) / 180
                    camDist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.2
                    camera.position.set(0, 0, camDist)
                    applyLookAt(camera.aspect)

                    gltf.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh
                            mesh.material = new THREE.MeshStandardMaterial({
                                color: 0x1a1a1a,
                                roughness: 0.95,
                                metalness: 0.0,
                            })
                        }
                    })

                    scene.add(gltf)
                    modelRef.current = gltf
                },
                undefined,
                (err) => console.error('[GLB] Error al cargar:', err)
            )

            const tick = () => {
                rafRef.current = requestAnimationFrame(tick)
                renderer!.render(scene, camera)
            }
            tick()
        }

        initRaf = requestAnimationFrame(init)

        return () => {
            cancelAnimationFrame(initRaf)
            cancelAnimationFrame(rafRef.current)
            renderer?.dispose()
            if (renderer && mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement)
            }
            ro.disconnect()
        }
    }, [])

    // ── Mouse + float ────────────────────────────────────────────────────────
    useEffect(() => {
        const stage = stageRef.current
        const wrapper = wrapperRef.current
        if (!stage || !wrapper) return

        const startFloat = () => {
            isFloatingRef.current = true
            gsap.to(wrapper, { x: 0, y: 0, duration: 1.4, ease: 'expo.out' })
            floatTweenRef.current?.kill()
            floatTweenRef.current = gsap.to(wrapper, {
                y: -18, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
            })
        }

        const stopFloat = () => {
            if (!isFloatingRef.current) return
            isFloatingRef.current = false
            floatTweenRef.current?.kill()
            floatTweenRef.current = null
            gsap.to(wrapper, { y: 0, duration: 0.35, ease: 'power2.out' })
        }

        const qx = gsap.quickTo(wrapper, 'x', { duration: 0.9, ease: 'power2.out' })
        const qy = gsap.quickTo(wrapper, 'y', { duration: 0.9, ease: 'power2.out' })

        const handleMouseMove = (e: MouseEvent) => {
            const rect = stage.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / rect.width - 0.5
            const ny = (e.clientY - rect.top) / rect.height - 0.5
            qx(nx * -45)
            qy(ny * -28)

            if (modelRef.current) {
                gsap.to(modelRef.current.rotation, { y: -0.3 + nx * 0.6, duration: 0.9, ease: 'power2.out' })
            }

            stopFloat()
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            idleTimerRef.current = setTimeout(startFloat, 1800)
        }

        stage.addEventListener('mousemove', handleMouseMove)
        return () => {
            stage.removeEventListener('mousemove', handleMouseMove)
            floatTweenRef.current?.kill()
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [])

    // ── Entrance: dispara cuando el splash termina ───────────────────────────
    useEffect(() => {
        if (!splashDone) return
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const duration = 3.5

        gsap.fromTo(wrapper,
            { scale: 0.12, opacity: 0 },
            { scale: 1, opacity: 1, duration, ease: 'power3.out' }
        )

        const poll = setInterval(() => {
            if (!modelRef.current) return
            clearInterval(poll)
            const model = modelRef.current
            model.rotation.y = -Math.PI * 1.5
            gsap.to(model.rotation, {
                y: -0.3, duration,
                ease: 'power3.out',
                onComplete: () => {
                    isFloatingRef.current = true
                    floatTweenRef.current?.kill()
                    floatTweenRef.current = gsap.to(wrapper, {
                        y: -18, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
                    })
                },
            })
        }, 50)

        return () => clearInterval(poll)
    }, [splashDone])

    return (
        <div className='home'>
            <Navbar animate={splashDone} />
            <section className='home__section'>
                <div className='home__stage' ref={stageRef}>
                    <div className='statue-wrapper' ref={wrapperRef}>
                        <div ref={mountRef} className='statue-canvas' />
                    </div>
                </div>
            </section>
            <section className='home__section--alt' />
        </div>
    )
}

export default HomeScreen

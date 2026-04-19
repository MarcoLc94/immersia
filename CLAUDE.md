# Immersia Lab — proto-pegasi

Estudio de experiencias web inmersivas. El objetivo es que cada interacción se sienta cinematográfica, táctil y con personalidad.

## Stack

- **Framework**: Astro 6 (SSG/SSR) con islas de React 19
- **Animación**: GSAP 3.15 — librería principal para todo lo que se mueve
- **Audio**: Web Audio API nativa (AudioContext, OscillatorNode, GainNode)
- **Lenguaje**: TypeScript estricto
- **CSS**: Plain CSS por componente (sin Tailwind, sin SCSS)
- **Package manager**: pnpm
- **Node**: >=22.12.0

## Arquitectura

```
src/
  components/     # Componentes reutilizables (Navbar, etc.)
  layouts/        # Layout.astro — shell HTML base
  pages/
    splash/       # SplashScreen.tsx — pantalla de entrada animada
    home/         # HomeScreen.tsx
  assets/
```

- Las páginas `.astro` son el shell; la lógica interactiva vive en componentes `.tsx`
- GSAP se importa directamente en los componentes React que lo necesitan
- Los refs de GSAP se limpian siempre en el `useEffect` de cleanup

## Filosofía de diseño

- **Inmersivo primero**: cada pantalla es una experiencia, no una página
- **Audio reactivo**: los sonidos refuerzan el feedback visual (Web Audio API, no assets de audio)
- **Micro-interacciones con peso**: los elementos tienen inercia, rebote, y timing cinematográfico
- **Dark mode nativo**: el proyecto vive en oscuridad — fondos negros, tipografía luminosa
- **Sin distracciones**: UI mínima, sin scroll convencional donde no sea necesario

## Convenciones GSAP

- Usar `gsap.set()` antes de `gsap.to()` para establecer estado inicial
- Guardar tweens en `tweensRef` y llamar `.kill()` en cleanup
- Eases preferidos: `back.out(2)`, `power2.in`, `expo.out` para movimientos expresivos
- `gsap.delayedCall()` para secuencias con pausa entre estados
- No usar ScrollTrigger aún — el proyecto no tiene scroll storytelling todavía

## Convenciones CSS

- Variables CSS para colores y espaciado (definidas en `:root` o por componente)
- Animaciones idle (`@keyframes`) para estados de espera, GSAP para animaciones disparadas
- `transform-origin` siempre declarado explícitamente cuando se anima `scale`
- Evitar `transition` en elementos que GSAP va a animar (conflictos)

## Identidad visual

- **Marca**: IMMERSIA LAB
- **Slogan**: "feeling the interaction"
- **Tipografía**: por definir — actualmente hereda del sistema
- **Paleta**: negros profundos, blancos, acentos a definir por pantalla

## Lo que NO hacer

- No añadir Tailwind — el CSS es intencional y artesanal
- No usar librerías de componentes UI (MUI, shadcn, etc.)
- No animar con `transition` CSS lo que GSAP puede hacer mejor
- No crear abstracciones prematuras — cada componente tiene su propia lógica de animación
- No agregar dependencias sin necesidad clara

/**
 * Extrae frames del video de la estatua y remueve el fondo negro con colorkey.
 * Outputs: public/frames/frame_XXXX.png  +  src/pages/home/frameCount.ts
 *
 * Ajusta SIMILARITY si queda fondo residual (subir) o se come la estatua (bajar).
 */

import { execSync }                        from 'child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname }                   from 'path'
import { fileURLToPath }                   from 'url'
import ffmpegPath                          from 'ffmpeg-static'

const SIMILARITY = 0.30   // tolerancia del colorkey (0.01 estricto — 1.0 todo)
const BLEND      = 0.08   // suavizado de bordes
const FPS        = 24     // frames por segundo a extraer

const __dir   = dirname(fileURLToPath(import.meta.url))
const root    = join(__dir, '..')
const input   = join(root, 'public/video/greek-statue.mp4')
const outDir  = join(root, 'public/frames')
const pattern = join(outDir, 'frame_%04d.png')
const manifest = join(root, 'src/pages/home/frameCount.ts')

if (!existsSync(input)) {
    console.error(`❌ No se encontró: ${input}`)
    process.exit(1)
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const filter = [
    `fps=${FPS}`,
    `colorkey=color=0x000000:similarity=${SIMILARITY}:blend=${BLEND}`,
].join(',')

const ffmpeg = ffmpegPath.replace(/"/g, '')
const cmd = `"${ffmpeg}" -y -i "${input}" -vf "${filter}" -pix_fmt rgba "${pattern}"`

console.log('🎬 Extrayendo frames con colorkey negro...')
execSync(cmd, { stdio: 'inherit', shell: true })

const count = readdirSync(outDir).filter(f => f.endsWith('.png')).length

writeFileSync(manifest, `export const FRAME_COUNT = ${count}\n`)

console.log(`✅ ${count} frames → public/frames/`)
console.log(`✅ Manifest → src/pages/home/frameCount.ts`)

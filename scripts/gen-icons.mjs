// Generates public/icon-192.png, icon-512.png, apple-touch-icon.png
// Dark background (#141d19) with a terracotta breathing orb (#cd6f4c).
// Uses only Node built-ins (zlib) — no extra dependencies.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
mkdirSync(publicDir, { recursive: true })

// CRC32 table
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c >>> 0
}

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = ((crcTable[(crc ^ b) & 0xff] >>> 0) ^ (crc >>> 8)) >>> 0
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crcBuf])
}

function makePNG(size) {
  const BG  = [0x14, 0x1d, 0x19]   // --bg  #141d19
  const ORB = [0xcd, 0x6f, 0x4c]   // --terra #cd6f4c
  const cx = size / 2, cy = size / 2
  const rOuter = size * 0.30, rInner = size * 0.18

  const IHDR = Buffer.alloc(13)
  IHDR.writeUInt32BE(size, 0)
  IHDR.writeUInt32BE(size, 4)
  IHDR[8] = 8   // bit depth
  IHDR[9] = 2   // colour type: RGB

  const rowBytes = 1 + size * 3
  const raw = Buffer.alloc(size * rowBytes)

  for (let y = 0; y < size; y++) {
    const off = y * rowBytes
    raw[off] = 0  // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy
      const d2 = dx * dx + dy * dy
      const inRing = d2 <= rOuter * rOuter && d2 >= rInner * rInner
      const [r, g, b] = inRing ? ORB : BG
      raw[off + 1 + x * 3]     = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  const idat = deflateSync(raw)

  return Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n', 'binary'),
    pngChunk('IHDR', IHDR),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(resolve(publicDir, 'icon-192.png'), makePNG(192))
writeFileSync(resolve(publicDir, 'icon-512.png'), makePNG(512))
writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), makePNG(180))
console.log('Icons written to public/')

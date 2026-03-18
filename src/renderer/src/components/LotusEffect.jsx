import React, { useEffect, useRef } from 'react'

function playBellSound() {
  try {
    const audio = new Audio(new URL('../../../public/sounds/bell.mp3', import.meta.url).href)
    audio.volume = 0.6
    audio.play().catch(() => {})
  } catch (_) {
    // Audio unavailable — fail silently
  }
}

function drawPetal(ctx, size) {
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.bezierCurveTo(size * 0.55, -size * 0.65, size * 0.45, size * 0.25, 0, size * 0.5)
  ctx.bezierCurveTo(-size * 0.45, size * 0.25, -size * 0.55, -size * 0.65, 0, -size)
  ctx.closePath()
}

const PETAL_COLORS = [
  [255, 182, 210],   // soft rose
  [255, 210, 230],   // pale blush
  [255, 255, 255],   // white
  [220, 190, 255],   // lavender
  [255, 160, 190],   // warm pink
  [240, 220, 255],   // soft violet
]

export default function LotusEffect({ soundEnabled = true }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (soundEnabled) playBellSound()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const petals = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: -30 - Math.random() * 120,
      vy: 0.55 + Math.random() * 0.75,
      swayAmp: 1.0 + Math.random() * 1.8,
      swayFreq: 0.008 + Math.random() * 0.016,
      swayOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.018,
      size: 11 + Math.random() * 15,
      baseAlpha: 0.65 + Math.random() * 0.3,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      t: Math.random() * 100,
    }))

    const startTime = Date.now()
    let frame

    function animate() {
      const age = (Date.now() - startTime) / 1000

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of petals) {
        p.t += 1
        p.y += p.vy
        p.x += Math.sin(p.t * p.swayFreq * 60 + p.swayOffset) * p.swayAmp * 0.05
        p.rotation += p.rotSpeed

        // Fade out over the final second
        let alpha = p.baseAlpha
        if (age > 2.5) {
          alpha *= Math.max(0, 1 - (age - 2.5) / 1.0)
        }

        if (p.y < canvas.height + 60 && alpha > 0.01) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)

          const [r, g, b] = p.color
          const grad = ctx.createRadialGradient(0, -p.size * 0.25, p.size * 0.05, 0, 0, p.size)
          grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.95})`)
          grad.addColorStop(0.35, `rgba(${r},${g},${b},${alpha})`)
          grad.addColorStop(1, `rgba(${Math.round(r * 0.65)},${Math.round(g * 0.65)},${Math.round(b * 0.65)},${alpha * 0.4})`)

          drawPetal(ctx, p.size)
          ctx.fillStyle = grad
          ctx.fill()

          // Central vein — delicate highlight
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 0.85)
          ctx.quadraticCurveTo(0, p.size * 0.1, 0, p.size * 0.45)
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.35})`
          ctx.lineWidth = 0.6
          ctx.stroke()

          ctx.restore()
        }
      }

      if (age < 3.5) {
        frame = requestAnimationFrame(animate)
      }
    }

    animate()
    return () => cancelAnimationFrame(frame)
  }, [soundEnabled])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 9999
      }}
    />
  )
}

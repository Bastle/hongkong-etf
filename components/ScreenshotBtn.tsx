import type { RefObject } from 'react'

interface ScreenshotBtnProps {
  canvasRef: RefObject<HTMLCanvasElement>
}

export default function ScreenshotBtn({ canvasRef }: ScreenshotBtnProps) {
  function handleScreenshot() {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `hk-stock-heatmap-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <button
      onClick={handleScreenshot}
      className="absolute bottom-2 left-2 z-10 px-2 py-1 text-xs bg-white/10 text-gray-400 rounded hover:bg-white/20 transition-colors"
      title="下载截图"
    >
      📷 截图
    </button>
  )
}

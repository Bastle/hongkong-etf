import { ref, onUnmounted } from 'vue'

interface AutoRefreshOptions {
  interval?: number
  jitter?: number
}

export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  options: AutoRefreshOptions = {},
) {
  const { interval = 8000, jitter = 2000 } = options
  const isActive = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let paused = false

  function scheduleNext() {
    if (paused || !isActive.value) return
    const delay = interval + (Math.random() * 2 - 1) * jitter
    timer = setTimeout(async () => {
      if (paused || !isActive.value) return
      await fetchFn()
      scheduleNext()
    }, Math.max(1000, delay))
  }

  function start() {
    if (isActive.value) return
    isActive.value = true
    scheduleNext()
  }

  function stop() {
    isActive.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function handleVisibility() {
    if (document.hidden) {
      paused = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    } else {
      paused = false
      if (isActive.value) {
        fetchFn().then(() => scheduleNext())
      }
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility)
  }

  onUnmounted(() => {
    stop()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  })

  return { start, stop, isActive }
}

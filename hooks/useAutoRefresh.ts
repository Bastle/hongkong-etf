import { useEffect, useRef, useCallback, useState } from 'react'

interface AutoRefreshOptions {
  interval?: number
  jitter?: number
}

export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  options: AutoRefreshOptions = {},
) {
  const { interval = 8000, jitter = 2000 } = options
  const [isActive, setIsActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const scheduleNext = useCallback(() => {
    if (!isActive) return
    const delay = Math.max(1000, interval + (Math.random() * 2 - 1) * jitter)
    timerRef.current = setTimeout(async () => {
      await fetchFnRef.current()
      scheduleNext()
    }, delay)
  }, [isActive, interval, jitter])

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    if (!isActive) return

    // 立即执行一次
    fetchFnRef.current().then(() => scheduleNext())

    // 页面隐藏时暂停，恢复时立即刷新
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = undefined
        }
      } else {
        fetchFnRef.current().then(() => scheduleNext())
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isActive, scheduleNext])

  return { start, stop, isActive }
}

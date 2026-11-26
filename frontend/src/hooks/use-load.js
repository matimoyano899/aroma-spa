import { useEffect, useState } from 'react'

export function useLoad(load) {
  const [result, setResult] = useState({
    load: null,
    data: null,
    error: '',
    busy: true,
  })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ load, data, error: '', busy: false })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ load, data: null, error: error.message, busy: false })
      })
    return () => controller.abort()
  }, [load, retry])
  return {
    ...(result.load === load ? result : { data: null, error: '', busy: true }),
    reload() {
      setResult({ load, data: null, error: '', busy: true })
      setRetry((value) => value + 1)
    },
  }
}

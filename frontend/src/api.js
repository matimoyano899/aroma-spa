const base = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
)

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function api(path, { method = 'GET', body, signal, token } = {}) {
  let res
  try {
    res = await fetch(base + '/api' + path, {
      method,
      signal,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: 'Bearer ' + token }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(
      0,
      'No pudimos comunicarnos con la agenda. Revisá tu conexión y probá de nuevo.',
    )
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok || !json) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('aroma:session-expired', { detail: token }))
    }
    throw new ApiError(
      res.status,
      json?.error?.message ?? 'La agenda no pudo completar la solicitud.',
      json?.error?.code,
    )
  }
  return json.data
}

import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { api } from './api'
import { Notice } from './components/ui'

const Context = createContext(null)
const key = 'aroma-spa-session'

export function SessionProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(key))
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(Boolean(token))
  const [sessionError, setSessionError] = useState('')
  const [retry, setRetry] = useState(0)

  function logout() {
    sessionStorage.removeItem(key)
    setToken(null)
    setUser(null)
    setChecking(false)
    setSessionError('')
  }

  function login(next) {
    sessionStorage.setItem(key, next.token)
    setToken(next.token)
    setUser(next.user)
    setChecking(false)
    setSessionError('')
  }

  useEffect(() => {
    if (!token) return
    const abort = new AbortController()
    const expired = (event) => {
      if (event.detail === token) logout()
    }
    window.addEventListener('aroma:session-expired', expired)
    if (!user) {
      api('/auth/me', { token, signal: abort.signal })
        .then((next) => {
          if (!abort.signal.aborted) setUser(next)
        })
        .catch((error) => {
          if (!abort.signal.aborted && error.status !== 401)
            setSessionError(error.message)
        })
        .finally(() => {
          if (!abort.signal.aborted) setChecking(false)
        })
    }
    return () => {
      window.removeEventListener('aroma:session-expired', expired)
      abort.abort()
    }
  }, [token, user, retry])

  function retrySession() {
    setSessionError('')
    setChecking(true)
    setRetry((value) => value + 1)
  }

  return (
    <Context.Provider
      value={{ token, user, checking, sessionError, retrySession, login, logout }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSession = () => useContext(Context)

export function PrivateRoute({ admin = false }) {
  const { user, checking, sessionError, retrySession, logout } = useSession()
  const location = useLocation()
  if (checking) return <Notice loading>Comprobando la sesión…</Notice>
  if (sessionError)
    return (
      <section className="shell narrow page-section">
        <Notice error>{sessionError}</Notice>
        <div className="actions">
          <button className="button primary" onClick={retrySession}>
            Reintentar
          </button>
          <button className="button secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    )
  if (!user)
    return (
      <Navigate
        to="/ingresar"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  if (admin && user.role !== 'admin') return <Navigate to="/mis-turnos" replace />
  return <Outlet />
}

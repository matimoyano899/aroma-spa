import { useState } from 'react'
import { ArrowRight, MailCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { api } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { Notice } from '../components/ui'
import { useSession } from '../session'

export function AuthForm({ mode }) {
  const register = mode === 'register'
  const resend = mode === 'resend'
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useSession()
  const [sent, setSent] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const requested = location.state?.from
  const from =
    typeof requested === 'string' && /^\/(?![\\/])/.test(requested)
      ? requested
      : undefined

  async function submit(event) {
    event.preventDefault()
    const body = Object.fromEntries(new FormData(event.currentTarget))
    body.email = body.email.trim()
    setBusy(true)
    setError(null)
    setSent('')
    try {
      const result = await api('/auth/' + mode, { method: 'POST', body })
      if (register || resend) {
        setSent(result.message)
      } else {
        login(result)
        navigate(from ?? '/mis-turnos', { replace: true })
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title={
        register ? 'Creá tu cuenta' : resend ? 'Pedí un nuevo enlace' : 'Iniciá sesión'
      }
      subtitle={
        register
          ? 'Una cuenta para reservar y gestionar tus turnos.'
          : resend
            ? 'Te enviamos un enlace para confirmar tu correo.'
            : 'Accedé a tus turnos o reservá una sesión.'
      }
    >
      {!sent && (
        <form onSubmit={submit} className="form-stack">
          {register && (
            <label>
              Nombre{' '}
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          <label>
            Correo electrónico{' '}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          {!resend && (
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={register ? 10 : 1}
                maxLength={72}
              />
              {register && <small>Usá al menos 10 caracteres.</small>}
            </label>
          )}
          {error && <Notice error>{error.message}</Notice>}
          <button className="button primary full" type="submit" disabled={busy}>
            {busy
              ? 'Enviando…'
              : register
                ? 'Crear cuenta'
                : resend
                  ? 'Enviar enlace'
                  : 'Ingresar'}{' '}
            <ArrowRight size={16} />
          </button>
        </form>
      )}
      {sent && <Notice success>{sent}</Notice>}
      <div className="form-links">
        {!register && !resend ? (
          <p>
            ¿Primera vez?{' '}
            <Link to="/registro" state={{ from }}>
              Creá una cuenta
            </Link>
          </p>
        ) : (
          <Link to="/ingresar" state={{ from }}>
            Volver a iniciar sesión
          </Link>
        )}
        {!resend && (!register || sent || error) && (
          <Link to="/reenviar-enlace" state={{ from }}>
            Reenviar enlace de verificación
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}

export function VerifyEmail() {
  const location = useLocation()
  const [token] = useState(() =>
    new URLSearchParams(location.hash.slice(1)).get('token'),
  )
  const [phase, setPhase] = useState('ready')
  const [message, setMessage] = useState('')
  async function confirm() {
    setPhase('busy')
    try {
      const result = await api('/auth/verify', { method: 'POST', body: { token } })
      setMessage(result.message)
      setPhase('success')
      const clean = new URL(window.location.href)
      clean.hash = ''
      window.history.replaceState(window.history.state, '', clean)
    } catch (error) {
      setMessage(error.message)
      setPhase('error')
    }
  }
  return (
    <AuthLayout
      title="Confirmá tu correo"
      subtitle="Activá tu cuenta de Aroma Spa para poder reservar."
    >
      <div className="form-stack">
        {phase === 'success' && <Notice success>{message}</Notice>}
        {(phase === 'error' || !token) && (
          <Notice error>
            {message || 'El enlace no incluye un código de verificación.'}
          </Notice>
        )}
        {token && phase !== 'success' && (
          <button
            className="button primary full"
            onClick={confirm}
            disabled={phase === 'busy'}
          >
            <MailCheck size={17} />{' '}
            {phase === 'busy' ? 'Confirmando…' : 'Confirmar correo'}
          </button>
        )}
        {phase === 'success' ? (
          <Link className="button primary full" to="/ingresar">
            Ir a iniciar sesión <ArrowRight size={16} />
          </Link>
        ) : (
          <Link className="text-link" to="/reenviar-enlace">
            Pedir otro enlace
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}

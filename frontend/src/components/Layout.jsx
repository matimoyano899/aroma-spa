import { Instagram } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useEffect, useRef } from 'react'
import { useSession } from '../session'
import { WhatsAppLink } from './WhatsAppLink'

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Aroma Spa, inicio">
      <img src="/aroma-logo.webp" width="66" height="70" alt="" />
    </Link>
  )
}

export function Layout() {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const lastPath = useRef(location.pathname)
  useEffect(() => {
    if (lastPath.current !== location.pathname) {
      window.scrollTo(0, 0)
      document.getElementById('contenido')?.focus({ preventScroll: true })
      lastPath.current = location.pathname
    }
  }, [location.pathname])

  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <header className="site-header">
        <div className="shell header-row">
          <Brand />
          <nav aria-label="Navegación principal">
            <NavLink to="/servicios">Servicios</NavLink>
            <WhatsAppLink className="nav-contact" />
            {user && (
              <NavLink to="/mis-turnos">
                {user.role === 'admin' ? 'Agenda' : 'Mis turnos'}
              </NavLink>
            )}
            {user?.role === 'admin' && <NavLink to="/admin/servicios">Panel</NavLink>}
          </nav>
          <div className="header-actions">
            {user ? (
              <button
                className="header-session"
                type="button"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Salir
              </button>
            ) : (
              <Link className="header-session" to="/ingresar">
                Ingresar
              </Link>
            )}
            <Link to="/reservar" className="button primary header-book">
              Reservar
            </Link>
          </div>
        </div>
      </header>
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="shell footer-row">
          <div>
            <Brand />
            <p>Masajes y estética en Sierras Bayas.</p>
          </div>
          <div className="footer-contact">
            <WhatsAppLink label="2284 606371" />
            <a
              className="text-link ig"
              href="https://www.instagram.com/aroma_spagm/"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={17} aria-hidden="true" /> @aroma_spagm
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}

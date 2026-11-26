import { AlertCircle, ArrowUpRight, Check, Clock3, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'
import { priceLabel } from '../format'

export function Notice({ children, error, loading, success }) {
  const Icon = loading ? LoaderCircle : error ? AlertCircle : success ? Check : null
  return (
    <div
      className={'notice' + (error ? ' error' : '') + (success ? ' success' : '')}
      role={error ? 'alert' : 'status'}
    >
      {Icon && (
        <Icon size={18} className={loading ? 'spin' : undefined} aria-hidden="true" />
      )}
      <span>{children}</span>
    </div>
  )
}

export function LoadPanel({ busy, error, reload, children }) {
  if (busy) return <Notice loading>Cargando…</Notice>
  if (error)
    return (
      <div>
        <Notice error>{error}</Notice>
        <button type="button" className="button secondary retry" onClick={reload}>
          Reintentar
        </button>
      </div>
    )
  return children
}

export function ServiceCard({ service }) {
  return (
    <article className="service-row">
      <div>
        <h3>{service.name}</h3>
        <p>{service.description}</p>
      </div>
      <div className="service-meta">
        <span className="service-time">
          <Clock3 size={15} aria-hidden="true" /> Aprox. {service.duration} min
        </span>
        <span>{priceLabel(service.price)}</span>
      </div>
      <Link
        className="text-link service-action"
        to={'/servicios/' + service.id}
        aria-label={'Ver detalle de ' + service.name}
      >
        Ver detalle <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}

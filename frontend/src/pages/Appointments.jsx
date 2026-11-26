import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Plus } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { api } from '../api'
import { Empty, LoadPanel, Notice } from '../components/ui'
import { dayLabel, hourLabel, priceLabel } from '../format'
import { useLoad } from '../hooks/use-load'
import { useSession } from '../session'

export function AppointmentList() {
  const { user, token } = useSession()
  const [period, setPeriod] = useState('upcoming')
  const [page, setPage] = useState(1)
  const { state } = useLocation()
  const result = useLoad(
    useCallback(
      (signal) =>
        api('/appointments?' + new URLSearchParams({ period, page }), {
          token,
          signal,
        }),
      [period, page, token],
    ),
  )

  return (
    <section className="shell page-section">
      <div className="page-intro split-intro">
        <div>
          <p className="eyebrow">Aroma Spa</p>
          <h1>{user.role === 'admin' ? 'Agenda de turnos' : 'Mis turnos'}</h1>
          <p>
            {user.role === 'admin'
              ? 'Revisá las reservas del estudio.'
              : 'Consultá y gestioná tus reservas.'}
          </p>
        </div>
        <Link to="/reservar" className="button primary">
          <Plus size={16} /> Reservar una sesión
        </Link>
      </div>
      {state?.notice && <Notice success>{state.notice}</Notice>}
      <div className="tabs" aria-label="Período de turnos">
        <button
          type="button"
          aria-pressed={period === 'upcoming'}
          onClick={() => {
            setPeriod('upcoming')
            setPage(1)
          }}
        >
          Próximos
        </button>
        <button
          type="button"
          aria-pressed={period === 'past'}
          onClick={() => {
            setPeriod('past')
            setPage(1)
          }}
        >
          Anteriores
        </button>
      </div>
      <LoadPanel {...result}>
        {result.data?.items.length === 0 ? (
          <Empty title="No hay turnos para mostrar">
            {period === 'upcoming'
              ? 'Las próximas reservas van a aparecer acá.'
              : 'Todavía no hay reservas pasadas.'}
          </Empty>
        ) : (
          <div className="appointment-list">
            {result.data?.items.map((item) => (
              <article className="appointment-row" key={item.id}>
                <div className="appointment-symbol">
                  <CalendarDays size={22} strokeWidth={1.45} />
                </div>
                <div>
                  <h2>{item.serviceName}</h2>
                  <p>
                    {dayLabel(item.startAt)} · {hourLabel(item.startAt)} h
                  </p>
                  {item.client && (
                    <p>
                      {item.client.name} · {item.client.email}
                    </p>
                  )}
                </div>
                <Link
                  className="text-link"
                  to={'/mis-turnos/' + item.id}
                  aria-label={
                    'Ver turno: ' + item.serviceName + ', ' + dayLabel(item.startAt)
                  }
                >
                  Ver turno <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        )}
        {(page > 1 || result.data?.total > result.data?.limit) && (
          <div className="pagination">
            <button
              type="button"
              className="button secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              type="button"
              className="button secondary"
              disabled={page * result.data?.limit >= result.data?.total}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </LoadPanel>
    </section>
  )
}

export function AppointmentDetail() {
  const { id } = useParams()
  const { token, user } = useSession()
  const { state } = useLocation()
  const navigate = useNavigate()
  const result = useLoad(
    useCallback((signal) => api('/appointments/' + id, { token, signal }), [id, token]),
  )
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const dialog = useRef(null)
  const item = result.data
  const future = item && new Date(item.startAt) > new Date()

  async function remove() {
    setRemoving(true)
    setError('')
    try {
      await api('/appointments/' + id, { method: 'DELETE', token })
      dialog.current?.close()
      navigate('/mis-turnos', {
        replace: true,
        state: { notice: 'El turno fue cancelado.' },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className="shell narrow page-section">
      <Link className="text-link back-link" to="/mis-turnos">
        <ArrowLeft size={16} /> Volver a la agenda
      </Link>
      {state?.notice && <Notice success>{state.notice}</Notice>}
      <LoadPanel {...result}>
        {item && (
          <article className="panel detail-panel">
            <p className="eyebrow">
              {future ? 'Reserva confirmada' : 'Reserva anterior'}
            </p>
            <h1>{item.serviceName}</h1>
            <ul className="summary-details">
              <li>
                <CalendarDays size={19} /> {dayLabel(item.startAt)}
              </li>
              <li>
                <Clock3 size={19} /> {hourLabel(item.startAt)}–{hourLabel(item.endAt)} h
                · {item.duration} min
              </li>
            </ul>
            {item.client && (
              <p>
                Cliente: {item.client.name} ({item.client.email})
              </p>
            )}
            <p className="price">{priceLabel(item.price)}</p>
            <div className="actions">
              {future && (
                <Link className="button primary" to={'/mis-turnos/' + id + '/editar'}>
                  Reprogramar turno
                </Link>
              )}
              {(future || user.role === 'admin') && (
                <button
                  type="button"
                  className="button danger"
                  onClick={() => {
                    setError('')
                    dialog.current.showModal()
                  }}
                >
                  Cancelar turno
                </button>
              )}
            </div>
          </article>
        )}
      </LoadPanel>
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (removing) event.preventDefault()
        }}
        aria-labelledby="cancelar-titulo"
      >
        <h2 id="cancelar-titulo">¿Cancelar este turno?</h2>
        <p>El horario vuelve a quedar disponible en la agenda.</p>
        {error && <Notice error>{error}</Notice>}
        <div className="actions">
          <button
            className="button secondary"
            type="button"
            disabled={removing}
            onClick={() => dialog.current.close()}
          >
            Conservar turno
          </button>
          <button
            className="button danger"
            type="button"
            disabled={removing}
            onClick={remove}
          >
            {removing ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
        </div>
      </dialog>
    </section>
  )
}

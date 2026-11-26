import { useCallback, useRef, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../api'
import { Empty, LoadPanel, Notice } from '../components/ui'
import { addDays, dayKey, dayLabel, hourLabel, priceLabel, zone } from '../format'
import { useLoad } from '../hooks/use-load'
import { useSession } from '../session'

const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: zone })
const month = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: zone,
})
const noon = (day) => new Date(day + 'T12:00:00-03:00')

function ServicePicker({ catalog, selected, onChoose }) {
  const details = useRef(null)
  const summary = useRef(null)

  function close() {
    details.current.open = false
    summary.current.focus()
  }

  return (
    <details
      className="booking-picker"
      ref={details}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !details.current.open) return
        event.preventDefault()
        close()
      }}
    >
      <summary ref={summary}>
        <span>
          <span className="booking-picker-label">Servicio</span>
          <span className="booking-picker-name">{selected.name}</span>
          <span className="booking-picker-meta">
            {selected.duration} min · {priceLabel(selected.price)}
          </span>
        </span>
        <ChevronDown className="booking-picker-chevron" size={20} aria-hidden="true" />
      </summary>
      <ul className="booking-picker-options" aria-label="Servicios disponibles">
        {catalog.map((item) => {
          const active = item.id === selected.id
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (!active) onChoose(item.id)
                  close()
                }}
              >
                <span>
                  <span className="booking-picker-option-name">{item.name}</span>
                  <span className="booking-picker-meta">
                    {item.duration} min · {priceLabel(item.price)}
                  </span>
                </span>
                {active && <Check size={17} aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

export function BookingPage() {
  const { id } = useParams()
  if (id) return <EditBooking key={id} id={id} />
  return <BookingScreen key="new" />
}

function EditBooking({ id }) {
  const { token } = useSession()
  const appointment = useLoad(
    useCallback((signal) => api('/appointments/' + id, { signal, token }), [id, token]),
  )
  if (appointment.busy || appointment.error) {
    return (
      <section className="shell page-section">
        <LoadPanel {...appointment} />
      </section>
    )
  }
  return <BookingScreen initial={appointment.data} />
}

function BookingScreen({ initial }) {
  const { token } = useSession()
  const [search] = useSearchParams()
  const catalog = useLoad(useCallback((signal) => api('/services', { signal }), []))
  return (
    <section className="shell page-section">
      {initial && (
        <Link to={'/mis-turnos/' + initial.id} className="back-link text-link">
          <ArrowLeft size={15} /> Volver al turno
        </Link>
      )}
      <div className="page-intro booking-intro">
        <p className="eyebrow">Agenda online</p>
        <h1>{initial ? 'Reprogramar turno' : 'Reservá tu sesión'}</h1>
        <p>
          {initial
            ? 'Elegí un nuevo servicio u horario para tu reserva.'
            : 'Elegí el masaje, el día y el horario que te queden cómodos.'}
        </p>
      </div>
      <LoadPanel {...catalog}>
        {catalog.data?.length > 0 ? (
          <BookingForm
            initial={initial}
            catalog={catalog.data}
            token={token}
            requested={search.get('servicio')}
          />
        ) : (
          <Empty title="La agenda todavía no está abierta">
            Los horarios van a aparecer cuando haya servicios disponibles.
          </Empty>
        )}
      </LoadPanel>
    </section>
  )
}

function BookingForm({ initial, catalog, token, requested }) {
  const navigate = useNavigate()
  const today = dayKey()
  const maxDay = addDays(today, 60)
  const preselected = initial?.serviceId ?? requested
  const [serviceId, setServiceId] = useState(() =>
    catalog.some((item) => item.id === preselected) ? preselected : catalog[0].id,
  )
  const [date, setDate] = useState(() => {
    const current = initial ? dayKey(initial.startAt) : today
    return current >= today && current <= maxDay ? current : today
  })
  const [week, setWeek] = useState(() => {
    const days = Math.round((noon(date) - noon(today)) / 86_400_000)
    return Math.floor(days / 7)
  })
  const [startAt, setStartAt] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const period = Array.from({ length: 7 }, (_, i) =>
    addDays(today, week * 7 + i),
  ).filter((day) => day <= maxDay)
  const selected = catalog.find((item) => item.id === serviceId)

  const availability = useLoad(
    useCallback(
      (signal) => {
        const params = new URLSearchParams({ serviceId, date })
        if (initial?.id) params.set('excludeId', initial.id)
        return api('/appointments/availability?' + params, { signal, token })
      },
      [date, initial?.id, serviceId, token],
    ),
  )
  const available = availability.data?.includes(startAt)

  function chooseDay(day) {
    setDate(day)
    setStartAt('')
    setError('')
  }

  function changeWeek(next) {
    setWeek(next)
    chooseDay(addDays(today, next * 7))
  }

  async function reserve(event) {
    event.preventDefault()
    if (!available) return
    setError('')
    setSubmitting(true)
    try {
      const result = await api('/appointments' + (initial ? '/' + initial.id : ''), {
        method: initial ? 'PUT' : 'POST',
        token,
        body: { serviceId, startAt },
      })
      navigate('/mis-turnos/' + result.id, {
        replace: true,
        state: {
          notice: initial ? 'Reprogramaste tu turno.' : 'Tu turno está confirmado.',
        },
      })
    } catch (err) {
      if (err.code === 'SLOT_TAKEN') {
        setStartAt('')
        availability.reload()
      }
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="booking-grid" onSubmit={reserve}>
      <div className="panel booking-panel">
        <ServicePicker
          catalog={catalog}
          selected={selected}
          onChoose={(id) => {
            setServiceId(id)
            setStartAt('')
            setError('')
          }}
        />
        <div className="calendar-top">
          <h2>{month.format(noon(period[0]))}</h2>
          <div className="calendar-arrows">
            <button
              type="button"
              className="icon-button"
              aria-label="Semana anterior"
              disabled={week === 0}
              onClick={() => changeWeek(week - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Semana siguiente"
              disabled={week === 8}
              onClick={() => changeWeek(week + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="calendar-days" role="group" aria-label="Elegí un día">
          {period.map((day) => (
            <button
              type="button"
              key={day}
              className="calendar-day"
              aria-label={dayLabel(noon(day))}
              aria-pressed={date === day}
              onClick={() => chooseDay(day)}
            >
              <span>{weekday.format(noon(day)).replace('.', '')}</span>
              <strong>{Number(day.slice(-2))}</strong>
            </button>
          ))}
        </div>
        <h3 className="slots-title">Horarios disponibles</h3>
        <LoadPanel {...availability}>
          {availability.data?.length > 0 ? (
            <div className="slots" role="group" aria-label="Horarios disponibles">
              {availability.data.map((slot) => (
                <button
                  type="button"
                  className="slot"
                  key={slot}
                  aria-pressed={slot === startAt}
                  onClick={() => {
                    setStartAt(slot)
                    setError('')
                  }}
                >
                  {hourLabel(slot)}
                </button>
              ))}
            </div>
          ) : (
            <Notice>No hay horarios para este día. Probá con otra fecha.</Notice>
          )}
        </LoadPanel>
      </div>
      <aside className="panel booking-summary">
        <h2>Tu turno</h2>
        <p className="summary-service">{selected.name}</p>
        <ul className="summary-details">
          <li>
            <Clock3 size={17} /> {selected.duration} min
          </li>
          <li>
            <CalendarDays size={17} />
            <span>
              {dayLabel(noon(date))}
              {available ? ' · ' + hourLabel(startAt) : ''}
            </span>
          </li>
        </ul>
        <p className="price">{priceLabel(selected.price)}</p>
        {error && <Notice error>{error}</Notice>}
        <button
          type="submit"
          className="button primary full"
          disabled={!available || submitting}
        >
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Confirmar turno'}
        </button>
        {!startAt && (
          <p className="selection-hint">Seleccioná un horario para continuar.</p>
        )}
      </aside>
    </form>
  )
}

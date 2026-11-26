import { ApiError } from './api-error.js'

export const ZONE = 'America/Argentina/Buenos_Aires'
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const offset = '-03:00'
const startStep = 30 * 60 * 1000
const occupiedStep = 15 * 60 * 1000
const dayLength = 24 * 60 * 60 * 1000
const advanceWindow = 60

export function validateDay(day, now = new Date()) {
  const today = formatter.format(now)
  const dayStart = new Date(day + 'T00:00:00' + offset)
  const todayStart = new Date(today + 'T00:00:00' + offset)
  if (!Number.isFinite(dayStart.getTime()) || formatter.format(dayStart) !== day) {
    throw new ApiError(400, 'La fecha no es válida.', 'INVALID_DAY')
  }
  if (dayStart < todayStart || dayStart - todayStart > advanceWindow * dayLength) {
    throw new ApiError(
      400,
      'Elegí una fecha dentro de los próximos 60 días.',
      'INVALID_DAY',
    )
  }
  return dayStart
}

export function buildSlots(day, duration, now = new Date()) {
  const localMidnight = validateDay(day, now)
  if (localMidnight.getUTCDay() === 0) return []
  const openAt = new Date(day + 'T09:00:00' + offset).getTime()
  const closeAt = new Date(day + 'T19:00:00' + offset).getTime()
  const length = duration * 60_000
  const slots = []
  for (let time = openAt; time + length <= closeAt; time += startStep) {
    if (time > now.getTime()) {
      slots.push({ startAt: new Date(time), endAt: new Date(time + length) })
    }
  }
  return slots
}

export function buildReservation(start, service, now = new Date()) {
  const startAt = new Date(start)
  const day = formatter.format(startAt)
  const match = buildSlots(day, service.duration, now).find(
    (slot) => +slot.startAt === +startAt,
  )
  if (!match)
    throw new ApiError(400, 'Elegí un horario habilitado y futuro.', 'INVALID_SLOT')

  const occupiedSlots = []
  for (let time = +match.startAt; time < +match.endAt; time += occupiedStep) {
    occupiedSlots.push(new Date(time))
  }
  return { ...match, occupiedSlots }
}

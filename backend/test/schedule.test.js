import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReservation, buildSlots, validateDay } from '../src/utils/schedule.js'

const now = new Date('2026-09-10T12:30:00.000Z')
const day = '2026-09-11'

test('solo ofrece intervalos de media hora dentro de la jornada en Argentina', () => {
  const slots = buildSlots(day, 60, now)
  assert.equal(slots[0].startAt.toISOString(), '2026-09-11T12:00:00.000Z')
  assert.equal(slots.at(-1).endAt.toISOString(), '2026-09-11T22:00:00.000Z')
  assert.equal(slots.length, 19)
  assert.deepEqual(buildSlots('2026-09-13', 60, now), [])
})

test('rechaza fechas inexistentes, pasadas y fuera del período de reservas', () => {
  for (const date of ['2026-09-31', '2026-09-09', '2026-12-01']) {
    assert.throws(() => validateDay(date, now), { status: 400 })
  }
})

test('arma todas las franjas que ocupa una reserva y rechaza inicios sin disponibilidad', () => {
  const service = { duration: 90 }
  const booking = buildReservation('2026-09-11T09:00:00-03:00', service, now)
  assert.deepEqual(
    booking.occupiedSlots.map((slot) => slot.toISOString()),
    [
      '2026-09-11T12:00:00.000Z',
      '2026-09-11T12:15:00.000Z',
      '2026-09-11T12:30:00.000Z',
      '2026-09-11T12:45:00.000Z',
      '2026-09-11T13:00:00.000Z',
      '2026-09-11T13:15:00.000Z',
    ],
  )
  for (const start of [
    '2026-09-11T09:15:00-03:00',
    '2026-09-11T18:00:00-03:00',
    '2026-09-10T09:00:00-03:00',
  ]) {
    assert.throws(() => buildReservation(start, service, now), {
      status: 400,
      code: 'INVALID_SLOT',
    })
  }
})

test('45 minutos ocupan tres franjas y el turno termina a y 45', () => {
  const booking = buildReservation('2026-09-11T09:00:00-03:00', { duration: 45 }, now)
  assert.equal(booking.endAt.toISOString(), '2026-09-11T12:45:00.000Z')
  assert.equal(booking.occupiedSlots.length, 3)
  assert.equal(booking.occupiedSlots.at(-1).toISOString(), '2026-09-11T12:30:00.000Z')
})

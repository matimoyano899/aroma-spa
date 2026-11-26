import { notifyAppointment } from '../config/mailer.js'
import { appointmentRepository as bookings } from '../repositories/appointment.repository.js'
import { catalogService } from './catalog.service.js'
import { ApiError } from '../utils/api-error.js'
import { buildReservation, buildSlots } from '../utils/schedule.js'

const scope = (user) => (user.role === 'admin' ? {} : { client: user.id })
const unavailable = () =>
  new ApiError(409, 'Ese horario acaba de ocuparse. Elegí otro.', 'SLOT_TAKEN')
const notFound = () =>
  new ApiError(404, 'No encontramos ese turno.', 'APPOINTMENT_NOT_FOUND')

function response(item, user) {
  return {
    id: String(item._id),
    serviceId: String(item.service),
    serviceName: item.serviceName,
    price: item.price ?? null,
    duration: item.duration,
    startAt: item.startAt,
    endAt: item.endAt,
    ...(user.role === 'admin' &&
      item.client?.email && {
        client: { name: item.client.name, email: item.client.email },
      }),
  }
}

async function fields({ serviceId, startAt }) {
  const service = await catalogService.detail(serviceId)
  return {
    service: service.id,
    serviceName: service.name,
    price: service.price,
    duration: service.duration,
    ...buildReservation(startAt, service),
  }
}

export const appointmentsService = {
  async availability(serviceId, date, user, excludeId) {
    const service = await catalogService.detail(serviceId)
    const slots = buildSlots(date, service.duration)
    if (!slots.length) return []
    const excluded = excludeId ? await bookings.find(excludeId, scope(user)) : null
    if (excludeId && !excluded) throw notFound()
    const existing = await bookings.busy(slots[0].startAt, slots.at(-1).endAt)
    return slots
      .filter((slot) =>
        existing.every(
          (booking) =>
            String(booking._id) === excludeId ||
            slot.endAt <= booking.startAt ||
            slot.startAt >= booking.endAt,
        ),
      )
      .map((slot) => slot.startAt)
  },
  async list(user, { page, limit, period }) {
    const now = new Date()
    const filter =
      period === 'past' ? { startAt: { $lt: now } } : { startAt: { $gte: now } }
    const userScope = scope(user)
    const [items, total] = await Promise.all([
      bookings.list(
        userScope,
        filter,
        (page - 1) * limit,
        limit,
        period === 'past' ? -1 : 1,
      ),
      bookings.count(userScope, filter),
    ])
    return { items: items.map((item) => response(item, user)), total, page, limit }
  },
  async detail(id, user) {
    const item = await bookings.find(id, scope(user))
    if (!item) throw notFound()
    return response(item, user)
  },
  async create(user, input) {
    try {
      const item = await bookings.create({ client: user.id, ...(await fields(input)) })
      await notifyAppointment('created', item)
      return response(item, user)
    } catch (error) {
      if (error.code === 11000) throw unavailable()
      throw error
    }
  },
  async update(id, user, input) {
    const userScope = scope(user)
    const existing = await bookings.find(id, userScope)
    if (!existing) throw notFound()
    if (existing.startAt <= new Date()) {
      throw new ApiError(
        409,
        'Ese turno ya comenzó y no se puede reprogramar.',
        'APPOINTMENT_STARTED',
      )
    }
    try {
      const item = await bookings.update(
        id,
        { ...userScope, startAt: { $gt: new Date() } },
        await fields(input),
      )
      if (!item)
        throw new ApiError(
          409,
          'El turno cambió. Actualizá la página.',
          'APPOINTMENT_CHANGED',
        )
      await notifyAppointment('updated', item)
      return response(item, user)
    } catch (error) {
      if (error.code === 11000) throw unavailable()
      throw error
    }
  },
  async remove(id, user) {
    const userScope = scope(user)
    const filter =
      user.role === 'admin' ? userScope : { ...userScope, startAt: { $gt: new Date() } }
    const item = await bookings.remove(id, filter)
    if (item) {
      await notifyAppointment('removed', item)
      return
    }
    if (!(await bookings.find(id, userScope))) throw notFound()
    throw new ApiError(
      409,
      'Ese turno ya comenzó y no se puede cancelar.',
      'APPOINTMENT_STARTED',
    )
  },
}

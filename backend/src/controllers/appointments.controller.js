import { appointmentsService } from '../services/appointments.service.js'

export async function availability(req, res) {
  const { serviceId, date, excludeId } = req.input.query
  res.json({
    data: await appointmentsService.availability(serviceId, date, req.user, excludeId),
  })
}
export async function list(req, res) {
  res.json({ data: await appointmentsService.list(req.user, req.input.query) })
}
export async function detail(req, res) {
  res.json({ data: await appointmentsService.detail(req.input.params.id, req.user) })
}
export async function create(req, res) {
  res
    .status(201)
    .json({ data: await appointmentsService.create(req.user, req.input.body) })
}
export async function update(req, res) {
  res.json({
    data: await appointmentsService.update(
      req.input.params.id,
      req.user,
      req.input.body,
    ),
  })
}
export async function remove(req, res) {
  await appointmentsService.remove(req.input.params.id, req.user)
  res.status(204).end()
}

import { catalogService } from '../services/catalog.service.js'

export async function list(_req, res) {
  res.json({ data: await catalogService.list() })
}
export async function detail(req, res) {
  res.json({ data: await catalogService.detail(req.input.params.id) })
}
export async function create(req, res) {
  res.status(201).json({ data: await catalogService.create(req.input.body) })
}
export async function update(req, res) {
  res.json({ data: await catalogService.update(req.input.params.id, req.input.body) })
}
export async function remove(req, res) {
  await catalogService.remove(req.input.params.id)
  res.status(204).end()
}

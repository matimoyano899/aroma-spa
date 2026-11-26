import { serviceRepository } from '../repositories/service.repository.js'
import { ApiError } from '../utils/api-error.js'

const notFound = () =>
  new ApiError(404, 'El servicio no está disponible.', 'SERVICE_NOT_FOUND')

export const publicService = (s) => ({
  id: String(s._id),
  name: s.name,
  description: s.description,
  duration: s.duration,
  price: s.price ?? null,
})

export const catalogService = {
  async list() {
    return (await serviceRepository.list()).map(publicService)
  },
  async detail(id) {
    const item = await serviceRepository.findActive(id)
    if (!item) throw notFound()
    return publicService(item)
  },
  async create(fields) {
    return publicService(await serviceRepository.create(fields))
  },
  async update(id, fields) {
    const item = await serviceRepository.update(id, fields)
    if (!item) throw notFound()
    return publicService(item)
  },
  async remove(id) {
    if (!(await serviceRepository.archive(id))) throw notFound()
  },
}

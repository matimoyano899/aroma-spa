import { Service } from '../models/service.model.js'

export const serviceRepository = {
  list: () => Service.find({ active: true }).sort({ name: 1 }).lean(),
  findActive: (id) => Service.findOne({ _id: id, active: true }).lean(),
  create: (fields) => Service.create(fields),
  update: (id, fields) =>
    Service.findOneAndUpdate({ _id: id, active: true }, fields, {
      returnDocument: 'after',
      runValidators: true,
    }),
  archive: (id) =>
    Service.findOneAndUpdate({ _id: id, active: true }, { active: false }),
}

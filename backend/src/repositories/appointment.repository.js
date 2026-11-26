import { Appointment } from '../models/appointment.model.js'

const details = (query) => query.populate('client', 'name email').lean()

export const appointmentRepository = {
  list: (scope, filter, skip, limit, direction) =>
    details(
      Appointment.find({ ...scope, ...filter })
        .sort({ startAt: direction, _id: direction })
        .skip(skip)
        .limit(limit),
    ),
  count: (scope, filter) => Appointment.countDocuments({ ...scope, ...filter }),
  find: (id, scope) => details(Appointment.findOne({ _id: id, ...scope })),
  async create(fields) {
    const appointment = await Appointment.create(fields)
    return appointment.populate('client', 'name email')
  },
  update: (id, scope, fields) =>
    details(
      Appointment.findOneAndUpdate({ _id: id, ...scope }, fields, {
        returnDocument: 'after',
        runValidators: true,
      }),
    ),
  remove: (id, scope) => details(Appointment.findOneAndDelete({ _id: id, ...scope })),
  busy: (start, end) =>
    Appointment.find({
      startAt: { $lt: end },
      endAt: { $gt: start },
    })
      .select('startAt endAt')
      .lean(),
}

import mongoose from 'mongoose'

const { Schema } = mongoose
const schema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, default: null },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    occupiedSlots: { type: [Date], required: true, select: false },
  },
  { timestamps: true },
)

schema.index({ occupiedSlots: 1 }, { unique: true })
schema.index({ client: 1, startAt: -1 })
schema.index({ startAt: -1 })
export const Appointment = mongoose.model('Appointment', schema)

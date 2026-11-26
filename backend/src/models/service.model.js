import mongoose from 'mongoose'
import { SERVICE_DURATIONS } from '../utils/service-durations.js'

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 600 },
    duration: { type: Number, required: true, enum: SERVICE_DURATIONS },
    price: { type: Number, default: null, min: 0, max: 100000000 },
    active: { type: Boolean, default: true },
    seedKey: { type: String, select: false },
  },
  { timestamps: true },
)

schema.index({ seedKey: 1 }, { unique: true, sparse: true })
export const Service = mongoose.model('Service', schema)

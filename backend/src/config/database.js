import mongoose from 'mongoose'
import { env } from './env.js'
import { User } from '../models/user.model.js'
import { Service } from '../models/service.model.js'
import { Appointment } from '../models/appointment.model.js'

let inFlight

export async function connectDatabase() {
  if (!inFlight) {
    inFlight = (async () => {
      const connection = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 6000,
        maxPoolSize: 10,
      })
      await Promise.all([User.init(), Service.init(), Appointment.init()])
      return connection
    })().catch((error) => {
      inFlight = undefined
      throw error
    })
  }
  return inFlight
}

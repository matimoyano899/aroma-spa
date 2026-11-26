import { Router } from 'express'
import * as controller from '../controllers/appointments.controller.js'
import { authenticate, validate } from '../middlewares/http.js'
import {
  availabilityQuery,
  bookingBody,
  bookingQuery,
  idParams,
} from '../middlewares/schemas.js'

const appointments = Router()
const id = validate('params', idParams)
const body = validate('body', bookingBody)

appointments.use(authenticate)
appointments.get(
  '/availability',
  validate('query', availabilityQuery),
  controller.availability,
)
appointments.get('/', validate('query', bookingQuery), controller.list)
appointments.get('/:id', id, controller.detail)
appointments.post('/', body, controller.create)
appointments.put('/:id', id, body, controller.update)
appointments.delete('/:id', id, controller.remove)
export default appointments

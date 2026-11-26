import { Router } from 'express'
import * as controller from '../controllers/catalog.controller.js'
import { adminOnly, authenticate, validate } from '../middlewares/http.js'
import { idParams, serviceBody } from '../middlewares/schemas.js'

const catalog = Router()
const id = validate('params', idParams)
const body = validate('body', serviceBody)

catalog.get('/', controller.list)
catalog.get('/:id', id, controller.detail)
catalog.post('/', authenticate, adminOnly, body, controller.create)
catalog.put('/:id', authenticate, adminOnly, id, body, controller.update)
catalog.delete('/:id', authenticate, adminOnly, id, controller.remove)
export default catalog

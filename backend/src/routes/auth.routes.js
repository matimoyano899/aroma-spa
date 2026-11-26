import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import * as controller from '../controllers/auth.controller.js'
import { authenticate, validate } from '../middlewares/http.js'
import {
  loginBody,
  registerBody,
  resendBody,
  verifyBody,
} from '../middlewares/schemas.js'

const auth = Router()
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 24,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Demasiados intentos. Probá más tarde.' },
  },
})

auth.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
auth.post('/register', limit, validate('body', registerBody), controller.register)
auth.post('/resend', limit, validate('body', resendBody), controller.resend)
auth.post('/verify', limit, validate('body', verifyBody), controller.verify)
auth.post('/login', limit, validate('body', loginBody), controller.login)
auth.get('/me', authenticate, controller.session)
export default auth

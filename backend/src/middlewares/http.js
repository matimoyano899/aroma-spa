import mongoose from 'mongoose'
import { authService } from '../services/auth.service.js'
import { ApiError } from '../utils/api-error.js'

export function validate(target, schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const { path, message } = result.error.issues[0]
      return next(
        new ApiError(400, message, path.length ? 'INVALID_FIELD' : 'INVALID_INPUT'),
      )
    }
    req.input ??= {}
    req.input[target] = result.data
    next()
  }
}

export async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '')
  if (!match) {
    throw new ApiError(401, 'Iniciá sesión para continuar.', 'AUTH_REQUIRED')
  }
  req.user = await authService.authenticatedUser(match[1])
  res.set('Cache-Control', 'no-store')
  next()
}

export function adminOnly(req, _res, next) {
  if (req.user.role !== 'admin')
    throw new ApiError(403, 'No tenés permisos para esta acción.', 'FORBIDDEN')
  next()
}

export function handleError(error, _req, res, next) {
  if (res.headersSent) return next(error)
  if (error instanceof ApiError) {
    return res
      .status(error.status)
      .json({ error: { message: error.message, code: error.code } })
  }
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(error.status).json({
      error: {
        message: 'El cuerpo de la solicitud no es válido.',
        code: 'INVALID_BODY',
      },
    })
  }
  const unavailable = error instanceof mongoose.Error.MongooseServerSelectionError
  console.error('[aroma] Error de API:', error.name, error.code, error.codeName)
  return res.status(unavailable ? 503 : 500).json({
    error: unavailable
      ? { message: 'La agenda está temporalmente indisponible.', code: 'UNAVAILABLE' }
      : { message: 'Ocurrió un problema. Volvé a intentar.', code: 'INTERNAL_ERROR' },
  })
}

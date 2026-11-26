import { z } from 'zod'
import { SERVICE_DURATIONS } from '../utils/service-durations.js'

const email = z
  .email({ error: 'Ingresá un correo válido.' })
  .max(254)
  .transform((s) => s.toLowerCase())
const loginPassword = z
  .string()
  .min(1, 'Ingresá la contraseña.')
  .refine(
    (s) => Buffer.byteLength(s, 'utf8') <= 72,
    'La contraseña supera los 72 bytes.',
  )
const password = loginPassword.refine(
  (s) => s.length >= 10,
  'Usá al menos 10 caracteres.',
)
const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'El identificador no es válido.')

export const loginBody = z.object({ email, password: loginPassword }).strict()
export const registerBody = z
  .object({
    name: z.string().trim().min(2, 'Ingresá tu nombre.').max(80),
    email,
    password,
  })
  .strict()
export const resendBody = z.object({ email }).strict()
export const verifyBody = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'El enlace no es válido.'),
  })
  .strict()
export const idParams = z.object({ id: objectId })
export const serviceBody = z
  .object({
    name: z.string().trim().min(2, 'Ingresá el nombre del servicio.').max(80),
    description: z
      .string()
      .trim()
      .min(10, 'Escribí una descripción de al menos 10 caracteres.')
      .max(600),
    duration: z.literal(SERVICE_DURATIONS, { error: 'Elegí una duración disponible.' }),
    price: z.number().min(0).max(100000000).multipleOf(0.01).nullable().default(null),
  })
  .strict()
export const bookingBody = z
  .object({
    serviceId: objectId,
    startAt: z.iso.datetime({ offset: true, error: 'Elegí un horario válido.' }),
  })
  .strict()
export const availabilityQuery = z
  .object({
    serviceId: objectId,
    date: z.iso.date({ error: 'La fecha debe tener el formato AAAA-MM-DD.' }),
    excludeId: objectId.optional(),
  })
  .strict()
export const bookingQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    period: z.enum(['upcoming', 'past']).default('upcoming'),
  })
  .strict()

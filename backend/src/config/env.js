import 'dotenv/config'
import { z } from 'zod'

const bool = z.enum(['true', 'false']).transform((value) => value === 'true')
const schema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
    CLIENT_ORIGIN: z.url().refine((value) => {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol) && value === url.origin
    }),
    JWT_SECRET: z.string().min(32),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    SMTP_SECURE: bool.default(false),
    SMTP_REQUIRE_TLS: bool.default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().min(1),
  })
  .refine((value) => Boolean(value.SMTP_USER) === Boolean(value.SMTP_PASSWORD), {
    message: 'Completar SMTP_USER y SMTP_PASSWORD en conjunto.',
    path: ['SMTP_USER'],
  })

const result = schema.safeParse(process.env)
if (!result.success) {
  const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))]
  throw new Error('Revisá las variables de entorno: ' + fields.join(', '))
}
export const env = result.data

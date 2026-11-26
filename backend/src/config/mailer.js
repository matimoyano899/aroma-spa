import nodemailer from 'nodemailer'
import { env } from './env.js'

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  requireTLS: env.SMTP_REQUIRE_TLS,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  connectionTimeout: 8000,
  greetingTimeout: 6000,
  socketTimeout: 12000,
})

export function sendVerificationEmail(email, token) {
  const url = new URL('/verificar-email', env.CLIENT_ORIGIN)
  url.hash = new URLSearchParams({ token }).toString()

  return transport.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Confirmá tu cuenta de Aroma Spa',
    text:
      'Confirmá tu correo para reservar un masaje en Aroma Spa.\n\n' +
      url.href +
      '\n\nEl enlace vence en dos horas. Si no creaste una cuenta, podés ignorar este mensaje.',
  })
}

import nodemailer from 'nodemailer'
import { env } from './env.js'
import { ZONE } from '../utils/schedule.js'

const appointmentDate = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
  hourCycle: 'h23',
  timeZone: ZONE,
})

const appointmentSubjects = {
  created: 'Nuevo turno',
  updated: 'Turno reprogramado',
  removed: 'Turno cancelado',
}

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

export async function notifyAppointment(event, appointment) {
  if (!env.APPOINTMENTS_NOTIFY_EMAIL) return

  const subject = appointmentSubjects[event]
  const client = appointment.client
  const details = [
    subject + ' en Aroma Spa.',
    'Servicio: ' + appointment.serviceName,
    'Fecha y hora: ' +
      appointmentDate.format(appointment.startAt) +
      ' (hora argentina)',
    'Duración: ' + appointment.duration + ' min',
  ]
  if (client?.email) details.push('Cliente: ' + client.name + ' <' + client.email + '>')

  const agenda = new URL('/mis-turnos', env.CLIENT_ORIGIN)
  details.push('', 'Abrí la agenda para consultar tus turnos: ' + agenda.href)

  try {
    await transport.sendMail({
      from: env.MAIL_FROM,
      to: env.APPOINTMENTS_NOTIFY_EMAIL,
      subject: subject + ' de Aroma Spa',
      text: details.join('\n'),
    })
  } catch (error) {
    console.error('No se pudo enviar el aviso de turno.', {
      event,
      appointmentId: String(appointment._id),
      code: error.code,
    })
  }
}

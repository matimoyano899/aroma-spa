import { z } from 'zod'
import { env } from '../src/config/env.js'
import { mailTransport } from '../src/config/mailer.js'

const recipient = process.argv[2]

try {
  if (recipient) z.email().parse(recipient)
  await mailTransport.verify()
  console.log('SMTP: conexión y autenticación correctas.')

  if (recipient) {
    await mailTransport.sendMail({
      from: env.MAIL_FROM,
      to: recipient,
      subject: 'Prueba de correo de Aroma Spa',
      text: 'El servidor SMTP aceptó el envío de prueba de Aroma Spa.',
    })
    console.log('SMTP: el proveedor aceptó el mensaje. Revisá la bandeja de destino.')
  }
} catch (error) {
  console.error('Falló la prueba de SMTP.', {
    code: error.code ?? error.name,
    responseCode: error.responseCode,
    command: error.command,
  })
  process.exitCode = 1
} finally {
  mailTransport.close()
}

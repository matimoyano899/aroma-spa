import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { z } from 'zod'
import { connectDatabase } from '../src/config/database.js'
import { Service } from '../src/models/service.model.js'
import { User } from '../src/models/user.model.js'

const services = [
  {
    seedKey: 'espalda',
    name: 'Masaje de espalda',
    duration: 45,
    price: 25000,
    description:
      'Una sesión localizada para trabajar la espalda y la tensión que se acumula en esa zona.',
  },
  {
    seedKey: 'piernas',
    name: 'Masaje de piernas',
    duration: 45,
    price: 25000,
    description:
      'Una sesión de masaje localizada en piernas, con la presión adaptada a vos.',
  },
  {
    seedKey: 'relajante',
    name: 'Masaje relajante de cuerpo completo',
    duration: 90,
    price: 35000,
    description:
      'Movimientos suaves y pausados para bajar el ritmo y regalarle al cuerpo un momento de descanso.',
  },
  {
    seedKey: 'descontracturante',
    name: 'Masaje descontracturante de cuerpo completo',
    duration: 90,
    price: 35000,
    description:
      'Una sesión enfocada en las zonas donde se acumula tensión, con presión adaptada a vos.',
  },
  {
    seedKey: 'drenaje',
    name: 'Drenaje linfático',
    duration: 60,
    price: 30000,
    description:
      'Una sesión de maniobras suaves, con una atención pausada e individual.',
  },
  {
    seedKey: 'maderoterapia',
    name: 'Maderoterapia',
    duration: 60,
    price: 32000,
    description:
      'Masaje corporal que utiliza utensilios de madera. Consultá para definir el enfoque de tu sesión.',
  },
  {
    seedKey: 'reductor',
    name: 'Masaje reductor',
    duration: 60,
    price: 30000,
    description:
      'Sesión estética corporal personalizada. Consultá qué zonas y modalidad se trabajan antes de reservar.',
  },
]

try {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (Boolean(ADMIN_EMAIL) !== Boolean(ADMIN_PASSWORD))
    throw new Error('Completá ambos datos de administrador.')
  const email = ADMIN_EMAIL ? z.email().parse(ADMIN_EMAIL.trim().toLowerCase()) : null
  if (email && (ADMIN_PASSWORD.length < 12 || Buffer.byteLength(ADMIN_PASSWORD) > 72)) {
    throw new Error(
      'La contraseña admin debe tener al menos 12 caracteres y hasta 72 bytes.',
    )
  }
  await connectDatabase()
  for (const name of ['relajante', 'descontracturante']) {
    await Service.updateOne(
      { seedKey: name, name: 'Masaje ' + name, duration: 60, active: true },
      { $set: { name: 'Masaje ' + name + ' de cuerpo completo', duration: 90 } },
    )
  }
  for (const service of services) {
    await Service.updateOne(
      { seedKey: service.seedKey },
      { $setOnInsert: service },
      { upsert: true },
    )
  }
  if (email) {
    if (await User.exists({ email })) {
      console.log('La cuenta ya existe. Se conserva su rol y contraseña.')
    } else {
      await User.create({
        name: 'Administración Aroma Spa',
        email,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: 'admin',
        verifiedAt: new Date(),
      })
      console.log('Cuenta de administración creada.')
    }
  }
  console.log('Catálogo inicial cargado. Revisá duraciones y valores en el panel.')
} catch (error) {
  console.error('La siembra falló:', error.name)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { SMTPServer } from 'smtp-server'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const password = 'Solo para pruebas 42!'
const address = 'http://localhost:5173'
const argentina = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function nextBusinessDay() {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() + 2)
  let day = argentina.format(now)
  if (new Date(day + 'T12:00:00-03:00').getUTCDay() === 0) {
    now.setUTCDate(now.getUTCDate() + 1)
    day = argentina.format(now)
  }
  return day
}

test('integración HTTP con MongoDB y SMTP', { timeout: 180_000 }, async (t) => {
  const dbName = 'aroma_test_' + randomBytes(5).toString('hex')
  const db = process.env.TEST_MONGODB_URI
    ? null
    : await MongoMemoryServer.create({
        instance: { args: process.platform === 'linux' ? ['--nounixsocket'] : [] },
      })
  let smtp
  let server
  t.after(async () => {
    if (server) {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    }
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase()
    } finally {
      await mongoose.disconnect()
      if (smtp) await new Promise((resolve) => smtp.close(resolve))
      if (db) await db.stop()
    }
  })
  const uri = new URL(process.env.TEST_MONGODB_URI || db.getUri())
  uri.pathname = '/' + dbName
  const mails = []
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    onData(stream, _session, done) {
      const parts = []
      stream.on('data', (part) => parts.push(part))
      stream.once('error', done)
      stream.once('end', () => {
        mails.push(Buffer.concat(parts).toString())
        done()
      })
    },
  })
  smtp.listen(0, '127.0.0.1')
  await once(smtp.server, 'listening')

  Object.assign(process.env, {
    MONGODB_URI: uri.href,
    JWT_SECRET: randomBytes(32).toString('hex'),
    CLIENT_ORIGIN: address,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtp.server.address().port),
    SMTP_SECURE: 'false',
    SMTP_REQUIRE_TLS: 'false',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    MAIL_FROM: 'pruebas@example.test',
    APPOINTMENTS_NOTIFY_EMAIL: 'agenda@example.test',
  })

  const { default: app } = await import('../src/index.js')
  const { User } = await import('../src/models/user.model.js')
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const api = 'http://127.0.0.1:' + server.address().port + '/api'
  const call = async (path, method = 'GET', body, token) => {
    const response = await fetch(api + path, {
      method,
      headers: {
        ...(token && { Authorization: 'Bearer ' + token }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })
    const payload = response.status === 204 ? null : await response.json()
    return { status: response.status, data: payload?.data, error: payload?.error }
  }
  const login = (email) => call('/auth/login', 'POST', { email, password })
  const tokenFromEmail = (raw) =>
    raw
      .replace(/=\r?\n/g, '')
      .replace(/=3D/g, '=')
      .match(/#token=([\w-]{43})/)?.[1]

  assert.equal((await call('/ready')).status, 200)
  assert.equal((await call('/appointments')).status, 401)
  const preflight = await fetch(api + '/appointments', {
    method: 'OPTIONS',
    headers: {
      Origin: address,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  })
  assert.equal(preflight.headers.get('access-control-allow-origin'), address)

  let client
  let other
  let admin
  await t.test(
    'registro, correo real por SMTP, enlace de un uso, bcrypt y login',
    async () => {
      const email = 'sol@example.test'
      assert.equal(
        (await call('/auth/register', 'POST', { name: 'Sol', email: 'mal', password }))
          .status,
        400,
      )
      const registered = await call('/auth/register', 'POST', {
        name: 'Sol',
        email,
        password,
      })
      assert.equal(registered.status, 201)
      assert.deepEqual(Object.keys(registered.data), ['message'])
      assert.equal(mails.length, 1)
      assert.equal((await login(email)).error.code, 'EMAIL_UNVERIFIED')
      const saved = await User.findOne({ email }).select(
        '+passwordHash +verificationHash',
      )
      assert.notEqual(saved.passwordHash, password)
      assert.ok(await bcrypt.compare(password, saved.passwordHash))
      const original = tokenFromEmail(mails[0])
      assert.ok(original)
      assert.notEqual(original, saved.verificationHash)

      assert.equal((await call('/auth/resend', 'POST', { email })).status, 200)
      const token = tokenFromEmail(mails[1])
      assert.ok(token)
      assert.notEqual(token, original)
      assert.equal(
        (await call('/auth/verify', 'POST', { token: original })).status,
        400,
      )
      assert.equal((await call('/auth/verify', 'POST', { token })).status, 200)
      assert.equal((await call('/auth/verify', 'POST', { token })).status, 400)
      const session = await login(email)
      assert.equal(session.status, 200)
      client = session.data.token
      assert.equal(
        (await call('/auth/me', 'GET', undefined, client)).data.role,
        'client',
      )
      assert.equal((await call('/auth/me', 'GET', undefined, 'invalid')).status, 401)
      const hash = await bcrypt.hash(password, 4)
      for (const [role, email] of [
        ['admin', 'admin@example.test'],
        ['client', 'ana@example.test'],
      ]) {
        await User.create({
          name: role,
          email,
          passwordHash: hash,
          role,
          verifiedAt: new Date(),
        })
      }
      admin = (await login('admin@example.test')).data.token
      other = (await login('ana@example.test')).data.token
    },
  )

  let service
  const description = 'Una sesión de masajes de prueba, de atención individual.'
  await t.test('CRUD de servicios y permisos de administración', async () => {
    const input = { name: 'Sesión inicial', description, duration: 45, price: 20000.25 }
    assert.equal((await call('/services', 'POST', input, client)).status, 403)
    const created = await call('/services', 'POST', input, admin)
    assert.equal(created.status, 201)
    service = created.data.id
    assert.equal((await call('/services/' + service)).data.price, 20000.25)
    assert.equal(
      (
        await call(
          '/services/' + service,
          'PUT',
          { ...input, name: 'Sesión personalizada' },
          admin,
        )
      ).status,
      200,
    )
    assert.equal((await call('/services')).data[0].name, 'Sesión personalizada')
  })

  await t.test(
    'CRUD de turnos, no superposición, auditabilidad y acceso por usuario',
    async () => {
      const day = nextBusinessDay()
      const slots = `/appointments/availability?serviceId=${service}&date=${day}`
      const available = await call(slots, 'GET', undefined, client)
      assert.equal(available.status, 200)
      const [first, overlap, later] = available.data
      const book = (startAt, token) =>
        call('/appointments', 'POST', { serviceId: service, startAt }, token)
      const mailCount = mails.length
      const [primary, concurrent] = await Promise.all([
        book(first, client),
        book(overlap, other),
      ])
      assert.deepEqual([primary.status, concurrent.status].sort(), [201, 409])
      assert.equal(mails.length, mailCount + 1)
      assert.match(mails.at(-1), /^To: agenda@example\.test\r?$/m)
      assert.match(mails.at(-1), /Nuevo turno/)
      let current = primary.status === 201 ? primary.data : concurrent.data
      const owner = primary.status === 201 ? client : other
      const outsider = primary.status === 201 ? other : client
      const path = '/appointments/' + current.id
      assert.equal((await call(path, 'GET', undefined, outsider)).status, 404)
      assert.equal((await call(path, 'DELETE', undefined, outsider)).status, 404)
      assert.ok((await call(path, 'GET', undefined, admin)).data.client.email)
      assert.equal((await call('/appointments', 'GET', undefined, owner)).data.total, 1)
      assert.equal(
        (await call('/appointments', 'GET', undefined, outsider)).data.total,
        0,
      )
      assert.equal(
        (await call(slots + '&excludeId=' + current.id, 'GET', undefined, outsider))
          .status,
        404,
      )

      const moved = await call(
        path,
        'PUT',
        { serviceId: service, startAt: later },
        owner,
      )
      assert.equal(moved.status, 200)
      assert.equal(mails.length, mailCount + 2)
      assert.match(mails.at(-1), /Turno reprogramado/)
      current = (await call(path, 'GET', undefined, owner)).data
      assert.equal(current.startAt, later)
      assert.equal(
        (await call('/services/' + service, 'DELETE', undefined, admin)).status,
        204,
      )
      assert.equal((await call('/services/' + service)).status, 404)
      assert.equal(
        (await call(path, 'GET', undefined, owner)).data.serviceName,
        'Sesión personalizada',
      )
      assert.equal((await call(path, 'DELETE', undefined, owner)).status, 204)
      assert.equal(mails.length, mailCount + 3)
      assert.match(mails.at(-1), /Turno cancelado/)
      assert.equal((await call('/appointments', 'GET', undefined, owner)).data.total, 0)
    },
  )
})

import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { sendVerificationEmail } from '../config/mailer.js'
import { userRepository } from '../repositories/user.repository.js'
import { ApiError } from '../utils/api-error.js'

const purpose = { issuer: 'aroma-spa', audience: 'aroma-web' }
const falseHash = bcrypt.hash('Credencial sin cuenta asociada', 12)
const hashToken = (token) => createHash('sha256').update(token).digest('hex')
const verification = () => {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    fields: {
      verificationHash: hashToken(token),
      verificationExpires: new Date(Date.now() + 2 * 60 * 60_000),
    },
  }
}

export const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
})

async function mailVerification(email, token) {
  try {
    await sendVerificationEmail(email, token)
  } catch {
    throw new ApiError(
      503,
      'El correo está temporalmente indisponible. Podés pedir un enlace nuevo.',
      'MAIL_UNAVAILABLE',
    )
  }
}

export const authService = {
  async register({ name, email, password }) {
    const passwordHash = await bcrypt.hash(password, 12)
    const { token, fields } = verification()
    try {
      await userRepository.create({ name, email, passwordHash, ...fields })
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(
          409,
          'Ya hay una cuenta con ese correo. Iniciá sesión o pedí un enlace nuevo.',
          'EMAIL_EXISTS',
        )
      }
      throw error
    }
    await mailVerification(email, token)
  },

  async resend(email) {
    const { token, fields } = verification()
    const user = await userRepository.rotateVerification(email, fields)
    if (user) {
      try {
        await sendVerificationEmail(email, token)
      } catch {
        console.warn('[aroma] No se pudo reenviar el correo de verificación.')
      }
    }
  },

  async verify(token) {
    const user = await userRepository.verify(hashToken(token), new Date())
    if (!user)
      throw new ApiError(
        400,
        'El enlace venció, ya se usó o no es válido.',
        'VERIFICATION_INVALID',
      )
  },

  async login(email, password) {
    const user = await userRepository.findForLogin(email)
    const valid = await bcrypt.compare(
      password,
      user ? user.passwordHash : await falseHash,
    )
    if (!user || !valid)
      throw new ApiError(401, 'Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS')
    if (!user.verifiedAt)
      throw new ApiError(403, 'Confirmá tu correo para ingresar.', 'EMAIL_UNVERIFIED')

    const token = jwt.sign({}, env.JWT_SECRET, {
      ...purpose,
      algorithm: 'HS256',
      subject: String(user._id),
      expiresIn: '2h',
    })
    return { token, user: publicUser(user) }
  },

  async authenticatedUser(token) {
    let claims
    try {
      claims = jwt.verify(token, env.JWT_SECRET, { ...purpose, algorithms: ['HS256'] })
      if (
        typeof claims !== 'object' ||
        typeof claims.exp !== 'number' ||
        typeof claims.sub !== 'string' ||
        !/^[a-f0-9]{24}$/.test(claims.sub)
      )
        throw new Error()
    } catch {
      throw new ApiError(401, 'La sesión venció o no es válida.', 'INVALID_SESSION')
    }
    const user = await userRepository.findById(claims.sub)
    if (!user?.verifiedAt)
      throw new ApiError(401, 'Volvé a iniciar sesión.', 'INVALID_SESSION')
    return publicUser(user)
  },
}

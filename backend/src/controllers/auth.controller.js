import { authService } from '../services/auth.service.js'

export async function register(req, res) {
  await authService.register(req.input.body)
  res
    .status(201)
    .json({ data: { message: 'Cuenta creada. Revisá tu correo para activarla.' } })
}
export async function resend(req, res) {
  await authService.resend(req.input.body.email)
  res.json({
    data: { message: 'Si tu cuenta está pendiente, vas a recibir un correo nuevo.' },
  })
}
export async function verify(req, res) {
  await authService.verify(req.input.body.token)
  res.json({ data: { message: 'Correo confirmado. Ya podés iniciar sesión.' } })
}
export async function login(req, res) {
  const { email, password } = req.input.body
  res.json({ data: await authService.login(email, password) })
}
export function session(req, res) {
  res.json({ data: req.user })
}

export const zone = 'America/Argentina/Buenos_Aires'
const shortDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: zone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const longDate = new Intl.DateTimeFormat('es-AR', {
  timeZone: zone,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const hours = new Intl.DateTimeFormat('es-AR', {
  timeZone: zone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const dayKey = (date = new Date()) => shortDate.format(new Date(date))
export const dayLabel = (date) => longDate.format(new Date(date))
export const hourLabel = (date) => hours.format(new Date(date))
export const priceLabel = (price) =>
  price === null ? 'Consultar valor' : currency.format(price)

export function addDays(day, count) {
  const date = new Date(day + 'T12:00:00-03:00')
  date.setUTCDate(date.getUTCDate() + count)
  return dayKey(date)
}

import { MessageCircle } from 'lucide-react'

const number = '5492284606371'

export function WhatsAppLink({ className = 'text-link', label = 'WhatsApp' }) {
  return (
    <a
      className={className}
      href={'https://wa.me/' + number}
      target="_blank"
      rel="noreferrer"
      aria-label="Consultar a Gabriela por WhatsApp"
    >
      <MessageCircle size={18} strokeWidth={1.7} aria-hidden="true" />
      {label}
    </a>
  )
}

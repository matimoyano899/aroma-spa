import { useCallback } from 'react'
import { ArrowLeft, ArrowRight, Clock3, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { api } from '../api'
import { Empty, LoadPanel, ServiceCard } from '../components/ui'
import { useLoad } from '../hooks/use-load'
import { priceLabel } from '../format'
import { WhatsAppLink } from '../components/WhatsAppLink'

const featuredMassages = [
  'Masaje relajante de cuerpo completo',
  'Masaje de espalda',
  'Masaje de piernas',
  'Masaje descontracturante de cuerpo completo',
]

function ServiceList({ services }) {
  return (
    <div className="service-list">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  )
}

function Catalog({ brief = false }) {
  const catalog = useLoad(useCallback((signal) => api('/services', { signal }), []))
  const services = catalog.data ?? []
  const featured = featuredMassages
    .map((name) => services.find((service) => service.name === name))
    .filter(Boolean)
  const ordered = [
    ...featured,
    ...services.filter((service) => !featured.includes(service)),
  ]
  const visible = brief ? ordered.slice(0, 3) : ordered
  const Title = brief ? 'h2' : 'h1'

  return (
    <div className="catalog-feature">
      <figure className="catalog-photo">
        <picture>
          <source media="(max-width: 760px)" srcSet="/estudio-mobile.webp" />
          <img
            src="/estudio.webp"
            alt="Camilla con toallas y luz natural"
            width="1300"
            height="867"
            loading="lazy"
          />
        </picture>
        <figcaption>
          <strong>Aroma Spa</strong>
          <span>Sierras Bayas, Buenos Aires</span>
        </figcaption>
      </figure>
      <div className="catalog-content">
        <Title id={brief ? 'servicios-titulo' : undefined}>Elegí tu sesión</Title>
        <p className="catalog-description">
          Masajes localizados, de cuerpo completo y tratamientos corporales.
        </p>
        <LoadPanel {...catalog}>
          {services.length ? (
            <ServiceList services={visible} />
          ) : (
            <Empty title="El catálogo está en preparación">
              Consultá por las sesiones disponibles por WhatsApp.
            </Empty>
          )}
        </LoadPanel>
        <div className="actions catalog-actions">
          <Link className="button primary" to="/reservar">
            Ver horarios <ArrowRight size={16} />
          </Link>
          <WhatsAppLink label="Consultar por WhatsApp" />
          {brief && (
            <Link className="text-link" to="/servicios">
              Todos los servicios
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="titulo-inicio">
        <picture className="hero-media">
          <source media="(max-width: 650px)" srcSet="/aroma-hero-mobile.webp" />
          <img src="/aroma-hero.webp" alt="" fetchPriority="high" />
        </picture>
        <div className="hero-copy shell">
          <p className="hero-location">Sierras Bayas, Buenos Aires</p>
          <h1 id="titulo-inicio">
            Aroma <em>Spa</em>
          </h1>
          <p className="hero-desc">
            Masajes y tratamientos corporales con Gabriela Manuel.
          </p>
          <div className="actions">
            <Link className="button hero-book" to="/reservar">
              Reservar un turno <ArrowRight size={16} />
            </Link>
            <Link className="button hero-services" to="/servicios">
              Ver servicios
            </Link>
          </div>
        </div>
      </section>
      <section className="home-services" aria-labelledby="servicios-titulo">
        <div className="shell">
          <Catalog brief />
        </div>
      </section>
      <section className="shell location-block" aria-label="Ubicación">
        <MapPin size={24} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2>Sierras Bayas, Buenos Aires</h2>
          <p>Atención con turno previo.</p>
        </div>
      </section>
    </>
  )
}

export function Services() {
  return (
    <section className="shell page-section catalog-page">
      <Catalog />
    </section>
  )
}

export function ServiceDetail() {
  const { id } = useParams()
  const data = useLoad(
    useCallback((signal) => api('/services/' + id, { signal }), [id]),
  )
  const item = data.data
  return (
    <section className="shell page-section">
      <Link className="text-link back-link" to="/servicios">
        <ArrowLeft size={15} /> Servicios
      </Link>
      <LoadPanel {...data}>
        {item && (
          <div className="service-detail">
            <div>
              <p className="eyebrow">Sesión individual</p>
              <h1>{item.name}</h1>
              <p>{item.description}</p>
            </div>
            <aside className="panel">
              <p className="service-time">
                <Clock3 size={16} /> Aprox. {item.duration} min
              </p>
              <p className="price">{priceLabel(item.price)}</p>
              <Link to={'/reservar?servicio=' + item.id} className="button primary">
                Reservar esta sesión <ArrowRight size={16} />
              </Link>
              <WhatsAppLink label="Consultar por WhatsApp" />
            </aside>
          </div>
        )}
      </LoadPanel>
    </section>
  )
}

export function NotFound() {
  return (
    <section className="shell page-section">
      <Empty
        title="No encontramos esta página"
        action={
          <Link to="/" className="button primary">
            Ir al inicio
          </Link>
        }
      >
        La dirección que abriste ya no está disponible.
      </Empty>
    </section>
  )
}

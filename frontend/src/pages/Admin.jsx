import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { api } from '../api'
import { Empty, LoadPanel, Notice } from '../components/ui'
import { useLoad } from '../hooks/use-load'
import { useSession } from '../session'
import { priceLabel } from '../format'

export function AdminServices() {
  const { token } = useSession()
  const { state } = useLocation()
  const catalog = useLoad(useCallback((signal) => api('/services', { signal }), []))
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const modal = useRef(null)

  async function archive() {
    setBusy(true)
    setError('')
    try {
      await api('/services/' + selected.id, { method: 'DELETE', token })
      modal.current?.close()
      catalog.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="shell page-section">
      <div className="page-intro split-intro">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Gestionar servicios</h1>
          <p>Editá qué sesiones aparecen en el catálogo.</p>
        </div>
        <Link to="/admin/servicios/nuevo" className="button primary">
          <Plus size={17} /> Nuevo servicio
        </Link>
      </div>
      {state?.notice && <Notice success>{state.notice}</Notice>}
      <LoadPanel {...catalog}>
        {catalog.data?.length === 0 ? (
          <Empty title="Todavía no hay servicios">
            Agregá una sesión para abrir el catálogo.
          </Empty>
        ) : (
          <div className="appointment-list">
            {catalog.data?.map((service) => (
              <article className="appointment-row admin-row" key={service.id}>
                <div>
                  <h2>{service.name}</h2>
                  <p>
                    {service.duration} min · {priceLabel(service.price)}
                  </p>
                </div>
                <div className="actions">
                  <Link to={'/servicios/' + service.id} className="text-link">
                    Ver
                  </Link>
                  <Link
                    to={'/admin/servicios/' + service.id + '/editar'}
                    className="button secondary"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => {
                      setError('')
                      setSelected(service)
                      modal.current.showModal()
                    }}
                  >
                    Archivar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </LoadPanel>
      <dialog
        ref={modal}
        onCancel={(event) => {
          if (busy) event.preventDefault()
        }}
        aria-labelledby="archivar-titulo"
      >
        <h2 id="archivar-titulo">¿Archivar {selected?.name}?</h2>
        <p>
          La sesión ya no aparecerá en el catálogo. Los turnos que se reservaron se
          conservan.
        </p>
        {error && <Notice error>{error}</Notice>}
        <div className="actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => modal.current.close()}
            disabled={busy}
          >
            Volver
          </button>
          <button
            type="button"
            className="button danger"
            onClick={archive}
            disabled={busy}
          >
            {busy ? 'Archivando…' : 'Archivar servicio'}
          </button>
        </div>
      </dialog>
    </section>
  )
}

export function AdminEditor() {
  const { id } = useParams()
  const item = useLoad(
    useCallback(
      (signal) => (id ? api('/services/' + id, { signal }) : Promise.resolve(null)),
      [id],
    ),
  )
  return (
    <section className="shell narrow page-section">
      <Link className="text-link back-link" to="/admin/servicios">
        <ArrowLeft size={16} /> Volver al panel
      </Link>
      <div className="page-intro">
        <h1>{id ? 'Editar servicio' : 'Nuevo servicio'}</h1>
      </div>
      <LoadPanel {...item}>
        <EditorForm key={id ?? 'new'} initial={item.data} />
      </LoadPanel>
    </section>
  )
}

function EditorForm({ initial }) {
  const navigate = useNavigate()
  const { token } = useSession()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const raw = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {
      await api('/services' + (initial ? '/' + initial.id : ''), {
        method: initial ? 'PUT' : 'POST',
        token,
        body: {
          name: raw.name,
          description: raw.description,
          duration: Number(raw.duration),
          price: raw.price === '' ? null : Number(raw.price),
        },
      })
      navigate('/admin/servicios', {
        replace: true,
        state: { notice: initial ? 'Servicio actualizado.' : 'Servicio publicado.' },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel form-stack" onSubmit={submit}>
      <label>
        Nombre{' '}
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initial?.name}
        />
      </label>
      <label>
        Descripción
        <textarea
          name="description"
          rows={5}
          required
          minLength={10}
          maxLength={600}
          defaultValue={initial?.description}
        />
      </label>
      <div className="form-pair">
        <label>
          Duración
          <select name="duration" defaultValue={initial?.duration ?? 60}>
            {[30, 45, 60, 90, 120].map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutos
              </option>
            ))}
          </select>
        </label>
        <label>
          Precio en ARS
          <input
            name="price"
            type="number"
            min="0"
            max="100000000"
            step="0.01"
            inputMode="decimal"
            defaultValue={initial?.price ?? ''}
          />
          <small>Dejalo vacío si el valor es a consultar.</small>
        </label>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div>
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar servicio'}
        </button>
      </div>
    </form>
  )
}

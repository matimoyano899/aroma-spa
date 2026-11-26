export function AuthLayout({ title, subtitle, children }) {
  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <div className="auth-panel">
        <div className="auth-heading">
          <img src="/aroma-logo.webp" width="90" height="97" alt="Aroma Spa" />
          <h1 id="auth-title">{title}</h1>
          <p className="form-subtitle">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

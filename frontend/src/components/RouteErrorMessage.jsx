export default function RouteErrorMessage({ message, alias }) {
  return (
    <main className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center">
      <section className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5 text-center">
                <span className="badge text-bg-warning text-uppercase mb-3">Unable to load</span>
                <h1 className="display-6 fw-semibold mb-3">We could not check that short URL.</h1>
                <p className="text-body-secondary mb-4">
                  {message || 'The service returned an error while looking up this path.'}
                  {alias ? <span> Requested path: <strong>/{alias}</strong>.</span> : null}
                </p>
                <a className="btn btn-primary btn-lg" href="/">
                  Return to the home page
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
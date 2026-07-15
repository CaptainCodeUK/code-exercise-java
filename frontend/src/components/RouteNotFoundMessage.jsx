export default function RouteNotFoundMessage({ alias }) {
  return (
    <main className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center">
      <section className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5 text-center">
                <span className="badge text-bg-danger text-uppercase mb-3">404 Not Found</span>
                <h1 className="display-6 fw-semibold mb-3">That short URL does not exist.</h1>
                <p className="text-body-secondary mb-4">
                  We could not find a shortened link for {alias ? <strong>/{alias}</strong> : 'this path'}.
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
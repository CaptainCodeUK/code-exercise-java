export default function ShortenerPanel({
  status,
  statusLabels,
  statusVariants,
  fullUrlValidationMessage,
  fullUrl,
  onFullUrlChange,
  customAlias,
  onCustomAliasChange,
  onSubmit,
  onClear,
  error,
  shortUrl,
  copyState,
  onCopyShortUrl,
  onClose,
  className = '',
  titleId,
}) {
  return (
    <section className={`card border-0 shadow-sm ${className}`.trim()} aria-labelledby={titleId}>
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h2 id={titleId} className="h4 mb-1">
              Create a new alias
            </h2>
            <p className="text-body-secondary mb-0">
              Enter the original URL and an optional custom alias below.
            </p>
          </div>

          {onClose ? (
            <button type="button" className="btn-close" aria-label="Close alias composer" onClick={onClose} />
          ) : null}
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label htmlFor="fullUrl" className="form-label fw-semibold">
                  Full URL
                </label>
                <input
                  id="fullUrl"
                  name="fullUrl"
                  type="url"
                  required
                  inputMode="url"
                  className="form-control form-control-lg"
                  value={fullUrl}
                  onChange={(event) => onFullUrlChange(event.target.value)}
                  onInvalid={(event) => {
                    event.target.setCustomValidity(fullUrlValidationMessage)
                  }}
                  onInput={(event) => {
                    event.target.setCustomValidity('')
                  }}
                  placeholder="https://example.com/article"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="customAlias" className="form-label fw-semibold">
                  Custom alias <span className="badge text-bg-light border text-secondary align-middle">optional</span>
                </label>
                <input
                  id="customAlias"
                  name="customAlias"
                  type="text"
                  className="form-control form-control-lg"
                  value={customAlias}
                  onChange={(event) => onCustomAliasChange(event.target.value)}
                  placeholder="launch-notes"
                  autoComplete="off"
                />
                <div className="form-text">Leave this blank if you want the service to choose one.</div>
              </div>

              <div className="d-flex flex-wrap gap-2 pt-1">
                <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Shortening...' : 'Create short URL'}
                </button>
                <button type="button" className="btn btn-outline-secondary btn-lg" onClick={onClear}>
                  Clear
                </button>
              </div>

              {error ? (
                <div className="alert alert-danger mt-4 mb-0" role="alert">
                  {error}
                </div>
              ) : null}
            </form>
          </div>

          <div className="col-12 col-lg-5">
            <section className="h-100 p-4 bg-body-secondary rounded-4 border" aria-live="polite">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <h2 className="h5 mb-0">Short URL</h2>
                <span
                  className={`badge rounded-pill text-bg-${statusVariants[status]} d-inline-flex align-items-center gap-2 px-3 py-2 fs-6`}
                  aria-live="polite"
                >
                  {status === 'loading' ? (
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  ) : null}
                  <span>{statusLabels[status]}</span>
                </span>
              </div>

              {shortUrl ? (
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                  <a className="link-primary fw-semibold text-break" href={shortUrl} target="_blank" rel="noreferrer">
                    {shortUrl}
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-shrink-0"
                    onClick={onCopyShortUrl}
                    title={copyState === 'Copied' ? 'Copied to clipboard' : 'Copy short URL'}
                    aria-label={copyState === 'Copied' ? 'Copied to clipboard' : 'Copy short URL'}
                  >
                    {copyState}
                  </button>
                </div>
              ) : (
                <p className="text-body-secondary mb-0">Your short URL will appear here.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
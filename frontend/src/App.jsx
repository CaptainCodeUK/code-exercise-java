import { useEffect, useState } from 'react'
import { deleteShortenedUrl, listShortenedUrls, shortenUrl } from './lib/urlShortenerApi'

function App() {
  const fullUrlValidationMessage = 'Enter a full URL, including https://.'
  const [fullUrl, setFullUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState('Copy short URL')
  const [copiedRowUrl, setCopiedRowUrl] = useState('')
  const [shortenedUrls, setShortenedUrls] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [deletingAlias, setDeletingAlias] = useState('')

  const statusLabels = {
    idle: 'Ready',
    loading: 'Sending',
    success: 'Created',
    error: 'Check input',
  }

  const statusVariants = {
    idle: 'secondary',
    loading: 'warning',
    success: 'success',
    error: 'danger',
  }

  useEffect(() => {
    if (copyState !== 'Copied') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('Copy short URL')
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [copyState])

  useEffect(() => {
    if (!copiedRowUrl) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedRowUrl('')
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [copiedRowUrl])

  useEffect(() => {
    const controller = new AbortController()

    async function loadShortenedUrls() {
      setListStatus('loading')
      setListError('')

      try {
        const urls = await listShortenedUrls({ signal: controller.signal })
        setShortenedUrls(urls)
        setListStatus('success')
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        setListStatus('error')
        setListError(
          loadError instanceof Error ? loadError.message : 'Unable to load saved URLs right now.',
        )
      }
    }

    loadShortenedUrls()

    return () => controller.abort()
  }, [])

  async function refreshShortenedUrls() {
    const controller = new AbortController()

    try {
      const urls = await listShortenedUrls({ signal: controller.signal })
      setShortenedUrls(urls)
      setListStatus('success')
      setListError('')
    } catch (loadError) {
      if (controller.signal.aborted) {
        return
      }

      setListStatus('error')
      setListError(
        loadError instanceof Error ? loadError.message : 'Unable to load saved URLs right now.',
      )
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setStatus('loading')
    setShortUrl('')

    const formData = new FormData(event.currentTarget)
    const submittedFullUrl = String(formData.get('fullUrl') || '').trim()
    const submittedCustomAlias = String(formData.get('customAlias') || '').trim()

    let parsedUrl

    try {
      parsedUrl = new URL(submittedFullUrl)
    } catch {
      setStatus('error')
      setError('Enter a valid absolute URL before shortening it.')
      return
    }

    try {
      const response = await shortenUrl({
        fullUrl: parsedUrl.toString(),
        customAlias: submittedCustomAlias || null,
      })

      setShortUrl(response.shortUrl)
      setStatus('success')
      await refreshShortenedUrls()
    } catch (submitError) {
      setStatus('error')
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'The shortening request failed. Try again.',
      )
    }
  }

  async function handleCopy() {
    if (!shortUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopyState('Copied')
    } catch {
      setCopyState('Copy failed')
    }
  }

  async function handleRowCopy(url) {
    if (!url) {
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopiedRowUrl(url)
    } catch {
      setCopiedRowUrl('')
    }
  }

  async function handleDeleteAlias(alias) {
    if (!alias || deletingAlias) {
      return
    }

    const confirmed = window.confirm(`Delete alias /${alias}? This cannot be undone.`)

    if (!confirmed) {
      return
    }

    const controller = new AbortController()
    setDeletingAlias(alias)
    setListError('')

    try {
      await deleteShortenedUrl(alias, { signal: controller.signal })
      await refreshShortenedUrls()
    } catch (deleteError) {
      setListStatus('error')
      setListError(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete the selected alias right now.',
      )
    } finally {
      setDeletingAlias('')
    }
  }

  return (
    <main className="min-vh-100 bg-body-tertiary">
      <div className="container py-4 py-lg-5">
        <section className="row g-3 align-items-start align-items-lg-center mb-4">
          <div className="col-12 col-lg-8">
            <span className="badge text-bg-secondary text-uppercase mb-2">URL shortener API caller</span>
            <h1 className="display-5 fw-semibold mb-2">Shorten a link.</h1>
            <p className="lead text-body-secondary mb-0">
              Enter the original URL and, if needed, an optional custom alias.
            </p>
          </div>

          <div className="col-12 col-lg-4 text-lg-end">
            <span
              className={`badge rounded-pill text-bg-${statusVariants[status]} d-inline-flex align-items-center gap-2 px-3 py-2 fs-6`}
              aria-live="polite"
            >
              {status === 'loading' ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
              <span>{statusLabels[status]}</span>
            </span>
          </div>
        </section>

        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4 p-lg-5">
            <div className="row g-4">
              <div className="col-12 col-lg-7">
                <form onSubmit={handleSubmit}>
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
                      onChange={(event) => setFullUrl(event.target.value)}
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
                      onChange={(event) => setCustomAlias(event.target.value)}
                      placeholder="launch-notes"
                      autoComplete="off"
                    />
                    <div className="form-text">
                      Leave this blank if you want the service to choose one.
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 pt-1">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'loading'}>
                      {status === 'loading' ? 'Shortening...' : 'Create short URL'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => {
                        setFullUrl('')
                        setCustomAlias('')
                        setShortUrl('')
                        setError('')
                        setStatus('idle')
                      }}
                    >
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
                  <h2 className="h5 mb-3">Short URL</h2>
                  {shortUrl ? (
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                      <a className="link-primary fw-semibold text-break" href={shortUrl} target="_blank" rel="noreferrer">
                        {shortUrl}
                      </a>
                      <button
                        type="button"
                        className="btn btn-outline-secondary flex-shrink-0"
                        onClick={handleCopy}
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

        <section className="card border-0 shadow-sm">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
              <div>
                <span className="badge text-bg-secondary text-uppercase mb-2">Saved URLs</span>
                <h2 className="h4 mb-0">Existing shortened links</h2>
              </div>
              <span className="text-body-secondary">
                {shortenedUrls.length} link{shortenedUrls.length === 1 ? '' : 's'} found
              </span>
            </div>

            {listError ? (
              <div className="alert alert-danger" role="alert">
                {listError}
              </div>
            ) : null}

            {listStatus === 'loading' ? (
              <div className="d-flex align-items-center gap-2 text-body-secondary py-4">
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                <span>Loading existing URLs...</span>
              </div>
            ) : shortenedUrls.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Full URL</th>
                      <th scope="col">Alias</th>
                      <th scope="col">Short URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortenedUrls.map((entry) => (
                      <tr key={entry.alias ?? entry.shortUrl}>
                        <td className="text-break">
                          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                            <span className="text-break">{entry.fullUrl}</span>
                            <a
                              className="btn btn-outline-secondary btn-sm flex-shrink-0"
                              href={entry.fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open full URL in a new window: ${entry.fullUrl}`}
                              title="Open full URL in a new window"
                            >
                              Open
                            </a>
                          </div>
                        </td>
                        <td className="fw-semibold">/{entry.alias}</td>
                        <td className="text-break">
                          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                            <span className="text-break">{entry.shortUrl}</span>
                            <div className="d-flex gap-2 flex-shrink-0">
                              <a
                                className="btn btn-outline-secondary btn-sm"
                                href={entry.shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open short URL in a new window: ${entry.shortUrl}`}
                                title="Open short URL in a new window"
                              >
                                Open
                              </a>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleRowCopy(entry.shortUrl)}
                                title={copiedRowUrl === entry.shortUrl ? 'Copied to clipboard' : 'Copy short URL'}
                                aria-label={copiedRowUrl === entry.shortUrl ? 'Copied to clipboard' : 'Copy short URL'}
                              >
                                {copiedRowUrl === entry.shortUrl ? 'Copied' : 'Copy'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteAlias(entry.alias)}
                                disabled={deletingAlias === entry.alias}
                                title={deletingAlias === entry.alias ? 'Deleting alias' : `Delete alias /${entry.alias}`}
                                aria-label={deletingAlias === entry.alias ? 'Deleting alias' : `Delete alias /${entry.alias}`}
                              >
                                {deletingAlias === entry.alias ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-body-secondary mb-0">No shortened URLs have been created yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App

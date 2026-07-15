import { useEffect, useState } from 'react'
import {
  deleteShortenedUrl,
  findShortenedUrl,
  getApiBaseUrl,
  listShortenedUrls,
  shortenUrl,
} from './lib/urlShortenerApi'
import ShortenerPanel from './components/ShortenerPanel'
import SavedUrlsList from './components/SavedUrlsList'

function App() {
  const fullUrlValidationMessage = 'Enter a full URL, including https://.'
  const pathname = window.location.pathname
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
  const [routeStatus, setRouteStatus] = useState('checking')
  const [missingAlias, setMissingAlias] = useState('')

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
    const normalizedPath = pathname.replace(/\/+$/, '') || '/'

    if (normalizedPath === '/') {
      setRouteStatus('home')
      return undefined
    }

    const pathSegments = normalizedPath.split('/').filter(Boolean)

    if (pathSegments.length !== 1) {
      setMissingAlias(pathSegments.join('/'))
      setRouteStatus('not-found')
      return undefined
    }

    const alias = pathSegments[0]
    const controller = new AbortController()

    setRouteStatus('redirecting')
    setMissingAlias('')

    async function resolveAlias() {
      try {
        const shortenedUrl = await findShortenedUrl(alias, { signal: controller.signal })

        if (!shortenedUrl) {
          setMissingAlias(alias)
          setRouteStatus('not-found')
          return
        }

        window.location.replace(
          `${getApiBaseUrl()}/UrlShortener/${encodeURIComponent(shortenedUrl.alias)}`,
        )
      } catch (resolveError) {
        if (controller.signal.aborted) {
          return
        }

        setMissingAlias(alias)
        setRouteStatus('not-found')
      }
    }

    resolveAlias()

    return () => controller.abort()
  }, [pathname])

  useEffect(() => {
    if (routeStatus !== 'home') {
      return undefined
    }

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
  }, [routeStatus])

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

  if (routeStatus === 'checking' || routeStatus === 'redirecting') {
    return (
      <main className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center">
        <div className="text-center px-4">
          <div className="spinner-border text-secondary mb-3" role="status" aria-hidden="true" />
          <h1 className="h4 mb-2">Checking link...</h1>
          <p className="text-body-secondary mb-0">Looking up the requested short URL.</p>
        </div>
      </main>
    )
  }

  if (routeStatus === 'not-found') {
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
                    We could not find a shortened link for {missingAlias ? <strong>/{missingAlias}</strong> : 'this path'}.
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

        <ShortenerPanel
          status={status}
          statusLabels={statusLabels}
          statusVariants={statusVariants}
          fullUrlValidationMessage={fullUrlValidationMessage}
          fullUrl={fullUrl}
          onFullUrlChange={setFullUrl}
          customAlias={customAlias}
          onCustomAliasChange={setCustomAlias}
          onSubmit={handleSubmit}
          onClear={() => {
            setFullUrl('')
            setCustomAlias('')
            setShortUrl('')
            setError('')
            setStatus('idle')
          }}
          error={error}
          shortUrl={shortUrl}
          copyState={copyState}
          onCopyShortUrl={handleCopy}
        />

        <SavedUrlsList
          shortenedUrls={shortenedUrls}
          listStatus={listStatus}
          listError={listError}
          copiedRowUrl={copiedRowUrl}
          deletingAlias={deletingAlias}
          onCopyRow={handleRowCopy}
          onDeleteAlias={handleDeleteAlias}
        />
      </div>
    </main>
  )
}

export default App

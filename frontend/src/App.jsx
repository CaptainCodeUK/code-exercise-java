import { useEffect, useRef, useState } from 'react'
import {
  deleteShortenedUrl,
  findShortenedUrl,
  getApiBaseUrl,
  listShortenedUrls,
  shortenUrl,
} from './lib/urlShortenerApi'
import ShortenerPanel from './components/ShortenerPanel'
import RouteErrorMessage from './components/RouteErrorMessage'
import RouteNotFoundMessage from './components/RouteNotFoundMessage'
import SavedUrlsList from './components/SavedUrlsList'

function App() {
  const fullUrlValidationMessage = 'Enter a full URL, including https://.'
  const pathname = window.location.pathname
  const openShortenerButtonRef = useRef(null)
  const shortenerDialogRef = useRef(null)
  const [fullUrl, setFullUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [isShortenerOpen, setIsShortenerOpen] = useState(false)
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
  const [routeError, setRouteError] = useState('')

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
    if (!isShortenerOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        handleCloseShortener()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isShortenerOpen])

  useEffect(() => {
    if (!isShortenerOpen) {
      openShortenerButtonRef.current?.focus()
      return undefined
    }

    const dialog = shortenerDialogRef.current

    if (!dialog) {
      return undefined
    }

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    function getFocusableElements() {
      return Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        (element) => element instanceof HTMLElement && element.tabIndex !== -1,
      )
    }

    function handleKeyDown(event) {
      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = getFocusableElements()

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstFocusableElement = focusableElements[0]
      const lastFocusableElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault()
        lastFocusableElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault()
        firstFocusableElement.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [isShortenerOpen])

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
      setRouteError('')
      return undefined
    }

    const pathSegments = normalizedPath.split('/').filter(Boolean)

    if (pathSegments.length !== 1) {
      setMissingAlias(pathSegments.join('/'))
      setRouteError('')
      setRouteStatus('not-found')
      return undefined
    }

    const alias = pathSegments[0]
    const controller = new AbortController()

    setRouteStatus('redirecting')
    setMissingAlias('')
    setRouteError('')

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

        setRouteError(
          resolveError instanceof Error
            ? resolveError.message
            : 'Unable to check the requested short URL right now.',
        )
        setRouteStatus('error')
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

  function resetShortenerState() {
    setFullUrl('')
    setCustomAlias('')
    setShortUrl('')
    setError('')
    setStatus('idle')
    setCopyState('Copy short URL')
  }

  function handleCloseShortener() {
    resetShortenerState()
    setIsShortenerOpen(false)
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
    return <RouteNotFoundMessage alias={missingAlias} />
  }

  if (routeStatus === 'error') {
    return <RouteErrorMessage message={routeError} alias={missingAlias} />
  }

  return (
    <main className="min-vh-100 bg-body-tertiary position-relative">
      <div className="container py-4 py-lg-5">
        <section className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
          <div>
            <span className="badge text-bg-secondary text-uppercase mb-2">URL shortener API caller</span>
            <h1 className="display-5 fw-semibold mb-2">Saved aliases</h1>
            <p className="lead text-body-secondary mb-0">Review existing shortened links and create a new alias when needed.</p>
          </div>

          <button
            ref={openShortenerButtonRef}
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setIsShortenerOpen(true)}
          >
            Create new alias
          </button>
        </section>

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

      {isShortenerOpen ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 1080 }}
          onClick={handleCloseShortener}
          role="presentation"
        >
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" aria-hidden="true" />

          <div
            className="position-relative w-100"
            style={{ maxWidth: '1120px' }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-alias-title"
            ref={shortenerDialogRef}
            tabIndex={-1}
          >
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
              onClear={resetShortenerState}
              error={error}
              shortUrl={shortUrl}
              copyState={copyState}
              onCopyShortUrl={handleCopy}
              onClose={handleCloseShortener}
              className="mb-0 shadow-lg"
              titleId="create-alias-title"
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App

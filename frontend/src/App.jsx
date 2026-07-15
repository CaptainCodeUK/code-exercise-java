import { useEffect, useState } from 'react'
import { shortenUrl } from './lib/urlShortenerApi'
import './App.css'

function App() {
  const fullUrlValidationMessage = 'Enter a full URL, including https://.'
  const [fullUrl, setFullUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState('Copy short URL')

  useEffect(() => {
    if (copyState !== 'Copied') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('Copy short URL')
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [copyState])

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

  return (
    <main className="shell">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">URL shortener API caller</span>
          <h1>Shorten a link.</h1>
          <p>Enter the original URL and, if needed, an optional custom alias.</p>
        </div>

        <div className="status-chip" aria-live="polite">
          <span className={`status-dot status-dot--${status}`} />
          <span>
            {status === 'idle' && 'Ready'}
            {status === 'loading' && 'Sending'}
            {status === 'success' && 'Created'}
            {status === 'error' && 'Check input'}
          </span>
        </div>
      </section>

      <section className="card app-card">
        <form className="shortener-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full URL</span>
            <input
              name="fullUrl"
              type="url"
              required
              inputMode="url"
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
          </label>

          <label className="field">
            <span>
              Custom alias <span className="field-tag">optional</span>
            </span>
            <input
              name="customAlias"
              type="text"
              value={customAlias}
              onChange={(event) => setCustomAlias(event.target.value)}
              placeholder="launch-notes"
              autoComplete="off"
            />
            <span className="field-note">Leave this blank if you want the service to choose one.</span>
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={status === 'loading'}>
              {status === 'loading' ? 'Shortening...' : 'Create short URL'}
            </button>
            <button
              type="button"
              className="secondary-button"
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

          {error ? <p className="feedback feedback--error">{error}</p> : null}
        </form>

        <section className="result-panel" aria-live="polite">
          <h2>Short URL</h2>
          <div className="result-box">
            {shortUrl ? (
              <>
                <a className="result-link" href={shortUrl} target="_blank" rel="noreferrer">
                  {shortUrl}
                </a>
                <button type="button" className="secondary-button" onClick={handleCopy}>
                  {copyState}
                </button>
              </>
            ) : (
              <p className="placeholder">Your short URL will appear here.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App

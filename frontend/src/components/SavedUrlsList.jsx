export default function SavedUrlsList({
  shortenedUrls,
  listStatus,
  listError,
  copiedRowUrl,
  deletingAlias,
  onCopyRow,
  onDeleteAlias,
}) {
  return (
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
                            onClick={() => onCopyRow(entry.shortUrl)}
                            title={copiedRowUrl === entry.shortUrl ? 'Copied to clipboard' : 'Copy short URL'}
                            aria-label={copiedRowUrl === entry.shortUrl ? 'Copied to clipboard' : 'Copy short URL'}
                          >
                            {copiedRowUrl === entry.shortUrl ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onDeleteAlias(entry.alias)}
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
  )
}
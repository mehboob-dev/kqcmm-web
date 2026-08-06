import { Link } from 'react-router-dom'
import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

/** Themed cover gradient from a book's cover color (or the app accent). */
export function coverGradient(cover) {
  const base = cover || 'var(--accent)'
  return `linear-gradient(135deg, ${base}, ${base}cc 60%, ${base}88)`
}

export default function BooksIndex() {
  const { lang } = useLanguage()
  const { strings } = {} // not used directly; titles come from the index file
  const { data, loading } = usePageContent(lang, 'books/_index')

  if (loading || !data) {
    return (
      <div className="content-page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      </div>
    )
  }

  const books = data.books || []
  const live = books.filter((b) => b.status !== 'coming-soon')
  const soon = books.filter((b) => b.status === 'coming-soon')

  return (
    <div className="content-page">
      <SeoHead
        title="Books"
        path={routeForPage('books')}
        description="Written works of Hajee Mahboob Kassim — books on the Holy Prophet, the Ahl-e-Bait, and Islamic spiritual teachings."
      />
      <h2 className="page-title">Books</h2>
      <p className="page-desc" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
        Written works of Hajee Mahboob Kassim
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        {live.map((book) => (
          <Link
            key={book.slug}
            to={`/books/${book.slug}`}
            className="book-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="book-cover"
              style={{
                background: coverGradient(book.cover),
                color: '#fff',
                aspectRatio: '3 / 4',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'flex-end',
                padding: 12,
                fontWeight: 700,
                fontSize: '1em',
                textShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}
            >
              {book.title}
            </div>
            <div className="book-meta" style={{ marginTop: 6, fontSize: '0.82em' }}>
              <div style={{ color: 'var(--text)' }}>{book.author}</div>
              {book.chapterCount > 0 && (
                <div style={{ color: 'var(--text-muted)' }}>{book.chapterCount} chapters</div>
              )}
            </div>
          </Link>
        ))}

        {soon.map((book) => (
          <div key={book.slug} className="book-card" style={{ opacity: 0.55 }}>
            <div
              className="book-cover"
              style={{
                background: coverGradient(book.cover),
                color: '#fff',
                aspectRatio: '3 / 4',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1em',
                textAlign: 'center',
                padding: 12,
              }}
            >
              {book.title}
              <div style={{ fontSize: '0.72em', fontWeight: 400, marginTop: 6 }}>🔒 Coming soon</div>
            </div>
            <div className="book-meta" style={{ marginTop: 6, fontSize: '0.82em', color: 'var(--text-muted)' }}>
              {book.author}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

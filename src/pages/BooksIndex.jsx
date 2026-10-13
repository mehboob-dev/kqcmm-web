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

      <div className="books-hero">
        <div className="books-hero-badge">Library & Publications</div>
        <h1 className="books-hero-title">Books</h1>
        <p className="books-hero-desc">
          Written works of Hajee Mahboob Kassim on the Holy Prophet (SAW), the Ahl-e-Bait, and Islamic spiritual teachings.
        </p>
      </div>

      <div className="books-grid">
        {live.map((book) => (
          <Link
            key={book.slug}
            to={`/books/${book.slug}`}
            className="book-card-item"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="book-cover-wrap"
              style={{
                background: coverGradient(book.cover),
              }}
            >
              <div className="book-cover-accent-line" />
              <div className="book-cover-title">{book.title}</div>
            </div>
            <div className="book-card-body">
              <div className="book-author-text">{book.author}</div>
              {book.chapterCount > 0 && (
                <div className="book-chapter-text">{book.chapterCount} chapters</div>
              )}
            </div>
          </Link>
        ))}

        {soon.map((book) => (
          <div key={book.slug} className="book-card-item" style={{ opacity: 0.65 }}>
            <div
              className="book-cover-wrap"
              style={{
                background: coverGradient(book.cover),
              }}
            >
              <div className="book-badge-soon">🔒 Coming soon</div>
              <div className="book-cover-accent-line" />
              <div className="book-cover-title">{book.title}</div>
            </div>
            <div className="book-card-body">
              <div className="book-author-text">{book.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

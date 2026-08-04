import { useParams } from 'react-router-dom'
import SeoHead from '../components/SeoHead'
import GenericContentRenderer from '../components/GenericContentRenderer'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent, resolveLocale } from '../config/content'
import { pageByRoute } from '../config/pageRoutes'
import pageRoutes from '../config/pageRoutes.json'

// Used when no explicit pageId is available (e.g. a direct alias or unknown
// route): derive a stable key from the registry id or the route slug.
function pageKeyFor(entry, route) {
  if (entry?.id) return entry.id
  return (route || '').replace(/^\//, '') || 'generic'
}

export default function GenericContentPage() {
  const { lang } = useLanguage()
  const params = useParams()
  // Canonical registry entry for this route. Because aliases redirect via
  // <Navigate>, by the time this renders the pathname should be canonical, but
  // we still fall back to the slug if something is off.
  const route = window.location.pathname.replace(/^\/kqcmm-web/, '') || '/'
  const entry = pageByRoute(route) || pageRoutes.find(p => p.route === route) || null
  const contentFile = entry?.contentFile || params.slug
  const pageKey = pageKeyFor(entry, route)

  const { data, loading } = usePageContent(lang, contentFile)

  if (loading) {
    return (
      <div className="content-page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      </div>
    )
  }

  const content = data ? resolveLocale(data, lang) : null
  const title = content?.title || entry?.route?.replace(/^\//, '') || 'Page'

  return (
    <>
      <SeoHead title={title} path={route} description={content?.intro || `Page ${title}`} />
      {content ? (
        <GenericContentRenderer content={content} pageKey={pageKey} />
      ) : (
        <div className="content-page">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            No content yet.
          </p>
        </div>
      )}
    </>
  )
}

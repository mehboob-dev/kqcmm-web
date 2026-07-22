import SeoHead from '../components/SeoHead'
import { Link, useOutletContext } from 'react-router-dom'

export default function NotFound() {
  const { strings } = useOutletContext()
  return (
    <div className="not-found">
      <SeoHead title="Page Not Found" path="/404" description="The requested page could not be found on KQCMM." />
      <h2>{strings.notFound.title}</h2>
      <p>{strings.notFound.msg}</p>
      <Link to="/" className="quick-link" style={{ display: 'inline-flex' }}>
        {strings.notFound.goHome}
      </Link>
    </div>
  )
}

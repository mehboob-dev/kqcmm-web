import SeoHead from '../components/SeoHead'
import { Link, useOutletContext } from 'react-router-dom'

export default function NotFound() {
  const { strings } = useOutletContext()
  return (
    <div className="not-found">
      <SeoHead title="Page Not Found" path="/404" description="The requested page could not be found on KQCMM." />
      <div className="nf-code">{strings.notFound.title}</div>
      <p className="nf-msg">{strings.notFound.msg}</p>
      <Link to="/" viewTransition className="nf-btn">
        {strings.notFound.goHome}
      </Link>
    </div>
  )
}

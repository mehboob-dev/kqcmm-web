import { Link, useOutletContext } from 'react-router-dom'

export default function NotFound() {
  const { strings } = useOutletContext()
  return (
    <div className="not-found">
      <h2>{strings.notFound.title}</h2>
      <p>{strings.notFound.msg}</p>
      <Link to="/" className="quick-link" style={{ display: 'inline-flex' }}>
        {strings.notFound.goHome}
      </Link>
    </div>
  )
}

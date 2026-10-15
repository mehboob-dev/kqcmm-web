export default function ContentSkeleton({ rows = 3, hero = true }) {
  return (
    <div className="content-page skeleton-page" aria-busy="true" aria-label="Loading">
      {hero && <div className="skel skel-hero" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skel skel-card"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}

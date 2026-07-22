import { Helmet } from 'react-helmet-async'

export default function SeoHead({ title, description, image, path }) {
  const siteName = 'KQCMM'
  const baseUrl = 'https://mehboob-dev.github.io/kqcmm-web'
  const ogImage = image || `${baseUrl}/og-image.png`
  const fullTitle = title ? `KQCMM - ${title}` : siteName
  const liveUrl = path ? `${baseUrl}${path}` : baseUrl

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={liveUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}

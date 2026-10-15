import { useMemo, useState } from 'react'
import SeoHead from '../components/SeoHead'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Icon from '../components/FontAwesome'
import homeConfig from '../config/home.json'
import { pageById, routeForNavItem, routeForPage } from '../config/pageRoutes'
import { usePageContent } from '../config/content'
import { useLanguage } from '../context/LanguageContext'
import { readProgressMap } from '../utils/bookProgress'
import {
  todayLocal,
  todayHijri,
  enumerateOccurrences,
  hijriLabel,
  hijriMonthLength,
  formatISODate,
  localizedEvent,
} from '../utils/hijriCalendar'
import { moonPhaseInfo } from '../utils/moonPhase'
import MoonPhaseIcon from '../components/MoonPhaseIcon'
import { coverGradient } from './BooksIndex'

// Home page tiles are driven by src/config/home.json — editable from the admin
// panel (🏠 Home tab). Each tile references a registry pageId + a FontAwesome
// icon name; the label is derived per language from the page's titleKey in
// strings.drawer (so labels stay translated automatically).
const homePageRoutes = (homeConfig.tiles || []).map(tile => {
  const page = pageById(tile.pageId)
  return {
    to: routeForNavItem({ pageId: tile.pageId }),
    icon: tile.icon,
    labelKey: page?.titleKey || tile.pageId,
  }
})

// The Home page is a dashboard: today (Hijri date + events) first, then a
// continue-reading shortcut, the dua of the day, and the config-driven
// explore grid. Everything degrades gracefully when content is missing.
const LAST_BOOK_KEY = 'kqcmm_last_book'

export default function Home() {
  const { strings } = useOutletContext()
  const { lang } = useLanguage()
  const navigate = useNavigate()

  const { data: calData } = usePageContent(lang, 'calendar')
  const { data: duaData } = usePageContent(lang, 'dua')
  const { data: booksData } = usePageContent(lang, 'books/_index')

  const [progressMap] = useState(() => readProgressMap())

  // --- Today (Hijri date + events) for the date hero ---
  const today = todayLocal()
  const todayStr = formatISODate(today)
  const dateInfo = useMemo(() => {
    if (!calData) return null
    const monthNames = calData.monthNames || []
    const hijri = todayHijri(calData.monthStarts)
    const moon = hijri.ok
      ? moonPhaseInfo(
          hijri.hijriDay,
          hijriMonthLength(calData.monthStarts, hijri.hijriYear, hijri.hijriMonth),
        )
      : null
    const eventsById = new Map((calData.events || []).map(ev => [ev.id, ev]))
    const labels = []
    for (const o of enumerateOccurrences(calData)) {
      if (!o.available || !o.gregorianStart || formatISODate(o.gregorianStart) !== todayStr) continue
      const ev = eventsById.get(o.id)
      const label = ev ? localizedEvent(ev, lang, monthNames).label : o.id
      if (label && !labels.includes(label)) labels.push(label)
    }
    return { hijri, monthNames, labels, moon }
  }, [calData, lang, todayStr])

  const gregLabel = new Date(today.y, today.m - 1, today.d).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // --- Continue reading (last opened book + saved chapter) ---
  const lastBook = useMemo(() => {
    if (!booksData?.books) return null
    let slug = null
    try { slug = localStorage.getItem(LAST_BOOK_KEY) } catch { /* blocked */ }
    if (!slug) return null
    const entry = booksData.books.find(b => b.slug === slug && (!b.status || b.status === 'live'))
    if (!entry) return null
    const savedIdx = progressMap[slug]
    if (!Number.isInteger(savedIdx) || savedIdx < 0) return null
    const total = entry.chapterCount || 0
    const pct = total > 0 ? Math.min(100, Math.round(((savedIdx + 1) / total) * 100)) : 0
    return { ...entry, idx: savedIdx, total, pct }
  }, [booksData, progressMap])

  // --- Dua of the day (rotates by day of month) ---
  const dailyDua = useMemo(() => {
    const duas = duaData?.[lang]?.duas || duaData?.en?.duas || []
    if (!duas.length) return null
    const dua = duas[today.d % duas.length]
    const text = (dua.text || '').trim()
    return {
      heading: dua.heading || '',
      text: text.length > 190 ? text.slice(0, 190).trimEnd() + '…' : text,
    }
  }, [duaData, lang, today.d])

  return (
    <>
      <SeoHead title="Home" path="" description="Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya — Spiritual platform for followers of the Chishti Sufi order. Duas, khatm, fateha, kalam, sijrah nama and more." />
      <div className="home-container content-page">

        {/* Brand row */}
        <div className="dash-brand">
          <img className="dash-brand-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="KQCMM" />
          <div>
            <p className="dash-brand-name">KQCMM</p>
            <p className="dash-brand-tag">{strings.tagline}</p>
          </div>
        </div>

        {/* Today — Hijri date hero with today's events */}
        <button
          className="dash-date"
          onClick={() => navigate(routeForPage('calendar'), { viewTransition: true })}
          aria-label="Open Islamic calendar"
        >
          <span className="pattern-layer" aria-hidden="true" />
          <span className="dash-date-greg">{gregLabel}</span>
          <span className="dash-date-hijri">
            {dateInfo?.hijri?.ok
              ? hijriLabel(dateInfo.hijri.hijriYear, dateInfo.hijri.hijriMonth, dateInfo.hijri.hijriDay, dateInfo.monthNames, lang)
              : '—'}
          </span>
          {dateInfo?.labels?.length > 0 && (
            <span className="dash-date-events">
              <Icon name="faStarAndCrescent" />
              <span className="dash-date-events-text">{dateInfo.labels.slice(0, 2).join(' · ')}</span>
            </span>
          )}
          {dateInfo?.moon && (
            <span className="dash-moon" aria-hidden="true">
              <MoonPhaseIcon fraction={dateInfo.moon.fraction} size={54} />
              <span className="dash-moon-label">{strings.moon?.[dateInfo.moon.key]}</span>
            </span>
          )}
        </button>

        {/* Continue reading */}
        {lastBook && (
          <Link to={`/books/${lastBook.slug}`} viewTransition className="dash-continue">
            <span className="dash-continue-cover" style={{ background: coverGradient(lastBook.cover) }}>
              <Icon name="faBookOpen" />
            </span>
            <span className="dash-continue-body">
              <span className="dash-continue-eyebrow">{strings.home?.continueReading || 'Continue reading'}</span>
              <span className="dash-continue-title">{lastBook.title}</span>
              <span className="dash-continue-meta">
                {(strings.home?.chapter || 'Chapter')} {Math.min(lastBook.idx + 1, lastBook.total)} / {lastBook.total}
              </span>
              <span className="dash-prog">
                <span className="dash-prog-fill" style={{ width: `${lastBook.pct}%` }} />
              </span>
            </span>
            <span className="dash-continue-arrow"><Icon name="faChevronRight" /></span>
          </Link>
        )}

        {/* Dua of the day */}
        {dailyDua && (
          <Link to={routeForPage('dua')} viewTransition className="dash-dua">
            <span className="dash-dua-eyebrow">
              <Icon name="faHandsPraying" />
              {strings.home?.duaOfDay || 'Dua of the day'}
            </span>
            <span className="dash-dua-heading">{dailyDua.heading}</span>
            <span className="dash-dua-text">{dailyDua.text}</span>
            <span className="dash-dua-cta">
              {strings.home?.readNow || 'Read'}
              <Icon name="faArrowRight" />
            </span>
          </Link>
        )}

        {/* Explore — config-driven quick links */}
        <div className="home-section-label">{strings.home?.explore || 'Explore'}</div>
        <div className="home-quick-links" data-tour="home-links">
          {homePageRoutes.map((link) => {
            const label = strings.drawer[link.labelKey] || link.labelKey
            return (
              <Link
                key={link.to}
                to={link.to}
                viewTransition
                className="quick-link"
                data-tour={`home-link-${link.labelKey}`}
              >
                <span className="ql-icon"><Icon name={link.icon} /></span>
                <span className="ql-label">{label}</span>
              </Link>
            )
          })}
        </div>

        <div className="home-foot">
          <span className="ornament" aria-hidden="true"><span className="ornament-diamond" /></span>
        </div>
      </div>
    </>
  )
}

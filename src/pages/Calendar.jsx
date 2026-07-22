import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/calendar.json'

export default function Calendar() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <SeoHead title="Islamic Calendar" description="Upcoming Islamic events, important dates, and spiritual observances from the Chishti tradition." />
      <h2 className="page-title">{content.title}</h2>
      <div className="calendar-grid">
        {content.events.map((ev, i) => (
          <div key={i} className="cal-event">
            <div className="cal-date">
              {ev.date}
              <span className="cal-month">{ev.month}</span>
            </div>
            <div className="cal-info">
              <div className="cal-event-title">{ev.title}</div>
              <div className="cal-event-desc">{ev.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

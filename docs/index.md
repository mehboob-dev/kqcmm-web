# KQCMM Documentation Index

Welcome to the KQCMM web app documentation. Choose a topic below.

## For New Developers
- [New Developer Guide](new-developer-guide.md) — Start here if you're new to the project

## Architecture & Design
- [Architecture Overview](architecture.md) — System architecture, data flow, route map
- [Architectural Decisions](decisions.md) — ADRs: createRoot-not-hydrate, plugin-owned manifest, no empty JSON shells, per-language content, books shape
- [Component Reference](components.md) — Every React component explained
- [Content System](content.md) — Content JSON structure, master-child cards, editing
- [Styling Guide](styling.md) — CSS variables, themes, card system, fonts, RTL

## Books (Hajee Mahboob Kassim)
- [Books Integration](books.md) — design & implementation reference for the library feature (import pipeline, content model, BookReader, admin editor)

## Operations
- [Deployment Guide](deployment.md) — Building, deploying, troubleshooting
- [Forcing a Build](force-build.md) — step-by-step ways to trigger a deploy when a push is skipped
- [PWA & Offline Support](pwa.md) — Service worker, caching, installable app
- [SEO & Pre-rendering](seo.md) — Meta tags, OG images, Puppeteer prerender
- [Analytics (GA4)](analytics.md) — Usage tracking, what's measured, activation
- [GA4 Console Setup](ga4-setup.md) — Conversions, own-traffic exclusion, dashboard, enhanced measurement
- [Scripts Reference](scripts.md) — All CLI tools and utilities
- [Hijri Calendar Plan](hijri-calendar-plan.md) — Islamic calendar (v1 implemented: admin-maintained month starts)

## Onboarding
- [OnboardingTour walkthrough](components.md#onboardingtourjsx-first-run-walkthrough) — the first-run guided tour (see also `docs/scripts.md` for its tests)

## Release Notes
- [Public Changelog](content.md#changelog) — user-facing changes only (shown on `/changelog`)
- [Developer Changelog](DEVCHANGELOG.md) — complete record, including internal/refactor/docs changes

## Future Ideas
- [Suggestions](suggestions.md) — feature ideas (with ✅ for shipped items)

## Quick Links
| File | Purpose |
|---|---|
| `CLAUDE.md` | Project root — architecture summary |
| `README.md` | Quick start — setup and commands |
| `MEMORY.md` | Memory index |

# Update Documentation Skill

Update all documentation files after making changes to the project. This skill handles the full doc update cycle: updating existing docs, creating new ones if needed, updating the changelog and version number, and adding instructions to CLAUDE.md.

## Trigger

Call this skill after:
- Adding a new feature, component, or page
- Changing the project structure or architecture
- Updating the build pipeline or deployment process
- Bumping the version number

## Workflow

### Phase 1: Understand Current State

Read these files to understand the existing doc structure and patterns:

1. **`docs/index.md`** — Main doc index to know what docs exist
2. **`CLAUDE.md`** — Project root doc with architecture, project tree, and instructions
3. **`MEMORY.md`** — Memory index
4. **`README.md`** — Quick start and overview
5. **`docs/`** — All existing docs to match the style

### Phase 2: Determine What to Update

For each change made, determine which files need updating:

| If you changed... | Update these docs |
|---|---|
| Components | `docs/components.md` — add new component or update existing |
| Pages / Routes | `docs/architecture.md` (route map), `CLAUDE.md` (project tree) |
| Build system / Config | `docs/deployment.md`, `docs/index.md` |
| Content files | `docs/content.md` |
| Scripts | `docs/scripts.md`, `src/config/content/changelog.json` |
| Styling / Themes / Fonts | `docs/styling.md` |
| PWA / Service Worker | `docs/pwa.md` |
| SEO / Meta tags | `docs/seo.md` |
| Dependencies | `docs/architecture.md` (technologies table) |
| Project tree | `CLAUDE.md` (project structure section), `README.md` |

### Phase 3: Create New Docs (if needed)

If a new area is introduced that doesn't have a doc yet, create a new `.md` file in `docs/` following the same style:

- Use `---` as section separators
- Use tables for structured data
- Use code blocks (with language) for code examples
- Use ASCII diagrams where helpful
- Keep the same voice as existing docs

Then add it to:
- `docs/index.md` in the relevant section
- `MEMORY.md` documentation index table

### Phase 4: Update Changelog

**File:** `src/config/content/changelog.json`

1. Add a new entry at the **top** of the `versions` array
2. Increment the version number appropriately:
   - New feature: bump minor (e.g., 5.2.0 → 5.3.0)
   - Bug fix: bump patch (e.g., 5.2.0 → 5.2.1)
   - Major rewrite: bump major (e.g., 5.2.0 → 6.0.0)
3. List changes as bullet points in **all 3 languages** (en, hinglish, urdu)
4. Use today's date (`date` field, format: `"2026-MM-DD"`)

### Phase 5: Update Version Number

Update the version in these files (all must match):

| File | Where |
|---|---|
| `package.json` | `"version": "x.y.z"` |
| `src/pages/About.jsx` | Version card text |
| `src/config/content/changelog.json` | New entry version + date |

### Phase 6: Update CLAUDE.md Instructions

If the change introduces a new maintenance workflow, add or update the relevant section at the end of `CLAUDE.md`. Follow the existing pattern like the "Changelog" section:

```markdown
## 📝 Changelog

Version history is in `src/config/content/changelog.json` (3 languages). When making significant changes:

1. Add a new entry at the top of the `versions` array with the next version number
2. List changes as bullet points in the user's language
3. Update `package.json` version to match
4. Update the Version card in `src/pages/About.jsx`
5. Run `npm run build` afterwards to re-prerender
```

### Phase 7: Update Other Referencing Files

Check and update these supporting files:

- `MEMORY.md` — Add new doc references, update file counts
- `README.md` — Update tech stack, routes, features, docs table
- `docs/index.md` — Add new doc to navigation

### Phase 8: Final Verification

1. Rebuild to make sure everything compiles:
   ```bash
   npm run build
   ```
2. Verify the changelog page renders correctly:
   ```bash
   npm run preview
   # Visit /changelog
   ```

---

## Example: Adding a New Component

If you added a new component `FooBar.jsx` in `src/components/`:

1. **`docs/components.md`** — Add a new `## FooBar.jsx` section with its props and behaviour
2. **`CLAUDE.md`** — Add `│   │   ├── FooBar.jsx            # Description` to the project tree
3. **`src/config/content/changelog.json`** — Add version entry: `"Added FooBar component"`
4. **`package.json`** — Bump version
5. **`src/pages/About.jsx`** — Update version card
6. **`npm run build`** — Rebuild

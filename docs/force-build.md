# Forcing a Deploy / Build

The GitHub Actions workflow in `.github/workflows/deploy.yml` **skips** pushes that touch only non-deployed files (`*.md`, `docs/**`, `scripts/**`). This doc explains when a push is skipped, and how to **force** a rebuild when you actually need one.

---

## When pushes are skipped

The workflow only builds when **at least one** changed file is deployed to the site. It is skipped when **every** changed file is in one of:

| Ignored path | Examples |
|---|---|
| `*.md` | `README.md`, `CLAUDE.md` |
| `docs/**` | `docs/deployment.md`, `docs/components.md` |
| `scripts/**` | `scripts/admin/**`, `scripts/content-editor.mjs`, `scripts/test-hijri-calendar.mjs` |

Any other change (anything under `src/`, `public/`, `index.html`, `package.json`, `.github/workflows/`) **triggers** a build — even if mixed with docs in the same push.

---

## Why would you need to force a build?

Normally you don't — docs/scripts pushes are skipped **on purpose** to save Actions minutes. But force a build when:

- You changed a **docs/scripts-only file** but want to **re-run the full build** to validate it (e.g. you edited `deploy.yml`, or you want to confirm a script change doesn't break the build).
- The last deploy **failed or was cancelled** and you want to re-trigger it.
- You want to pick up a **new commit** after a `paths-ignore` skip you'd rather have built.

---

## Option 1: Manual "Run workflow" button (recommended)

The workflow is `workflow_dispatch`-enabled, so you can trigger it from the GitHub UI:

1. Open your repo on GitHub.
2. Click the **Actions** tab.
3. In the left sidebar, click **"Deploy to GitHub Pages"**.
4. On the workflow page, click the **"Run workflow"** button (top right of the list, near "This workflow has a workflow_dispatch event trigger").
5. In the dropdown, make sure **Branch: main** is selected.
6. Click the green **"Run workflow"** button.
7. Watch the run appear at the top of the list — it will build and deploy.

> The "Run workflow" button only appears if you're on the workflow's own page (not the "All workflows" list).

---

## Option 2: Empty commit

Push a commit with no file changes. The push still fires the `push` event, and GitHub evaluates `paths-ignore` against the (empty) file list — since no files changed, the run is **not** skipped and the build runs.

```bash
git commit --allow-empty -m "force deploy"
git push origin main
```

---

## Option 3: Touch a buildable file

Make a trivial change to a file that **is** deployed, then push. The workflow sees a buildable change and runs normally.

```bash
# touch a content file (or any src/ file) — it ships to the site
echo "" >> src/config/content/changelog.json
git add src/config/content/changelog.json
git commit -m "force deploy"
git push origin main
```

> Prefer this only when you actually need the site content to change — otherwise use Option 1 or 2.

---

## Verifying the build ran

After forcing, check that a run started:

```bash
gh run list --limit 3 --json displayTitle,event,status,headSha
```

- If the newest run is **`in_progress`** or **`completed`** for your commit — good, the build is running/done.
- If **no new run** appears, the push was skipped. Check `git status` to confirm you actually changed a non-ignored file (Option 1/2 bypass this entirely).

---

## Related
- [Deployment Guide](deployment.md) — how the build pipeline works
- [Scripts Reference](scripts.md) — the local tools under `scripts/` that don't ship to the site

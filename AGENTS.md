<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## i18n (Convivia)

- **Every new user-visible string** (UI, `alt`, errors, emails if localized) must get a `messages` key.
- Add the string to **`messages/en.json`** (source of truth) and provide a human translation in **`messages/it.json`** when you touch that area.
- **Also add the same keys to every other locale file** under `messages/` (`ar`, `de`, `es`, `fr`, `hi`, `ja`, `ko`, `nl`, `pl`, `pt`, `ro`, `ru`, `tr`, `uk`, `zh`): use a proper translation where you can; otherwise mirror English for that locale until a native speaker updates it. Do not leave new keys only in `en`/`it` while other JSON files ship without the key.
- Runtime merge still falls back to English for missing nested keys, but the repo rule is **explicit keys in all locale files** for anything new.

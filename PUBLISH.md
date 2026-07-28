# Publish checklist

Before pushing to `main` (GitHub Pages):

1. Start local server: `python3 -m http.server 8080`
2. Run: `node scripts/publish-audit.mjs`
3. Spot-check home, projects, and one case study on mobile width.

Ship: push `main` and confirm the **Deploy static content to Pages** workflow succeeds.

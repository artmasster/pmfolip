# Development and evidence updates

PMfolio is a static React and TypeScript application built with Vite. The site reads versioned, public evidence snapshots; it does not require application credentials or a database.

## Run locally

Use Node.js 22 LTS and npm. From the repository root:

```bash
npm ci
npm run dev
```

The development server binds to the local interface. Read its terminal output for the URL.

## Validate and build

```bash
npm run check
npm test
npm run build
npm run verify:build
npm run preview
```

The production build is generated in `dist/`. Both development and production use the `/pmfolip/` base path. Local public assets and evidence downloads must use `publicAssetPath`; external source URLs remain unchanged. Shared comparisons use query parameters on the project root, so reloading them does not need a server-side routing fallback.

## GitHub Pages deployment

The live site is **https://artmasster.github.io/pmfolip/**. In repository **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. No custom domain or additional deployment secrets are needed.

The [Pages workflow](https://github.com/artmasster/pmfolip/blob/main/.github/workflows/pages.yml) installs locked dependencies, checks TypeScript, runs tests, builds the website and verifies the generated artifact. Pull requests run the same checks without deploying. A successful push to `main` publishes the verified artifact to GitHub Pages automatically; **Actions → Check and deploy Pages → Run workflow** also supports a manual deployment of `main`.

Deployment permissions are confined to the deployment job. Actions are pinned to reviewed commit hashes. Inspect the run and its `github-pages` environment URL after publishing. To roll back a change, revert the relevant commit and push to `main` so the same checks and deployment run again.

## Update evidence

The data-fetch scripts use public research sources. Run them from the repository root with Python 3; their normal output is JSON and `--patch` emits a reviewable patch. Check the diff before updating data, and then run the validation commands above.

- [Scoring, coverage and limitations](methodology.md)
- [Historical GDP source and reproduction](historical-data.md)
- [Additional social and education data](extended-data.md)
- [Historical records and portrait attribution](leader-sources.md)

The optional portrait-fetch tool requires `requests` and `beautifulsoup4`; these are research-tool dependencies, not dependencies of the website. It preserves existing portraits and their original source attribution.

## Public repository boundaries

Keep credentials, personal environment files, certificates, database dumps, production configuration, generated builds and internal operational records outside Git. Review both new files and commit history before publishing. Images and research datasets retain their individual upstream licenses and attribution, as documented in the linked evidence records and dataset metadata; publishing this repository does not replace those licenses.

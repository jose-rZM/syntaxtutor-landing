// Single place for every external link. All URLs were checked on 2026-11-20
// against the GitHub API (release v2.0.0, published 2026-10-04).
// When a new release is published, update VERSION and the asset names.

export const VERSION = '2.0.0';

const REPO = 'https://github.com/jose-rZM/SyntaxTutor';
const DL = `${REPO}/releases/download/v${VERSION}`;

export const LINKS = {
  repo: REPO,
  releases: `${REPO}/releases/latest`,
  manualEs: `${DL}/SyntaxTutor-Manual-ES.pdf`,
  manualEn: `${DL}/SyntaxTutor-Manual-EN.pdf`,
  devDocs: 'https://jose-rzm.github.io/SyntaxTutor/',
  license: `${REPO}/blob/main/LICENSE`,
  changelog: `${REPO}/blob/main/CHANGELOG.md`,
  issues: `${REPO}/issues`,
  author: 'https://github.com/jose-rZM',
};

export const DOWNLOADS = {
  windows: {
    label: 'Windows',
    file: `SyntaxTutor-${VERSION}-windows-x64.zip`,
    size: '48 MB',
    url: `${DL}/SyntaxTutor-${VERSION}-windows-x64.zip`,
  },
  macos: {
    label: 'macOS',
    file: `SyntaxTutor-${VERSION}-macos-arm64.zip`,
    size: '32 MB',
    url: `${DL}/SyntaxTutor-${VERSION}-macos-arm64.zip`,
  },
  linux: {
    label: 'Linux',
    file: `SyntaxTutor-${VERSION}-x86_64.AppImage`,
    size: '33 MB',
    url: `${DL}/SyntaxTutor-${VERSION}-x86_64.AppImage`,
  },
};

// Analytics stays off the network. 'debug' only logs events locally
// (console and, with ?analytics=debug, an on-page panel). See
// DEPLOY.md before switching to 'umami'.
// localStorage preference read by this app before it loads Umami; set only by the opt-out button
// on privacidad.html.
export const OPT_OUT_KEY = 'umami.disabled';

export const ANALYTICS = {
  provider: 'umami', // 'debug' | 'umami' | 'none'; Umami remains OFF
  // Umami Cloud. The script is only injected when provider
  // is 'umami', both values are set and the visitor has not refused
  // measurement. Attribute names checked against Umami's tracker source
  // on 2026-11-21. Copy scriptUrl and websiteId from
  // the tracking code shown in the Umami dashboard.
  umami: {
    scriptUrl: 'https://cloud.umami.is/script.js', // URL of script.js in the tracking code
    websiteId: 'a2df6beb-f363-47c9-8236-7e87d7587c9f', // UUID of the site in Umami
    domains: 'syntaxtutor.jram.me', // production hostname only
  },
};

// Whitelist of section labels stored in Umami and their DOM section ids.
// Extra docs/faq sections are optional breakdowns, not steps in the main funnels.
export const TRACKED_SECTIONS = Object.freeze({
  fit: 'te-sirve',
  how: 'como-funciona',
  demo: 'demo',
  features: 'funciones',
  downloads: 'descargar',
  docs: 'documentacion',
  faq: 'preguntas',
});

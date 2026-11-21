// All event names and properties are explicit; no demo input is transmitted.
// 'debug' never makes network requests. 'umami' is intentionally NOT active.
import { ANALYTICS, OPT_OUT_KEY, TRACKED_SECTIONS } from './config.js';
import { initSectionTracking } from './section-tracking.js';

const SCHEMA = Object.freeze({
  page_view: [],
  section_viewed: ['section'],
  demo_started: [],
  demo_completed: ['wrong_answers'],
  download_clicked: ['os', 'detected_os', 'location'],
  download_shortcut_clicked: ['location'],
  docs_clicked: ['doc'],
  github_clicked: ['location'],
});

const EVENTS = [];
let panelList = null;
let activeProvider = 'none';
const queue = [];
let trackerLoaded = false;

export function sanitize(name, props = {}) {
  const keys = SCHEMA[name];
  if (!keys) return null;
  const result = {};
  for (const key of keys) if (Object.hasOwn(props, key)) result[key] = props[key];
  // Hard limits: no arbitrary user-controlled text or unknown section names.
  if (name === 'section_viewed' && !Object.hasOwn(TRACKED_SECTIONS, result.section)) return null;
  if (name === 'download_shortcut_clicked' && !['header','hero'].includes(result.location)) return null;
  if (name === 'demo_completed') {
    if (!Number.isSafeInteger(result.wrong_answers) || result.wrong_answers < 0) return null;
    result.wrong_answers = Math.min(result.wrong_answers, 999);
  }
  const enums = {os:['windows','macos','linux'], detected_os:['windows','macos','linux','mobile','unknown'],
    location:['downloads','header','hero','docs'], doc:['manual_es','manual_en','dev_docs']};
  for (const [key, allowed] of Object.entries(enums)) {
    if (Object.hasOwn(result,key) && !allowed.includes(result[key])) return null;
  }
  return result;
}

function toDebug(name, props) {
  const entry = { name, props, time: new Date().toISOString() };
  EVENTS.push(entry);
  console.info('[analytics]', name, props);
  if (panelList) {
    const li = document.createElement('li');
    li.textContent = `${entry.time.slice(11,19)} ${name}${Object.keys(props).length ? ' '+JSON.stringify(props) : ''}`;
    panelList.append(li);
  }
}

function toUmami(name, props) {
  // Umami automatically records pageviews: never create duplicates.
  if (name === 'page_view') return;
  if (typeof window.umami?.track === 'function') window.umami.track(name, props);
  else if (!trackerLoaded && queue.length < 50) queue.push([name, props]);
}

function measurementRefused() {
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 1 || dnt === 'yes') return true;
  try { return localStorage.getItem(OPT_OUT_KEY) !== null; }
  catch { return true; } // Fail closed if privacy preference cannot be checked.
}

function loadUmami() {
  const { scriptUrl, websiteId, domains } = ANALYTICS.umami || {};
  if (!scriptUrl || !websiteId || measurementRefused()) return false;
  // Never load the external script in local previews or unexpected hosts.
  if (domains && !domains.split(',').map(x=>x.trim()).includes(location.hostname)) return false;
  const s = document.createElement('script');
  s.async = true;
  s.src = scriptUrl;
  s.dataset.websiteId = websiteId;
  if (domains) s.dataset.domains = domains;
  s.dataset.doNotTrack = 'true';
  s.dataset.excludeSearch = 'true';
  s.dataset.excludeHash = 'true';
  s.addEventListener('load', () => {
    trackerLoaded = true;
    if (typeof window.umami?.track === 'function') {
      for (const [name, props] of queue.splice(0)) window.umami.track(name,props);
    } else queue.length = 0;
  });
  s.addEventListener('error', () => { trackerLoaded = true; queue.length = 0; });
  document.head.append(s);
  return true;
}

export function track(name, props = {}) {
  const clean = sanitize(name, props);
  if (clean === null) return;
  if (activeProvider === 'debug') toDebug(name, clean);
  else if (activeProvider === 'umami') toUmami(name, clean);
}

export function initAnalytics() {
  window.__stEvents = EVENTS; // In-memory only, for manual debug checks.
  const params = new URLSearchParams(location.search);
  activeProvider = ANALYTICS.provider;
  if (activeProvider === 'debug' && params.get('analytics') !== 'debug') activeProvider = 'none';
  if (activeProvider === 'umami' && !loadUmami()) activeProvider = 'none';
  if (activeProvider === 'debug') {
    const panel = document.querySelector('[data-analytics-debug]');
    if (panel) {
      panel.hidden = false;
      panelList = panel.querySelector('[data-analytics-list]');
    }
  }

  // Link clicks are recorded without intercepting navigation.
  document.addEventListener('click', (event) => {
    const el = event.target.closest?.('[data-track]');
    if (!el) return;
    const { track: name, ...rest } = el.dataset;
    const props = {};
    if (rest.osTarget) props.os = rest.osTarget;
    if (rest.location) props.location = rest.location;
    if (rest.doc) props.doc = rest.doc;
    if (name === 'download_clicked') {
      props.detected_os = document.documentElement.dataset.os || 'unknown';
      props.location = 'downloads';
    }
    track(name, props);
  });
  track('page_view');
  if (activeProvider !== 'none') initSectionTracking(track);
}

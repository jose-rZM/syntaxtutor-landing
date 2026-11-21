// Section reach, NOT reading depth or comprehension.
// A section qualifies after 1 continuous second with >= 60% of its height
// visible, or >= 50% of viewport height for sections taller than viewport.
// Report at most once per section per page load.
import { TRACKED_SECTIONS } from './config.js';

export const SECTION_DWELL_MS = 1000;

export function initSectionTracking(track, doc = document, Observer = globalThis.IntersectionObserver,
  clock = { setTimeout, clearTimeout }, viewportHeight = () => window.innerHeight) {
  if (typeof Observer !== 'function') return null;

  const waiting = new Map(); // Element -> semantic label
  const timers = new Map();
  const inView = new Set();
  for (const [name, id] of Object.entries(TRACKED_SECTIONS)) {
    const section = doc.getElementById(id);
    if (section) waiting.set(section, name);
  }
  if (!waiting.size) return null;

  function cancel(el) {
    if (timers.has(el)) clock.clearTimeout(timers.get(el));
    timers.delete(el);
    inView.delete(el);
  }

  const observer = new Observer((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      if (!waiting.has(el)) continue;
      const visibleHeight = entry.intersectionRect?.height ?? 0;
      const fullHeight = entry.boundingClientRect?.height ?? 0;
      const screenHeight = entry.rootBounds?.height ?? viewportHeight();
      const needed = Math.min(fullHeight * 0.6, screenHeight * 0.5);
      const qualifies = doc.visibilityState !== 'hidden' &&
        entry.isIntersecting && needed > 0 && visibleHeight >= needed;
      if (!qualifies) {
        cancel(el);
        continue;
      }
      inView.add(el);
      if (timers.has(el)) continue;
      timers.set(el, clock.setTimeout(() => {
        timers.delete(el);
        if (!inView.has(el) || doc.visibilityState === 'hidden' || !waiting.has(el)) return;
        const name = waiting.get(el);
        waiting.delete(el);
        inView.delete(el);
        observer.unobserve(el);
        track('section_viewed', { section: name });
        if (!waiting.size) observer.disconnect();
      }, SECTION_DWELL_MS));
    }
  }, {
    // Smooth scrolling and long sections may reach the visible-height rule
    // at low intersection ratios; 0.01 increments avoid missing crossings.
    threshold: Array.from({ length: 101 }, (_, i) => i / 100),
  });

  doc.addEventListener?.('visibilitychange', () => {
    if (doc.visibilityState === 'hidden') {
      for (const el of [...timers.keys()]) cancel(el);
    } else {
      // Reobserve so a stationary section can start a new dwell interval.
      for (const el of waiting.keys()) {
        observer.unobserve(el);
        observer.observe(el);
      }
    }
  });
  for (const section of waiting.keys()) observer.observe(section);
  return observer;
}

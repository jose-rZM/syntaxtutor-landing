import assert from 'node:assert/strict';
import { TRACKED_SECTIONS } from '../src/config.js';
import { initSectionTracking } from '../src/section-tracking.js';
import { sanitize } from '../src/analytics.js';

const nodes = Object.fromEntries(Object.values(TRACKED_SECTIONS).map(id => [id, { id }]));
const listeners = {};
const doc = {
  visibilityState: 'visible',
  getElementById(id) { return nodes[id]; },
  addEventListener(name, cb) { listeners[name] = cb; },
};
let currentObserver;
class Observer {
  constructor(callback, options) {
    this.cb = callback;
    this.options = options;
    this.active = new Set();
    this.disconnected = false;
    currentObserver = this;
  }
  observe(el) { this.active.add(el); }
  unobserve(el) { this.active.delete(el); }
  disconnect() { this.disconnected = true; this.active.clear(); }
  emit(id, height) {
    const el = nodes[id];
    this.cb([{
      target: el, isIntersecting: height > 0,
      intersectionRect: { height }, boundingClientRect: { height: 1000 },
      rootBounds: { height: 800 },
    }]);
  }
}
let next = 0;
const timers = new Map();
const clock = {
  setTimeout(fn, ms) { assert.equal(ms, 1000); const id = ++next; timers.set(id, fn); return id; },
  clearTimeout(id) { timers.delete(id); },
  advance() { for (const [id, fn] of [...timers.entries()]) { timers.delete(id); fn(); } },
};
const events=[];
initSectionTracking((name, props) => events.push({name, props}), doc, Observer, clock, () => 800);
assert.equal(currentObserver.active.size, 7);
currentObserver.emit('demo', 350); // less than half viewport; not reached
clock.advance();
assert.deepEqual(events, []);
currentObserver.emit('demo', 500); // viewport threshold met; dwell begins
currentObserver.emit('demo', 100); // leaving view cancels the dwell
clock.advance();
assert.deepEqual(events, []);
currentObserver.emit('demo', 500);
clock.advance();
assert.deepEqual(events, [{ name:'section_viewed', props: {section:'demo'} }]);
currentObserver.emit('demo', 500);
clock.advance();
assert.equal(events.length, 1, 'at most once per load');
currentObserver.emit('descargar', 500);
doc.visibilityState='hidden'; listeners.visibilitychange();
clock.advance();
assert.equal(events.length, 1, 'hidden tabs cannot complete visibility');
doc.visibilityState='visible'; listeners.visibilitychange();
currentObserver.emit('descargar', 500);
clock.advance();
assert.equal(events[1].props.section, 'downloads');
assert.equal(sanitize('section_viewed',{section:'nope'}), null);
assert.deepEqual(sanitize('section_viewed',{section:'fit',private_response:'sensitive'}),{section:'fit'});
assert.deepEqual(sanitize('download_shortcut_clicked',{location:'hero'}), {location:'hero'});
assert.equal(sanitize('download_shortcut_clicked',{location:'unknown'}),null);
assert.equal(sanitize('demo_completed',{wrong_answers:'bad'}),null);
assert.deepEqual(sanitize('demo_completed',{wrong_answers:4,typed:'secret'}),{wrong_answers:4});
console.log('ok - section visibility and property whitelist (once, dwell, hidden tabs, sanitization)');

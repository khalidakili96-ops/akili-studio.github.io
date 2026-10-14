const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'application.html'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
const application = fs.readFileSync(path.join(root, 'application.js'), 'utf8');
const consentKey = 'akili.analytics-consent.v1';
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture(t, options = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: options.url || 'https://akilis.studio/application.html?email=private%40example.test#private', referrer: 'https://www.google.com/search?q=private' });
  const w = dom.window;
  t.after(() => w.close());
  w.HTMLElement.prototype.scrollIntoView = function () {};
  if (options.saved) w.localStorage.setItem(consentKey, JSON.stringify(options.saved));
  if (options.storageBlocked) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
  const calls = [];
  w.fetch = options.noFetch ? undefined : function (url, request) {
    calls.push({ url, request });
    return options.fetch ? options.fetch(url, request) : Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
  };
  if (!options.noAnalytics) {
    w.eval(analytics);
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  }
  w.eval(application);
  const form = w.document.querySelector('.application-form');
  const fill = () => {
    const values = { 'full-name': 'Synthetic Test', 'phone-whatsapp': '+201000000000', 'email-address': 'private@example.test', 'project-location': 'Synthetic city', 'project-type': 'Residential', 'project-stage': 'Early planning', 'approximate-area': '250 m²', 'service-required': 'Interior Design', 'target-start': 'Still exploring', 'project-description': 'Synthetic private project description', 'preferred-contact-method': 'Email' };
    Object.entries(values).forEach(([id, value]) => { w.document.getElementById(id).value = value; });
    w.document.getElementById('consent').checked = true;
  };
  const submit = () => { const event = new w.Event('submit', { bubbles: true, cancelable: true }); form.dispatchEvent(event); return event; };
  const choose = c => w.document.querySelector('[data-choice="' + c + '"]').click();
  const events = () => (w.dataLayer || []).map(x => Array.from(x));
  const leads = () => events().filter(x => x[0] === 'event' && x[1] === 'generate_lead');
  return { w, form, calls, fill, submit, choose, events, leads };
}
test('no consent or declined consent loads no Google library and sends no event', t => {
  const f = fixture(t);
  assert.equal(f.w.document.querySelectorAll('script[src*="googletagmanager"]').length, 0);
  assert.equal(f.events().length, 0);
  f.choose('decline');
  f.w.AkiliAnalytics.trackAcceptedEnquiry();
  assert.equal(f.events().length, 0);
  assert.equal(JSON.parse(f.w.localStorage.getItem(consentKey)).choice, 'decline');
});
test('opt-in loads once and strips query, fragment and referrer path from analytics', t => {
  const f = fixture(t);
  f.choose('allow'); f.choose('allow');
  assert.equal(f.w.document.querySelectorAll('script[src*="googletagmanager"]').length, 1);
  const views = f.events().filter(x => x[1] === 'page_view');
  assert.equal(views.length, 1);
  assert.equal(views[0][2].page_location, 'https://akilis.studio/application.html');
  assert.equal(views[0][2].page_referrer, 'https://www.google.com');
  assert.ok(!JSON.stringify(f.events()).includes('private'));
});
test('stored valid opt-in is honoured; an expired preference is not', t => {
  const allowed = fixture(t, { saved: { choice: 'allow', expires: Date.now() + 10000 } });
  assert.equal(allowed.w.document.querySelectorAll('script[src*="googletagmanager"]').length, 1);
  const expired = fixture(t, { saved: { choice: 'allow', expires: Date.now() - 1 } });
  assert.equal(expired.events().length, 0);
  assert.equal(expired.w.document.querySelector('.analytics-notice').hidden, false);
});
test('storage restrictions leave consent choices and enquiry submission usable', async t => {
  const f = fixture(t, { storageBlocked: true });
  f.choose('allow'); f.fill(); f.submit(); await flush();
  assert.equal(f.calls.length, 1);
  assert.equal(f.leads().length, 1);
});
test('withdrawing consent disables further events and removes accessible GA cookies', t => {
  const f = fixture(t); f.choose('allow');
  f.w.document.cookie = '_ga=test; Path=/; Secure';
  f.w.document.cookie = '_ga_6GSBP5QVWV=test; Path=/; Secure';
  const count = f.events().length;
  f.choose('decline'); f.w.AkiliAnalytics.trackAcceptedEnquiry();
  assert.equal(f.w['ga-disable-G-6GSBP5QVWV'], true);
  assert.equal(f.events().length, count);
  assert.ok(!f.w.document.cookie.includes('_ga'));
});
test('one confirmed accepted enquiry creates one lead without form entries', async t => {
  const f = fixture(t); f.choose('allow'); f.fill(); f.submit(); await flush();
  f.submit(); f.w.AkiliAnalytics.trackAcceptedEnquiry();
  assert.equal(f.calls.length, 1);
  assert.equal(f.leads().length, 1);
  assert.equal(f.form.classList.contains('is-complete'), true);
  assert.equal(f.calls[0].url, 'https://formsubmit.co/ajax/akilis.studios@gmail.com');
  assert.ok(f.calls[0].request.body.includes('private@example.test'));
  assert.ok(!JSON.stringify(f.events()).includes('private@example.test'));
  assert.ok(!JSON.stringify(f.events()).includes('Synthetic'));
  assert.equal(JSON.parse(f.calls[0].request.body)._next, undefined);
});
test('successful enquiry remains functional when analytics is declined or absent', async t => {
  for (const options of [{}, { noAnalytics: true }]) {
    const f = fixture(t, options); if (!options.noAnalytics) f.choose('decline');
    f.fill(); f.submit(); await flush();
    assert.equal(f.form.classList.contains('is-complete'), true);
    assert.equal(f.leads().length, 0);
  }
});
test('pending submissions prevent double clicks from posting twice', async t => {
  let resolve;
  const f = fixture(t, { fetch: () => new Promise(r => { resolve = r; }) });
  f.choose('allow'); f.fill(); f.submit(); f.submit();
  assert.equal(f.calls.length, 1);
  assert.equal(f.form.querySelector('button[type="submit"]').disabled, true);
  resolve({ ok: true, json: () => Promise.resolve({ success: 'true' }) }); await flush();
  assert.equal(f.leads().length, 1);
});
for (const [name, fetch] of [
  ['service rejection', () => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: false }) })],
  ['HTTP failure', () => Promise.resolve({ ok: false })],
  ['non-JSON response', () => Promise.resolve({ ok: true, json: () => Promise.reject(new Error('HTML')) })],
  ['network failure', () => Promise.reject(new Error('offline'))]
]) test(name + ' retains entries, re-enables submission and creates no lead', async t => {
  const f = fixture(t, { fetch }); f.choose('allow'); f.fill(); f.submit(); await flush();
  assert.equal(f.leads().length, 0);
  assert.equal(f.form.classList.contains('is-complete'), false);
  assert.equal(f.w.document.getElementById('email-address').value, 'private@example.test');
  assert.equal(f.form.querySelector('button[type="submit"]').disabled, false);
  assert.equal(f.form.querySelector('[role="alert"]').hidden, false);
});
test('invalid fields and honeypot entries create no submission or lead', t => {
  const f = fixture(t); f.choose('allow'); f.submit();
  assert.equal(f.calls.length, 0); assert.equal(f.leads().length, 0);
  assert.equal(f.w.document.getElementById('full-name').getAttribute('aria-invalid'), 'true');
  f.fill(); f.form.querySelector('[name="_honey"]').value = 'bot'; f.submit();
  assert.equal(f.calls.length, 0);
});
test('a forged legacy return URL is never counted as a lead', t => {
  const f = fixture(t, { url: 'https://akilis.studio/application.html?submitted=true', saved: { choice: 'allow', expires: Date.now() + 10000 } });
  assert.equal(f.leads().length, 0);
});
test('native POST fallback is preserved without Fetch', t => {
  const f = fixture(t, { noFetch: true }); f.fill();
  assert.equal(f.submit().defaultPrevented, false);
  assert.equal(f.form.action, 'https://formsubmit.co/akilis.studios@gmail.com');
  assert.equal(f.form.method, 'post');
});
test('preview hosts cannot send production Analytics events', t => {
  const f = fixture(t, { url: 'http://127.0.0.1:8765/application.html' });
  assert.equal(f.w.AkiliAnalytics, undefined);
  assert.equal(f.events().length, 0);
});

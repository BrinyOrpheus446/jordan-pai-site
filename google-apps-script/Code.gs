/**
 * Backend for the sign-up form and consent-gated visit counts.
 * Bound to the Google Sheet it writes to (Extensions > Apps Script from inside the Sheet).
 * Deploy: Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 */
const NOTIFY = 'whypaiofficial@gmail.com';
const PATHS = ['medical', 'sponsor', 'user', 'other'];

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (_) { return out({ ok: false, error: 'bad_request' }); }
  if (d.type === 'signup') return signup(d);
  if (d.type === 'event') return event(d);
  return out({ ok: false, error: 'bad_request' });
}

function signup(d) {
  // Bots fill the hidden field: report success, store nothing.
  if (d.website) return out({ ok: true });
  const email = clean(d.email, 200).toLowerCase();
  const name = clean(d.name, 120);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return out({ ok: false, error: 'invalid' });
  if (d.consent !== true) return out({ ok: false, error: 'no_consent' });
  // Rate limits: one sign-up per email per 10 minutes, 60 sign-ups per hour overall.
  const cache = CacheService.getScriptCache();
  if (cache.get('e:' + email)) return out({ ok: false, error: 'rate_limited' });
  const n = Number(cache.get('hour') || 0);
  if (n >= 60) return out({ ok: false, error: 'rate_limited' });
  const path = PATHS.indexOf(d.path) >= 0 ? d.path : 'other';
  const row = [new Date(), path, name, email, clean(d.org, 160), clean(d.note, 1000), 'yes'];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { sheet('Signups', ['Received', 'Wants to', 'Name', 'Email', 'Role or organization', 'Note', 'Consent']).appendRow(row); }
  finally { lock.releaseLock(); }
  cache.put('e:' + email, '1', 600);
  cache.put('hour', String(n + 1), 3600);
  MailApp.sendEmail(NOTIFY, 'New sign-up: ' + path + ' from ' + name,
    'Wants to: ' + path + '\nName: ' + name + '\nEmail: ' + email + '\nRole/org: ' + row[4] + '\nNote: ' + row[5]);
  return out({ ok: true });
}

function event(d) {
  const ev = clean(d.event, 40);
  if (!/^(visit|pick:(medical|sponsor|user|other))$/.test(ev)) return out({ ok: false, error: 'bad_event' });
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('ev') || 0);
  if (n >= 2000) return out({ ok: false, error: 'rate_limited' });
  cache.put('ev', String(n + 1), 3600);
  sheet('Analytics', ['Time', 'Visitor', 'Event', 'Page']).appendRow([new Date(), clean(d.visitor, 64), ev, clean(d.page, 40)]);
  return out({ ok: true });
}

// Trim, cap length, and stop spreadsheet formula injection (=, +, -, @ at the start).
function clean(v, max) {
  v = String(v == null ? '' : v).trim().slice(0, max);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function sheet(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

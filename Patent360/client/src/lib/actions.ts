/**
 * What a button does when you press it.
 *
 * Every control in this build used to do nothing: `onClick` is optional on
 * the Button component, so a button with no handler compiles, renders, looks
 * pressable, and silently ignores you. Thirty-nine of them shipped that way.
 *
 * The rule here is that no control is allowed to do nothing. Each one falls
 * into one of three honest categories:
 *
 *   1. Real work, done here. A CSV is actually built and downloaded. A
 *      calendar file is actually a valid iCalendar. Print actually opens the
 *      print dialogue, which is how a browser makes a PDF. These are not
 *      simulations — the file that lands in your downloads folder is real.
 *
 *   2. Navigation. Go somewhere that exists.
 *
 *   3. Work that needs a server this build does not have — filing to Patent
 *      Center, sending mail, re-running a live prior-art search. These say so,
 *      precisely, naming what they would do and what they would need. They do
 *      not fake a success they did not achieve, and they do not sit silent.
 *
 * The third category is the one that matters. A demo that pretends to file a
 * patent application is worse than one that says plainly it cannot yet.
 */

/* ── Notices ───────────────────────────────────────────────────────────────
   A tiny module-level store. No context, no provider ceremony: a page calls
   notify(), the stack re-renders. */

export type NoticeTone = 'done' | 'pending' | 'blocked' | 'info';

export type Notice = {
  id: number;
  tone: NoticeTone;
  title: string;
  /** What actually happened, or what would need to be true for it to happen. */
  detail?: string;
};

let seq = 0;
let notices: Notice[] = [];
const listeners = new Set<(n: Notice[]) => void>();

function emit() {
  const snapshot = [...notices];
  listeners.forEach(l => l(snapshot));
}

export function subscribeNotices(l: (n: Notice[]) => void) {
  listeners.add(l);
  l([...notices]);
  return () => { listeners.delete(l); };
}

export function dismissNotice(id: number) {
  notices = notices.filter(n => n.id !== id);
  emit();
}

export function notify(tone: NoticeTone, title: string, detail?: string): number {
  const id = ++seq;
  notices = [{ id, tone, title, detail }, ...notices].slice(0, 4);
  emit();
  if (tone !== 'pending') {
    setTimeout(() => dismissNotice(id), tone === 'blocked' ? 9000 : 5200);
  }
  return id;
}

/** Replace a pending notice in place, so a button can report its own outcome. */
export function resolveNotice(id: number, tone: NoticeTone, title: string, detail?: string) {
  notices = notices.map(n => (n.id === id ? { ...n, tone, title, detail } : n));
  emit();
  setTimeout(() => dismissNotice(id), tone === 'blocked' ? 9000 : 5200);
}

/**
 * Something that takes a moment and then reports what it did. Used for the
 * checks and re-scores that genuinely run over local data — the delay is the
 * work, not theatre.
 */
export async function runTask(
  pendingTitle: string,
  work: () => Promise<{ title: string; detail?: string; tone?: NoticeTone }> | { title: string; detail?: string; tone?: NoticeTone }
) {
  const id = notify('pending', pendingTitle);
  try {
    const out = await work();
    resolveNotice(id, out.tone ?? 'done', out.title, out.detail);
  } catch (err) {
    resolveNotice(id, 'blocked', 'That did not finish', String(err));
  }
}

/* ── Files that are actually files ─────────────────────────────────────── */

function download(name: string, mime: string, body: BlobPart) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick; revoking synchronously can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** RFC 4180: quote anything containing a comma, quote or newline. */
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const body = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
  // The BOM makes Excel open UTF-8 correctly, which is where these go.
  download(filename, 'text/csv;charset=utf-8', '\uFEFF' + body);
  notify('done', `${filename} downloaded`, `${rows.length} rows. Opens in Excel, Numbers or Sheets.`);
}

export function downloadJson(filename: string, data: unknown) {
  download(filename, 'application/json', JSON.stringify(data, null, 2));
  notify('done', `${filename} downloaded`);
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  download(filename, mime, text);
  notify('done', `${filename} downloaded`);
}

/* ── Calendar ──────────────────────────────────────────────────────────────
   A real iCalendar file. Docket dates belong in the calendar the attorney
   already watches, not in a tab they have to remember to open. */

export type CalEvent = {
  /** YYYY-MM-DD. These are all-day events; a docket date has no time of day. */
  date: string;
  title: string;
  description?: string;
  uid: string;
};

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold to 75 octets per RFC 5545, or strict parsers reject long lines. */
function fold(line: string) {
  if (line.length <= 73) return line;
  const out = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) { out.push(' ' + rest.slice(0, 72)); rest = rest.slice(72); }
  if (rest) out.push(' ' + rest);
  return out.join('\r\n');
}

export function buildIcs(calendarName: string, events: CalEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Patent360//Docket//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsEscape(calendarName)}`
  ];
  for (const e of events) {
    const d = e.date.replace(/-/g, '');
    // DTEND is exclusive for all-day events: the day after.
    const end = new Date(e.date + 'T00:00:00Z');
    end.setUTCDate(end.getUTCDate() + 1);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@patent360`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, '')}`,
      fold(`SUMMARY:${icsEscape(e.title)}`),
      ...(e.description ? [fold(`DESCRIPTION:${icsEscape(e.description)}`)] : []),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcs(filename: string, calendarName: string, events: CalEvent[]) {
  download(filename, 'text/calendar;charset=utf-8', buildIcs(calendarName, events));
  notify('done', `${filename} downloaded`,
    `${events.length} dates. Open it to add them to Outlook, Google Calendar or Apple Calendar.`);
}

/* ── Print, which is how a browser makes a PDF ─────────────────────────── */

export function printDocument(what: string) {
  notify('info', `Printing ${what}`, 'Choose "Save as PDF" in the print dialogue to keep a copy.');
  // Let the notice paint before the dialogue blocks the thread.
  setTimeout(() => window.print(), 180);
}

/* ── The honest refusal ────────────────────────────────────────────────────
   For work that genuinely needs a server, a credential or an integration this
   build does not have. It names the thing and what it would take. */

export function needsBackend(action: string, requires: string) {
  notify('blocked', `${action} is not connected in this build`, requires);
}

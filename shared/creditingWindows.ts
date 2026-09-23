/**
 * Named windows for the crediting exhibit — the Time Machine method applied to
 * the index strategy itself.
 *
 * ## Why this is not just a start-year box
 *
 * A start year is already selectable on /api/partner/crediting, so a named
 * list adds nothing mechanically. What it adds is the second panel.
 *
 * Any window can be made to look good by choosing where it begins. "Since
 * Covid" starts at the bottom of a crash and runs through one of the strongest
 * recoveries on record; it is a true figure about a real period and a
 * thoroughly misleading answer to "what does this policy credit". The same
 * trick works in reverse — start in 1929 and the first four years are a
 * catastrophe.
 *
 * So this follows the Time Machine's rule: never one panel. Every selected
 * window is returned beside the full held history, and beside the count of
 * years behind each. A reader who is shown 12% since 2020 is shown 4.95%
 * since 1929 in the same breath, with the number of years under both. That is
 * what makes a short window informative instead of persuasive, and it is the
 * same discipline AG 49 imposes when it requires the historical disclosure to
 * sit beside the illustration rather than in a later section.
 *
 * ## On the windows chosen
 *
 * Each begins at a moment a reader recognises, not at a year that flatters the
 * number. Two of them deliberately begin at market peaks — 2000 and 2007 —
 * because a client who bought at the top is the client with the real question,
 * and a menu with only rising windows on it is a sales tool.
 */

import { IBBOTSON_END_YEAR, IBBOTSON_START_YEAR } from './ibbotsonModel';

export interface CreditingWindow {
  readonly id: string;
  readonly label: string;
  /** What this period was, in a sentence a client would recognise. */
  readonly description: string;
  /** Resolved against the held series; null start means "everything held". */
  readonly fromYear: number;
  readonly toYear: number;
  /**
   * True where the window begins at or near a market top. Flagged because a
   * window that starts at a peak answers a different question from one that
   * starts at a bottom, and the reader deserves to know which they are seeing.
   */
  readonly startsAtPeak?: boolean;
}

const END = IBBOTSON_END_YEAR;

export const CREDITING_WINDOWS: readonly CreditingWindow[] = [
  {
    id: 'full',
    label: `Everything held (${IBBOTSON_START_YEAR}–${END})`,
    description:
      'The whole series this system holds, crash years included. The longest answer available and the hardest to argue with.',
    fromYear: IBBOTSON_START_YEAR,
    toYear: END,
  },
  {
    id: 'ag49',
    label: `The AG 49-A lookback (${END - 24}–${END})`,
    description:
      'Twenty-five years, the period the 2025 amendment to Actuarial Guideline 49-A uses when setting the maximum rate a policy may be illustrated at.',
    fromYear: END - 24,
    toYear: END,
  },
  {
    id: 'thirty',
    label: `The last thirty years (${END - 29}–${END})`,
    description: 'A working lifetime of saving, covering the dot-com unwind, the financial crisis, the pandemic and the rate shock.',
    fromYear: END - 29,
    toYear: END,
  },
  {
    id: 'dotcom',
    label: `Since the dot-com peak (2000–${END})`,
    description:
      // Damodaran histretSP (read 2026-09-23): S&P 500 -9.03% (2000), -11.85% (2001), -21.97% (2002); 1939-41 was the previous three-year run.
      'Beginning at the top of the market in 2000, the first of three consecutive losing years — the first such run since 1939–41.',
    fromYear: 2000,
    toYear: END,
    startsAtPeak: true,
  },
  {
    id: 'crisis',
    label: `Since the financial crisis peak (2007–${END})`,
    // Damodaran histretSP (read 2026-09-23): S&P 500 -36.55% in 2008 with dividends; RAW_INDEX_RETURNS -38.3% on price.
    description: 'Beginning the year before credit markets seized and equities lost more than a third of their value.',
    fromYear: 2007,
    toYear: END,
    startsAtPeak: true,
  },
  {
    id: 'covid',
    label: `Since Covid (2020–${END})`,
    description:
      'The pandemic crash and the recovery that followed it. The shortest window offered and the most flattering; read it beside the full history, not instead of it.',
    fromYear: 2020,
    toYear: END,
  },
];

export function windowById(id: string): CreditingWindow | undefined {
  return CREDITING_WINDOWS.find((w) => w.id === id.toLowerCase());
}

/** The window every other one is reported against. */
export function fullWindow(): CreditingWindow {
  return CREDITING_WINDOWS[0]!;
}

/**
 * Demonstration data for the design build.
 *
 * Every name, number and application here is invented for the mock-up. None of
 * it describes a real firm, a real client, or a real filing, and none of it is a
 * claim about what the product has achieved.
 */
import type { Status } from '../components/ui';

export type Matter = {
  docket: string;
  appNo: string;
  title: string;
  client: string;
  status: Status;
  attorney: string;
  cpc: string;
  next: string;
  days: number;
};

export const MATTERS: Matter[] = [
  { docket: 'BL-2291-US', appNo: '18/412,907', title: 'Thermal management for stacked battery modules', client: 'Nordhaven Energy', status: 'office-action', attorney: 'A. Reyes', cpc: 'H01M 10/653', next: 'Response to non-final', days: 11 },
  { docket: 'BL-2287-US', appNo: '18/398,114', title: 'Adaptive irrigation valve with soil telemetry', client: 'Cedar Ridge Ag', status: 'filed', attorney: 'M. Okafor', cpc: 'A01G 25/16', next: 'Await first action', days: 128 },
  { docket: 'BL-2304-US', appNo: '—', title: 'Low-latency mesh relay for field sensors', client: 'Halden Instruments', status: 'drafting', attorney: 'A. Reyes', cpc: 'H04W 40/22', next: 'Claims review', days: 4 },
  { docket: 'BL-2110-US', appNo: '17/884,562', title: 'Gear train with compliant tooth profile', client: 'Wexler Dynamics', status: 'granted', attorney: 'J. Santos', cpc: 'F16H 55/08', next: 'Issue fee paid', days: 0 },
  { docket: 'BL-2298-US', appNo: '18/405,330', title: 'Cold-chain label with irreversible indicator', client: 'Meridian Logistics', status: 'review', attorney: 'M. Okafor', cpc: 'G01K 11/12', next: 'Partner sign-off', days: 2 },
  { docket: 'BL-2255-US', appNo: '18/201,776', title: 'Acoustic leak localisation in buried mains', client: 'Ashford Water', status: 'office-action', attorney: 'J. Santos', cpc: 'G01M 3/24', next: 'Examiner interview', days: 6 },
  { docket: 'BL-2031-US', appNo: '17/702,918', title: 'Photovoltaic mount with wind-load release', client: 'Nordhaven Energy', status: 'abandoned', attorney: 'A. Reyes', cpc: 'H02S 30/10', next: 'Closed at client request', days: 0 },
  { docket: 'BL-2312-US', appNo: '—', title: 'Enzymatic assay cartridge with dry reagent', client: 'Palewood Bio', status: 'drafting', attorney: 'M. Okafor', cpc: 'C12Q 1/00', next: 'Figures due', days: 9 }
];

export type Deadline = {
  date: string; days: number; docket: string; what: string; who: string; statutory: boolean;
};

export const DEADLINES: Deadline[] = [
  { date: '2026-09-15', days: 4, docket: 'BL-2304-US', what: 'Inventor claim review returned', who: 'A. Reyes', statutory: false },
  { date: '2026-09-17', days: 6, docket: 'BL-2255-US', what: 'Examiner interview scheduled', who: 'J. Santos', statutory: false },
  { date: '2026-09-22', days: 11, docket: 'BL-2291-US', what: 'Response to non-final office action', who: 'A. Reyes', statutory: true },
  { date: '2026-09-30', days: 19, docket: 'BL-2312-US', what: 'Formal drawings to draftsman', who: 'M. Okafor', statutory: false },
  { date: '2026-10-08', days: 27, docket: 'BL-2287-US', what: 'Information disclosure statement', who: 'M. Okafor', statutory: true },
  { date: '2026-11-02', days: 52, docket: 'BL-2298-US', what: 'PCT national phase entry', who: 'J. Santos', statutory: true }
];

export const DATASETS = [
  { name: 'USPTO Patent Examination Data', code: 'PEDS', rows: '14.2 M', refreshed: 'Daily 04:00 UTC', use: 'Live status, transaction history and continuity for every pending application.' },
  { name: 'Full-Text Grants and Applications', code: 'BULK-FT', rows: '9.8 M', refreshed: 'Weekly, Tuesday', use: 'Prior-art text search over claims, abstracts and specifications.' },
  { name: 'Cooperative Patent Classification', code: 'CPC', rows: '262 K', refreshed: 'Quarterly', use: 'Class and subclass lookup, and neighbourhood search for a draft claim set.' },
  { name: 'Patent Assignment Search', code: 'ASSIGN', rows: '9.1 M', refreshed: 'Weekly', use: 'Ownership chain and recorded assignment history.' },
  { name: 'Patent Trial and Appeal Board', code: 'PTAB', rows: '112 K', refreshed: 'Daily', use: 'Appeal and trial outcomes for the art units a matter sits in.' },
  { name: 'Fee Schedule', code: 'FEES', rows: '480', refreshed: 'On change', use: 'Entity-size fee calculation at filing, issue and maintenance.' }
];

export const TEAM = [
  { name: 'Alex Reyes', email: 'a.reyes@brandtlockwood.com', role: 'Attorney', seat: 'Partner', mfa: true, last: '2 minutes ago', matters: 14 },
  { name: 'Marta Okafor', email: 'm.okafor@brandtlockwood.com', role: 'Attorney', seat: 'Associate', mfa: true, last: '1 hour ago', matters: 19 },
  { name: 'Jonah Santos', email: 'j.santos@brandtlockwood.com', role: 'Attorney', seat: 'Associate', mfa: true, last: 'Yesterday', matters: 9 },
  { name: 'Priya Raman', email: 'p.raman@brandtlockwood.com', role: 'Paralegal', seat: 'Docketing', mfa: true, last: '18 minutes ago', matters: 42 },
  { name: 'Devin Cole', email: 'd.cole@brandtlockwood.com', role: 'Paralegal', seat: 'Drafting support', mfa: false, last: '3 days ago', matters: 11 },
  { name: 'Nordhaven Energy', email: 'ip@nordhaven.example', role: 'Client', seat: 'External', mfa: true, last: '4 hours ago', matters: 6 }
];

export const AUDIT = [
  { t: '14:02:11', who: 'A. Reyes', act: 'Filed response', obj: 'BL-2291-US', ip: '198.51.100.24' },
  { t: '13:47:55', who: 'P. Raman', act: 'Docketed deadline', obj: 'BL-2287-US', ip: '198.51.100.31' },
  { t: '13:12:08', who: 'ip@nordhaven', act: 'Downloaded document', obj: 'BL-2291-US / OA-1', ip: '203.0.113.9' },
  { t: '11:58:42', who: 'M. Okafor', act: 'Added prior-art reference', obj: 'BL-2312-US', ip: '198.51.100.18' },
  { t: '09:31:20', who: 'D. Cole', act: 'Access denied — team settings', obj: '/app/team', ip: '198.51.100.55' }
];

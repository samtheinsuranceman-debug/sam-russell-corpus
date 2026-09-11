/**
 * The application map.
 *
 * `minRole` is the lowest role that may see a section. Roles are ordered:
 * client < paralegal < attorney < admin. The sidebar filters on it and the
 * route guard enforces it, so a link a role cannot use is never rendered.
 */
export type Role = 'client' | 'paralegal' | 'attorney' | 'admin';

export const ROLE_ORDER: Role[] = ['client', 'paralegal', 'attorney', 'admin'];

export const ROLE_LABEL: Record<Role, string> = {
  client: 'Client',
  paralegal: 'Paralegal',
  attorney: 'Attorney',
  admin: 'Administrator'
};

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

export type NavItem = {
  path: string;
  label: string;
  icon: string;
  minRole: Role;
  /** Shown as a count chip on the sidebar item. */
  badge?: number;
};

export type NavGroup = { group: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    group: 'The file',
    items: [
      { path: '/app', label: 'Dashboard', icon: 'grid', minRole: 'client' },
      { path: '/app/matters', label: 'Matters', icon: 'folder', minRole: 'client', badge: 42 },
      { path: '/app/intake', label: 'Intake', icon: 'inbox', minRole: 'client', badge: 6 },
      { path: '/app/clients', label: 'Clients', icon: 'users', minRole: 'paralegal' }
    ]
  },
  {
    group: 'Prosecution',
    items: [
      { path: '/app/drafting', label: 'Drafting', icon: 'pen', minRole: 'paralegal' },
      { path: '/app/prior-art', label: 'Prior art', icon: 'search', minRole: 'paralegal' },
      { path: '/app/office-actions', label: 'Office actions', icon: 'alert', minRole: 'paralegal', badge: 9 },
      { path: '/app/filings', label: 'Filings', icon: 'send', minRole: 'attorney' },
      { path: '/app/deadlines', label: 'Deadlines', icon: 'clock', minRole: 'client', badge: 14 }
    ]
  },
  {
    group: 'Revenue',
    items: [
      { path: '/app/targets', label: 'Targets', icon: 'search', minRole: 'attorney', badge: 100 },
      { path: '/app/boardroom', label: 'Board index', icon: 'users', minRole: 'attorney' },
      { path: '/app/client-report', label: 'Client reports', icon: 'send', minRole: 'paralegal' }
    ]
  },
  {
    group: 'Evidence',
    items: [
      { path: '/app/reports', label: 'Reports', icon: 'chart', minRole: 'client' },
      { path: '/app/datasets', label: 'Datasets', icon: 'database', minRole: 'paralegal' },
      { path: '/app/audit', label: 'Audit log', icon: 'shield', minRole: 'attorney' }
    ]
  },
  {
    group: 'Administration',
    items: [
      { path: '/app/team', label: 'Team & access', icon: 'key', minRole: 'admin' },
      { path: '/app/integrations', label: 'Integrations', icon: 'plug', minRole: 'admin' },
      { path: '/app/settings', label: 'Settings', icon: 'cog', minRole: 'attorney' }
    ]
  }
];

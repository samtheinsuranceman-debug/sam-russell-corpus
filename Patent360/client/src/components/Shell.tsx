import { useEffect, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { Icon, Logo } from './ui';
import { NAV, ROLE_LABEL, ROLE_ORDER, roleAtLeast, type Role } from '../lib/nav';
import type { Session } from '../App';
import { Dashboard } from '../pages/Dashboard';
import { Matters } from '../pages/Matters';
import { Targets } from '../pages/Targets';
import { OfficeActions } from '../pages/OfficeActions';
import { PriorArt } from '../pages/PriorArt';
import { Filings } from '../pages/Filings';
import { Clients } from '../pages/Clients';
import { OfficeActionDetail } from '../pages/OfficeActionDetail';
import { Target } from '../pages/Target';
import { Boardroom } from '../pages/Boardroom';
import { ClientReport } from '../pages/ClientReport';
import { Intake } from '../pages/Intake';
import { Deadlines } from '../pages/Deadlines';
import { Reports } from '../pages/Reports';
import { Datasets } from '../pages/Datasets';
import { Team } from '../pages/Team';
import { Placeholder } from '../pages/Placeholder';
import { Drafting } from '../pages/Drafting';

/** Vellum & Navy. The other six live in styles/skins.css. */
const SKIN = '1';

const DEMO: NonNullable<Session> = {
  name: 'Alex Reyes',
  email: 'a.reyes@brandtlockwood.com',
  role: 'attorney',
  firm: 'Brandt & Lockwood LLP'
};

export function Shell({
  session, onRole, onSignOut
}: { session: Session; onRole: (r: Role) => void; onSignOut: () => void }) {
  const who = session ?? DEMO;
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const initials = who.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  /**
   * The light skin belongs to the interior and nowhere else.
   *
   * It was set on <html> in index.html, which lightened the marketing pages
   * too and — because the skin hides every plate so dark photography cannot
   * bleed through a pale page — left the homepage rendering five invisible
   * skylines on vellum. The skin is a property of this shell, so this shell
   * owns it: applied while the interior is mounted, removed on the way out.
   */
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('data-skin');
    root.setAttribute('data-skin', previous ?? SKIN);
    return () => {
      if (previous === null) root.removeAttribute('data-skin');
    };
  }, []);

  return (
    <div className="shell">
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="side-brand"><Link href="/"><a><Logo size={24} /></a></Link></div>

        {NAV.map(group => {
          const items = group.items.filter(i => roleAtLeast(who.role, i.minRole));
          if (items.length === 0) return null;
          return (
            <div className="side-group" key={group.group}>
              <div className="label">{group.group}</div>
              {items.map(item => {
                const active = location === item.path || (item.path !== '/app' && location.startsWith(item.path));
                return (
                  <Link href={item.path} key={item.path}>
                    <a className={`side-item${active ? ' active' : ''}`} onClick={() => setOpen(false)}>
                      <Icon name={item.icon} />
                      {item.label}
                      {item.badge !== undefined && <span className="side-badge">{item.badge}</span>}
                    </a>
                  </Link>
                );
              })}
            </div>
          );
        })}

        <div className="side-foot">
          <div className="label" style={{ marginBottom: 8 }}>Viewing as</div>
          <select
            value={who.role}
            onChange={e => onRole(e.target.value as Role)}
            style={{
              width: '100%', background: 'var(--ink-900)', border: '1px solid var(--line-mid)',
              borderRadius: 8, padding: '7px 9px', color: 'var(--text-body)', fontFamily: 'var(--font-ui)', fontSize: 13
            }}
          >
            {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
      </aside>

      <div>
        <div className="app-top">
          <div className="row">
            <button
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle navigation"
              className="btn btn-ghost btn-sm"
              style={{ display: 'none' }}
            >
              <Icon name="grid" />
            </button>
            <div className="app-search"><Icon name="search" size={15} /> Search matters, clients, application numbers</div>
          </div>
          <div className="row" style={{ gap: 14 }}>
            <span className="muted" title="Notifications"><Icon name="bell" size={17} /></span>
            <div className="who">
              <span className="who-avatar">{initials}</span>
              <span>
                <span className="who-name">{who.name}</span><br />
                <span className="who-role">{ROLE_LABEL[who.role]} · {who.firm}</span>
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onSignOut}><Icon name="logout" size={14} /> Sign out</button>
          </div>
        </div>

        <main className="app-body">
          <Switch>
            <Route path="/app" component={Dashboard} />
            <Route path="/app/matters" component={Matters} />
            <Route path="/app/targets" component={Targets} />
            <Route path="/app/prior-art" component={PriorArt} />
            <Route path="/app/filings" component={Filings} />
            <Route path="/app/clients" component={Clients} />
            <Route path="/app/office-actions" component={OfficeActions} />
            <Route path="/app/office-actions/:id" component={OfficeActionDetail} />
            <Route path="/app/targets/:id" component={Target} />
            <Route path="/app/boardroom" component={Boardroom} />
            <Route path="/app/client-report" component={ClientReport} />
            <Route path="/app/intake" component={Intake} />
            <Route path="/app/drafting" component={Drafting} />
            <Route path="/app/deadlines" component={Deadlines} />
            <Route path="/app/reports" component={Reports} />
            <Route path="/app/datasets" component={Datasets} />
            <Route path="/app/team">{roleAtLeast(who.role, 'admin') ? <Team /> : <Denied />}</Route>
            <Route path="/app/:section">{(p: { section: string }) => <Placeholder section={p.section} />}</Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Denied() {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="label" style={{ color: 'var(--alert)' }}>Not authorised</div>
      <h2 className="display" style={{ fontSize: 22, margin: '10px 0 8px' }}>This section is administrator only</h2>
      <p className="muted small">
        Your role does not carry access to team and permission settings. Ask a firm administrator if you need it.
        The attempt has been written to the audit log.
      </p>
    </div>
  );
}

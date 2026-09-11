import { Icon, PageHead } from '../components/ui';

const COPY: Record<string, { title: string; sub: string; points: string[] }> = {
  intake: {
    title: 'Intake',
    sub: 'One guided path from invention disclosure to signed engagement.',
    points: ['Disclosure questionnaire by technology area', 'Conflict check against the client and inventor list', 'Engagement letter and retainer collected before the file opens', 'Nothing reaches an attorney until the file is complete']
  },
  clients: {
    title: 'Clients',
    sub: 'Every company, their inventors, their portfolio and their billing.',
    points: ['Portfolio view across all matters', 'Inventor roster and assignment status', 'Per-client access list', 'Invoices and trust balance']
  },
  drafting: {
    title: 'Drafting workbench',
    sub: 'Claims, specification and figures in one editor that keeps its own numbering.',
    points: ['Claim tree with dependency checking', 'Specification support check against every claim term', 'Figure callouts numbered and cross-referenced automatically', 'Version history with a diff between any two drafts']
  },
  'prior-art': {
    title: 'Prior art',
    sub: 'Search, screen, and build the disclosure statement without leaving the file.',
    points: ['Full-text and classification search over the public datasets', 'Screening queue with reasons recorded', 'Information disclosure statement built from what was screened', 'Citation trail kept for every reference']
  },
  'office-actions': {
    title: 'Office actions',
    sub: 'Rejections parsed by ground and mapped to the claims they hit.',
    points: ['Grounds split by statute section', 'Claim-by-claim mapping of each rejection', 'Response outline generated from the mapping', 'Interview notes and examiner history on the same screen']
  },
  filings: {
    title: 'Filings',
    sub: 'Forms built, fees calculated, package assembled, receipt docketed.',
    points: ['Entity-size fee calculation at filing, issue and maintenance', 'Form set assembled from the matter record', 'Two-factor confirmation before submission', 'Filing receipt parsed and every date docketed from it']
  },
  integrations: {
    title: 'Integrations',
    sub: 'Nothing is connected until an administrator connects it.',
    points: ['Document storage', 'Firm billing system', 'Email and calendar', 'Each connection scoped, revocable, and recorded in the audit log']
  },
  settings: {
    title: 'Settings',
    sub: 'Firm profile, docketing rules, templates and notification policy.',
    points: ['Docketing rule set and reminder ladder', 'Document templates by matter type', 'Notification routing per role', 'Data retention policy']
  },
  audit: {
    title: 'Audit log',
    sub: 'Append-only record of every read and every write.',
    points: ['Who, what, when, and from where', 'Denied attempts recorded alongside successful ones', 'Exportable for a client security review', 'No deletion path, for anyone']
  }
};

export function Placeholder({ section }: { section: string }) {
  const c = COPY[section] ?? { title: section, sub: 'Section of the workbench.', points: [] };
  return (
    <>
      <PageHead title={c.title} sub={c.sub} />
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="label" style={{ color: 'var(--accent-300)' }}>Designed, not yet built</div>
        <p style={{ margin: '12px 0 18px' }} className="muted">
          The layout, navigation and access rules for this section are settled. The screen itself is next in the build order.
        </p>
        {c.points.map(p => (
          <div className="row" key={p} style={{ gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
            <span style={{ color: 'var(--accent-400)', marginTop: 2 }}><Icon name="check" size={14} /></span>
            <span className="small">{p}</span>
          </div>
        ))}
      </div>
    </>
  );
}

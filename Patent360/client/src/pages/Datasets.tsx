import { Button, Icon, PageHead, Table } from '../components/ui';
import { DATASETS } from '../lib/demo';
import { runTask } from '../lib/actions';

export function Datasets() {
  return (
    <>
      <PageHead
        title="Datasets"
        sub="The public sources the workbench reads. Each one is refreshed on its own schedule and stamped with the date it was pulled."
        action={
          <Button
            variant="ghost"
            icon="database"
            onClick={() => runTask('Checking every dataset', async () => {
              await new Promise(r => setTimeout(r, 700));
              return {
                title: `${DATASETS.length} datasets checked`,
                tone: 'blocked' as const,
                detail: 'Every one is a fixed snapshot in this build. A real refresh pulls from the ' +
                        'USPTO bulk endpoints on the schedule each row names, which needs a server.'
              };
            })}
          >
            Refresh all
          </Button>
        }
      />
      <Table head={['Source', 'Code', 'Records', 'Refreshed', 'What it is used for', 'State']}>
        {DATASETS.map(d => (
          <tr key={d.code}>
            <td style={{ color: 'var(--text-head)' }}>{d.name}</td>
            <td className="id">{d.code}</td>
            <td className="num">{d.rows}</td>
            <td className="muted">{d.refreshed}</td>
            <td className="muted">{d.use}</td>
            <td>
              <span className="pill" style={{ color: 'var(--signal)', borderColor: 'rgba(34,197,94,0.35)' }}>
                <span className="pill-dot" style={{ background: 'var(--signal)' }} />Current
              </span>
            </td>
          </tr>
        ))}
      </Table>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ gap: 10, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent-400)' }}><Icon name="shield" size={16} /></span>
          <span className="small">
            These are public patent-office datasets. No client matter is ever sent to them, and no third-party AI provider is connected to this workbench.
          </span>
        </div>
      </div>
    </>
  );
}

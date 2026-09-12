import { useEffect, useState } from 'react';
import { Icon } from './ui';
import { dismissNotice, subscribeNotices, type Notice } from '../lib/actions';

/**
 * What the app says back when you press something.
 *
 * Mounted once, at the shell. Every action in lib/actions.ts reports here, so
 * pressing a control always produces a visible consequence — a file named, a
 * count given, or a plain statement that the thing needs a server this build
 * does not have.
 */
export function Notices() {
  const [items, setItems] = useState<Notice[]>([]);
  useEffect(() => subscribeNotices(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="notices" role="status" aria-live="polite">
      {items.map(n => (
        <div className={`notice notice-${n.tone}`} key={n.id}>
          <span className="notice-mark">
            {n.tone === 'done' ? <Icon name="check" size={14} />
              : n.tone === 'blocked' ? <Icon name="alert" size={14} />
              : n.tone === 'pending' ? <span className="notice-spin" />
              : <Icon name="database" size={14} />}
          </span>
          <div className="notice-body">
            <div className="notice-title">{n.title}</div>
            {n.detail && <p className="notice-detail">{n.detail}</p>}
          </div>
          <button className="notice-x" onClick={() => dismissNotice(n.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}

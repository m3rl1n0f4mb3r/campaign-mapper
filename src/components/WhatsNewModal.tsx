import React, { useEffect } from 'react';
import type { ChangelogEntry } from '@/lib/changelog';
import { APP_VERSION } from '@/lib/version';

interface WhatsNewModalProps {
  /** Newest first */
  entries: ChangelogEntry[];
  /** Called for Got it, ×, Esc and clicking outside */
  onClose: () => void;
}

function formatReleaseDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Release notes for returning users, also reopened from Maps → What's New */
const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ entries, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal whats-new"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="whats-new-title">What's New in Campaign Mapper</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-content">
          {entries.map(entry => (
            <section key={entry.version} className="whats-new-release">
              <h3 className="whats-new-version">
                {entry.version}
                <span className="whats-new-date"> · {formatReleaseDate(entry.date)}</span>
              </h3>
              {entry.items.map(item => (
                <div key={item.title} className="whats-new-item">
                  <div className="whats-new-item-title">
                    {item.title}
                    {item.userRequest && <span className="whats-new-request">by user request</span>}
                  </div>
                  <p className="whats-new-item-description">{item.description}</p>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="modal-footer whats-new-footer">
          <span className="text-sm text-muted">Version {APP_VERSION}</span>
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;

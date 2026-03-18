import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ filled, total }) {
  const pct = Math.round((filled / total) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>Progress</span>
        <span>{filled} of {total} required fields</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

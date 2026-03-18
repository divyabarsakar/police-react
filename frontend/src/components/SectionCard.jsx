import React from 'react';
import './SectionCard.css';

export default function SectionCard({ num, title, children }) {
  return (
    <div className="section-card">
      <div className="section-card__num">Section {String(num).padStart(2, '0')}</div>
      <div className="section-card__title">{title}</div>
      {children}
    </div>
  );
}

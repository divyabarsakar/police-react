import React from 'react';
import './Chip.css';

export function ChipGroup({ id, children, className = '' }) {
  return (
    <div className={`chip-group ${className}`} id={id}>
      {children}
    </div>
  );
}

export function Chip({ label, selected, onClick, multi = false }) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'chip--on' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

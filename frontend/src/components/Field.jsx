import React from 'react';
import './Field.css';

export default function Field({ label, optional, required, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field__label">
          {label}
          {required && <span className="field__req"> *</span>}
          {optional && <span className="field__opt"> (optional)</span>}
        </label>
      )}
      {children}
    </div>
  );
}

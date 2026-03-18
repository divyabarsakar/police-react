import React from 'react';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__pulse" />
        Melde Polizeigewalt
      </div>
      <span className="navbar__tag">Vollständig anonym · Completely anonymous</span>
    </nav>
  );
}

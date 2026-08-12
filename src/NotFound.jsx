import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="notfound-container">




        

        <div className="notfound-icon caution-icon" />

        <div className="notfound-actions">
          <Link className="notfound-btn primary" to="/xiao-mantou-games">Return Home</Link>
        </div>
        <div className="notfound-icon x-icon" />
    </div>
  );
}

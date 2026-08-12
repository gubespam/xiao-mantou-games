import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';
import mantouImg from './images/mantou.png';
import fancySvg from './images/fancy-4-icon.svg';

export default function NotFound() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  function makeSuffix(input) {
    const trimmed = input.trim();
    if (!trimmed) return '';
    return trimmed
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const suffix = makeSuffix(value);
    if (!suffix) {
      navigate('/xiao-mantou-games');
    } else {
      navigate(`/xiao-mantou-games/${suffix}`);
    }
  }

  const buttonLabel = value.trim() ? 'Go there' : 'Go home';

  return (
    <div className="notfound-page">
      <div className="notfound-stack">
        <div className="fancy-widget shared-width" role="img" aria-label="fancy 404">
          <div className="fancy-box">
            <img src={fancySvg} alt="fancy 4" className="fancy-4" />
          </div>
          <div className="fancy-box center-icon">
            <img src={mantouImg} alt="Xiao Mantou" className="mantou" />
          </div>
          <div className="fancy-box">
            <img src={fancySvg} alt="fancy 4" className="fancy-4" />
          </div>
        </div>

        <div className="error shared-width">
          <div className="error-text">ERROR</div>
        </div>

        <div className="message shared-width">
          <div className="message-text">Xiao Mantou can't roll to that URL</div>
        </div>

        <form className="game-form shared-width" onSubmit={handleSubmit}>
          <label className="form-label">Enter a game name</label>
          <input
            className="game-input"
            type="text"
            placeholder="Game name (e.g. Tic Tac Tumble)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="form-note">Spaces will become dashes</div>
          <button className="submit-btn" type="submit">{buttonLabel}</button>
        </form>
      </div>
    </div>
  );
}

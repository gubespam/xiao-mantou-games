
import './App.css';
import { Link, Routes, Route } from 'react-router-dom';
import Duordle from './Duordle.jsx';
import CheckersChess from './CheckersChess.jsx';
import mantouLogo from './images/mantou.png';


function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/xiao-mantou-games"
          element={
            <div className="menu-container">
              <img src={mantouLogo} alt="Mantou Logo" className="mantou-logo" />
              <h1>Xiao Mantou Games</h1>
              <p className="subtitle">Little games by our favorite mantou</p>
              <nav className="vertical-menu">
                <Link className="menu-item" to="/duordle">Duordle</Link>
                <Link className="menu-item" to="/checkers-chess">Checkers-Chess</Link>
                <Link className="menu-item" to="/tic-tac-tumble">Hierarchy Tic-tac-tumble</Link>
              </nav>
            </div>
          }
        />
        <Route path="/duordle" element={<Duordle />} />
        <Route path="/checkers-chess" element={<CheckersChess />} />
      </Routes>
    </div>
  );
}

export default App

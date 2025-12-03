
import './App.css';
import { Link, Routes, Route } from 'react-router-dom';
import Duordle from './Duordle.jsx';
import DuordlePlus from './DuordlePlus.jsx';
import CheckersChess from './CheckersChess.jsx';
import TicTacTumble from './TicTacTumble.jsx';
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
                <Link className="menu-item" to="/xiao-mantou-games/duordle">Duordle</Link>
                <Link className="menu-item" to="/xiao-mantou-games/duordle-plus">Duordle Plus</Link>
                <Link className="menu-item" to="/xiao-mantou-games/checkers-chess">Checkers-Chess</Link>
                <Link className="menu-item" to="/xiao-mantou-games/tic-tac-tumble">Hierarchy Tic-tac-tumble</Link>
              </nav>
            </div>
          }
        />
        <Route path="/xiao-mantou-games/duordle" element={<Duordle />} />
        <Route path="/xiao-mantou-games/duordle-plus" element={<DuordlePlus />} />
        <Route path="/xiao-mantou-games/tic-tac-tumble" element={<TicTacTumble />} />
        <Route path="/xiao-mantou-games/checkers-chess" element={<CheckersChess />} />
      </Routes>
    </div>
  );
}

export default App


import './App.css';
import { Link, Routes, Route } from 'react-router-dom';
import Duordle from './Duordle.jsx';
import CheckersChess from './CheckersChess.jsx';


function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/xiao-mantou-games/"
          element={
            <div className="menu-container">
              <h1>🥟 Xiao Mantou Games</h1>
              <p className="subtitle">Welcome to your game collection!</p>
              <nav className="vertical-menu">
                <Link className="menu-item" to="/duordle">Duordle</Link>
                <Link className="menu-item" to="/checkers-chess">Checkers-Chess</Link>
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

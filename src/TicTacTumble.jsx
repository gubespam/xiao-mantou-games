import React, { useState, useEffect } from 'react';
import T3Board from './T3Board.jsx';
import './TicTacTumble.css';

function TicTacTumble() {
  const [gameStates, setGameStates] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameWinner, setGameWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const [boardSquares, setBoardSquares] = useState(Array(9).fill().map(() => Array(9).fill(null)));
  const [moveHistory, setMoveHistory] = useState([]);

  const calculateWinner = (states) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      const stateA = states[a];
      const stateB = states[b];
      const stateC = states[c];

      if (stateA && stateB && stateC) {
        if (
          stateA.type === 'win' &&
          stateB.type === 'win' &&
          stateC.type === 'win' &&
          stateA.player === stateB.player &&
          stateA.player === stateC.player
        ) {
          return { type: 'winner', player: stateA.player, line };
        }
      }
    }
    return null;
  };

  const calculateScores = (states) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    const newScores = { X: 0, O: 0 };

    for (let line of lines) {
      const [a, b, c] = line;
      const stateA = states[a];
      const stateB = states[b];
      const stateC = states[c];

      const content = [stateA, stateB, stateC];
      const xCount = content.filter(s => s?.type === 'win' && s.player === 'X').length;
      const oCount = content.filter(s => s?.type === 'win' && s.player === 'O').length;
      const tieCount = content.filter(s => s?.type === 'tie').length;

      if (xCount === 2 && tieCount === 1) newScores.X += 2;
      if (xCount === 1 && tieCount === 2) newScores.X += 1;
      if (oCount === 2 && tieCount === 1) newScores.O += 2;
      if (oCount === 1 && tieCount === 2) newScores.O += 1;
    }

    return newScores;
  };

  const allGamesDone = (states) => {
    return states.every(state => state !== null);
  };

  const handleGameEnd = (boardIndex, endData) => {
    // Only update game state if the smaller game ended (win or tie)
    if (endData.type === 'win' || endData.type === 'tie') {
      const newStates = gameStates.slice();
      newStates[boardIndex] = endData;
      setGameStates(newStates);

      // Check for winner immediately
      const winner = calculateWinner(newStates);
      if (winner) {
        setGameWinner(winner);
      } else if (allGamesDone(newStates)) {
        // Calculate scores if all games are done
        const finalScores = calculateScores(newStates);
        setScores(finalScores);
        setGameWinner({ type: 'scored', scores: finalScores });
      }
    }
  };

  const handleMove = (boardIndex, cellIndex, player) => {
    const newBoardSquares = boardSquares.map(board => board.slice());
    newBoardSquares[boardIndex][cellIndex] = player;
    setBoardSquares(newBoardSquares);
    setMoveHistory([...moveHistory, { boardIndex, cellIndex, player }]);
    setIsXNext(!isXNext);
  };

  const handleUndo = () => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    const newBoardSquares = boardSquares.map(board => board.slice());
    newBoardSquares[lastMove.boardIndex][lastMove.cellIndex] = null;
    setBoardSquares(newBoardSquares);
    setMoveHistory(moveHistory.slice(0, -1));
    setIsXNext(lastMove.player === 'X');
    if (gameStates[lastMove.boardIndex]) {
      const newGameStates = gameStates.slice();
      newGameStates[lastMove.boardIndex] = null;
      setGameStates(newGameStates);
      const overallWinner = calculateWinner(newGameStates);
      setGameWinner(overallWinner);
    }
  };

  const isGameCellPlayable = (index) => {
    return gameStates[index] === null;
  };

  const isBoardDisabled = (index) => {
    return gameStates[index] !== null || gameWinner !== null;
  };

  const renderGameCell = (index) => {
    const state = gameStates[index];

    if (!state) {
      return (
        <div className="game-cell">
          <T3Board
            squares={boardSquares[index]}
            currentPlayer={isXNext ? 'X' : 'O'}
            onSquareClick={(cellIndex) => handleMove(index, cellIndex, isXNext ? 'X' : 'O')}
            onGameEnd={(endData) => handleGameEnd(index, endData)}
            disabled={isBoardDisabled(index)}
          />
        </div>
      );
    }

    if (state.type === 'win') {
      return (
        <div className={`game-cell-result winning-cell player-${state.player}`}>
          <div className="large-mark">{state.player}</div>
        </div>
      );
    }

    if (state.type === 'tie') {
      return (
        <div className="game-cell-result tie-cell">
          <div className="cat-emoji">🐱</div>
        </div>
      );
    }
  };

  const isWinningCell = (index) => {
    if (!gameWinner || gameWinner.type !== 'winner') return false;
    return gameWinner.line.includes(index);
  };

  return (
    <div className="game-page tic-tac-tumble-container">
      <h1>Tic-Tac-Tumble</h1>

      {moveHistory.length > 0 && !gameWinner && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <button className="general-button" onClick={handleUndo}>Undo</button>
        </div>
      )}

      {!gameWinner && (
        <div className="turn-indicator">
          Current Player: <span className="current-player">{isXNext ? 'X' : 'O'}</span>
        </div>
      )}

      <div className="larger-board">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <div
            key={index}
            className={`board-square ${isWinningCell(index) ? 'winning-square' : ''}`}
          >
            {renderGameCell(index)}
          </div>
        ))}
      </div>

      {gameWinner && gameWinner.type === 'winner' && (
        <div className="game-over-message winner-message">
          🎉 Player {gameWinner.player} wins! 🎉
        </div>
      )}

      {gameWinner && gameWinner.type === 'scored' && (
        <div className="game-over-message scored-message">
          <p>Game Over! Final Scores:</p>
          <p>X: {gameWinner.scores.X} | O: {gameWinner.scores.O}</p>
          <p className="score-winner">
            {gameWinner.scores.X > gameWinner.scores.O
              ? '🎉 Player X wins! 🎉'
              : gameWinner.scores.O > gameWinner.scores.X
              ? '🎉 Player O wins! 🎉'
              : "It's a tie!"}
          </p>
        </div>
      )}
    </div>
  );
}

export default TicTacTumble;

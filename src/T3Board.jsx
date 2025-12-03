import React, { useState, useEffect } from 'react';
import './T3Board.css';

function T3Board({ onGameEnd = null, onMove = null, disabled = false, currentPlayer = 'X' }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);

  const calculateWinner = (squares) => {
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
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { player: squares[a], line };
      }
    }
    return null;
  };

  const isBoardFull = (squares) => {
    return squares.every(square => square !== null);
  };

  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setWinner(result);
      if (onGameEnd) {
        onGameEnd({ type: 'win', player: result.player, board: board.slice() });
      }
    } else if (isBoardFull(board)) {
      if (onGameEnd) {
        onGameEnd({ type: 'tie', board: board.slice() });
      }
    }
  }, [board]);

  const handleClick = (index) => {
    if (disabled || board[index] !== null || winner) return;

    const newBoard = board.slice();
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    if (onMove) {
      onMove(index, currentPlayer);
    }
  };

  const isWinningSquare = (index) => {
    return winner && winner.line.includes(index);
  };

  return (
    <div className="t3-board">
      {board.map((value, index) => (
        <div
          key={index}
          className={`t3-square ${isWinningSquare(index) ? 'winning' : ''} ${
            value ? 'filled' : ''
          }`}
          onClick={() => handleClick(index)}
        >
          {value && <span className="t3-mark">{value}</span>}
        </div>
      ))}
    </div>
  );
}

export default T3Board;

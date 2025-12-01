import React, { useState, useCallback, useRef } from "react";
import WordleBoard from "./WordleBoard";
import Keyboard from "./Keyboard";

function Wordle() {
  const [keyboard, setKeyboard] = useState({}); // {A: 'absent'|'present'|'correct'}
  const [boardStates, setBoardStates] = useState([{}, {}]); // State for each board
  const boardRefs = useRef([React.createRef(), React.createRef()]);

  const handleBoardStatusChange = useCallback((boardIndex, { guesses, statuses }) => {
    setBoardStates((prev) => {
      const updated = [...prev];
      updated[boardIndex] = { guesses, statuses };
      return updated;
    });

    // Update keyboard based on both boards' guesses and statuses
    const kb = { ...keyboard };
    const state = { guesses, statuses };
    state.guesses.forEach((guess, i) => {
      state.statuses[i].forEach((status, j) => {
        const letter = guess[j].toUpperCase();
        if (!kb[letter] || kb[letter] === "absent") {
          kb[letter] = status;
        }
        if (kb[letter] === "present" && status === "correct") {
          kb[letter] = "correct";
        }
        if (kb[letter] === "absent" && (status === "present" || status === "correct")) {
          kb[letter] = status;
        }
      });
    });
    setKeyboard(kb);
  }, [keyboard]);

  const handleKey = useCallback((key) => {
    // Dispatch key to both boards
    boardRefs.current.forEach((ref) => {
      if (ref && ref.current && ref.current.handleKey) {
        ref.current.handleKey(key);
      }
    });
  }, []);

  const gameStates = boardStates.map((state) => state.guesses && state.guesses.length > 0 ? "done" : "playing");
  const isBothGameOver = gameStates.every((state) => state === "done");

  return (
    <div className="wordle-container">
      <div className="wordle-boards-wrapper">
        <WordleBoard 
          ref={boardRefs.current[0]}
          onStatusChange={(status) => handleBoardStatusChange(0, status)}
        />
        <WordleBoard 
          ref={boardRefs.current[1]}
          onStatusChange={(status) => handleBoardStatusChange(1, status)}
        />
      </div>
      <Keyboard 
        onKeyPress={handleKey} 
        keyboard={keyboard} 
        gameState={isBothGameOver ? "finished" : "playing"} 
      />
    </div>
  );
}

export default Wordle;

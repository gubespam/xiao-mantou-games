import React, { useState, useCallback, useRef } from "react";
import WordleBoard from "./WordleBoard";
import Keyboard from "./Keyboard";

function Wordle() {
  const [keyboardStates, setKeyboardStates] = useState([{}, {}]); // Keyboard state for each board
  const [boardStates, setBoardStates] = useState([{}, {}]); // State for each board
  const boardRefs = useRef([React.createRef(), React.createRef()]);

  const handleBoardStatusChange = useCallback((boardIndex, { guesses, statuses }) => {
    setBoardStates((prev) => {
      const updated = [...prev];
      updated[boardIndex] = { guesses, statuses };
      return updated;
    });

    // Update keyboard state for the specific board
    // absent
    // present - anywhere in the word
    // present-near - one space away
    // present-far - more than one space away
    // correct
    setKeyboardStates((prev) => {
      const updated = [...prev];
      const kb = { ...updated[boardIndex] }; // keyboard state for this board
      const state = { guesses, statuses };
      state.guesses.forEach((guess, i) => { // guesses on the board
        state.statuses[i].forEach((status, j) => { // status of each letter in the guess
          const letter = guess[j].toUpperCase();
          if (!kb[letter] || kb[letter] === "absent") {
            kb[letter] = status;
          }
          if (kb[letter].startsWith("present") && status === "correct") {
            kb[letter] = "correct";
          }
          if (kb[letter] === "absent" && (status.startsWith("present") || status === "correct")) {
            kb[letter] = status;
          }
        });
      });
      updated[boardIndex] = kb;
      return updated;
    });
  }, []);

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
        keyboardLeft={keyboardStates[0]}
        keyboardRight={keyboardStates[1]}
        gameState={isBothGameOver ? "finished" : "playing"} 
      />
    </div>
  );
}

export default Wordle;

import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { WORD_LIST } from "./wordlist";

const WORD_LENGTH = 5;
const MAX_GUESSES = 8;

 // Set to true to show answers and allow non-words for debugging
const DEBUG = true && window.location.hostname === "localhost";

function getRandomWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toLowerCase();
}

// Given a guess and teh correct answer, return array of statuses for each letter in the guess
function getLetterStatuses(guess, answer, rules) {
  // Returns array of 'absent', 'present', 'present-near', 'present-far', 'correct' for each letter
  const result = Array(WORD_LENGTH).fill("absent");
  const answerArr = answer.split("");
  const guessArr = guess.split("");
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "correct";
      used[i] = true;
      answerArr[i] = null; // Mark as used
    }
  }
  // Second pass: present
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const idx = answerArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      if (rules === "plus") {
        if (Math.abs(idx - i) === 1) {
          result[i] = "present-near";
        } else if (Math.abs(idx - i) > 1) {
          result[i] = "present-far";
        } else {
          result[i] = "present";
        }
      } else {
        result[i] = "present";
      }
      answerArr[idx] = null;
    }
  }
  return result;
}

function seq(n) {
  return Array.from({ length: n }, (_, i) => i);
}

const WordleBoard = forwardRef(({ onStatusChange, rules, storageKey, boardIndex }, ref) => {
  const [answer, setAnswer] = useState("");
  const [guesses, setGuesses] = useState([]); // Array of strings
  const [statuses, setStatuses] = useState([]); // Array of arrays
  const [current, setCurrent] = useState("");
  const [gameState, setGameState] = useState("playing"); // 'playing', 'won', 'lost'

  // Helpers to read/write root object for this storageKey
  const readRoot = () => {
    if (!storageKey) return {};
    try {
      return JSON.parse(window.localStorage.getItem(storageKey)) || {};
    } catch (e) {
      console.error("Failed to parse storage for", storageKey, e);
      return {};
    }
  };
  const writeRoot = (root) => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(root));
    } catch (e) {
      console.error("Failed to write storage for", storageKey, e);
    }
  };

  // Initialize answer / guesses / current from storage (if present), otherwise pick new random answer
  useEffect(() => {
    if (!storageKey || boardIndex === undefined) {
      setAnswer(getRandomWord());
      console.log("New word")
      return;
    }
    const root = readRoot();
    const board = (root.boards && root.boards[boardIndex]) || null;
    if (board && board.answer) {
      console.log("Board found")
      setAnswer(board.answer);
      const restoredGuesses = board.guesses || [];
      setGuesses(restoredGuesses);
      const restoredStatuses = restoredGuesses.map((g) => getLetterStatuses(g, board.answer, rules));
      setStatuses(restoredStatuses);
      setCurrent(board.current || "");
      if (restoredGuesses.length > 0 && restoredGuesses[restoredGuesses.length - 1] === board.answer) {
        setGameState("won");
      } else if (restoredGuesses.length >= MAX_GUESSES) {
        setGameState("lost");
      } else {
        setGameState("playing");
      }
      return;
    }
      console.log("New word2")
    const w = getRandomWord();
    setAnswer(w);
    // persist initial answer immediately so a reload won't change it
    const newRoot = readRoot();
    newRoot.boards = newRoot.boards || [];
    newRoot.boards[boardIndex] = { answer: w, guesses: [], current: "" };
    writeRoot(newRoot);
    // eslint-disable-next-line
  }, []);

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({ guesses, statuses });
    }
    // eslint-disable-next-line
  }, [guesses, statuses]);

  // Persist answer / guesses / current whenever any of them change
  useEffect(() => {
    if (!storageKey || boardIndex === undefined) return;
    const root = readRoot();
    root.boards = root.boards || [];
    root.boards[boardIndex] = { answer, guesses, current };
    writeRoot(root);
  }, [answer, guesses, current, storageKey, boardIndex]);

  const handleKey = useCallback(
    (key) => {
      if (gameState !== "playing") return;
      if (key === "Backspace") {
        setCurrent((c) => c.slice(0, -1));
      } else if (key === "Enter") {
        if (current.length !== WORD_LENGTH) return;
        if (!DEBUG && !WORD_LIST.includes(current)) {
          alert("Not in word list");
          return;
        }
        const status = getLetterStatuses(current, answer, rules);
        setGuesses((g) => [...g, current]);
        setStatuses((s) => [...s, status]);
        setCurrent("");
        if (current === answer) {
          setGameState("won");
        } else if (guesses.length + 1 >= MAX_GUESSES) {
          setGameState("lost");
        }
      } else if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
        setCurrent((c) => c + key.toLowerCase());
      }
    },
    [current, answer, guesses, gameState, rules]
  );

  // Expose handleKey method to parent
  useImperativeHandle(ref, () => ({
    handleKey,
  }), [handleKey]);

  const renderCell = (letter, status, idx) => (
    <div
      key={`${letter}-${idx}`}
      className={`wordle-cell ${status || ""}`}
      style={{ textTransform: "uppercase" }}
    >
      {letter}
    </div>
  );

  const renderRow = (guess = "", status = [], idx) => (
    <div className="wordle-row" key={`row-${idx}`}>
      {Array.from({ length: WORD_LENGTH }).map((_, i) =>
        renderCell(guess[i] || "", status[i] || "", i)
      )}
    </div>
  );

  return (
    <div className="wordle-board-container">
      {DEBUG && <div className="wordle-debug">Answer: {answer}</div>}
      <div className="wordle-board">
        {
          seq(MAX_GUESSES).map((i) => {
            if (i < guesses.length) {
              return renderRow(guesses[i], statuses[i], i);
            } else if (i === guesses.length && gameState === "playing") {
              return renderRow(current, [], i);
            } else {
              return renderRow("", [], i);
            }
          })
        }
      </div>
      {gameState === "won" && <div className="wordle-result win">You won! 🎉</div>}
      {gameState === "lost" && <div className="wordle-result lose">The word was: <b>{answer}</b></div>}
    </div>
  );
});

WordleBoard.displayName = "WordleBoard";

export default WordleBoard;

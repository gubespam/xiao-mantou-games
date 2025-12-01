import React, { useState, useEffect, useCallback } from "react";
import { WORD_LIST } from "./wordlist";
import Keyboard from "./Keyboard";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function getRandomWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toLowerCase();
}

function getLetterStatuses(guess, answer) {
  // Returns array of 'absent', 'present', 'correct' for each letter
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
      result[i] = "present";
      answerArr[idx] = null;
    }
  }
  return result;
}

function Wordle() {
  const [answer, setAnswer] = useState("");
  const [guesses, setGuesses] = useState([]); // Array of strings
  const [statuses, setStatuses] = useState([]); // Array of arrays
  const [current, setCurrent] = useState("");
  const [keyboard, setKeyboard] = useState({}); // {A: 'absent'|'present'|'correct'}
  const [gameState, setGameState] = useState("playing"); // 'playing', 'won', 'lost'

  useEffect(() => {
    setAnswer(getRandomWord());
  }, []);

  // Update keyboard colors
  useEffect(() => {
    const kb = { ...keyboard };
    guesses.forEach((guess, i) => {
      statuses[i].forEach((status, j) => {
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
    // eslint-disable-next-line
  }, [guesses, statuses]);

  const handleKey = useCallback(
    (key) => {
      if (gameState !== "playing") return;
      if (key === "Backspace") {
        setCurrent((c) => c.slice(0, -1));
      } else if (key === "Enter") {
        if (current.length !== WORD_LENGTH) return;
        if (!WORD_LIST.includes(current)) {
          alert("Not in word list");
          return;
        }
        const status = getLetterStatuses(current, answer);
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
    [current, answer, guesses, gameState]
  );



  const renderCell = (letter, status, idx) => (
    <div
      key={idx}
      className={`wordle-cell ${status || ""}`}
      style={{ textTransform: "uppercase" }}
    >
      {letter}
    </div>
  );

  const renderRow = (guess = "", status = []) => (
    <div className="wordle-row">
      {Array.from({ length: WORD_LENGTH }).map((_, i) =>
        renderCell(guess[i] || "", status[i] || "", i)
      )}
    </div>
  );

  return (
    <div className="wordle-container">
      <div className="wordle-board">
        {guesses.map((g, i) => renderRow(g, statuses[i]))}
        {gameState === "playing" && renderRow(current)}
        {Array.from({ length: MAX_GUESSES - guesses.length - (gameState === "playing" ? 1 : 0) }).map((_, i) => renderRow("", []))}
      </div>
      <Keyboard onKeyPress={handleKey} keyboard={keyboard} gameState={gameState} />
      {gameState === "won" && <div className="wordle-result win">You won! 🎉</div>}
      {gameState === "lost" && <div className="wordle-result lose">The word was: <b>{answer}</b></div>}
    </div>
  );
}

export default Wordle;

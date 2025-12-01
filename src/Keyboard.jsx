import React, { useEffect } from "react";

const QWERTY = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Backspace"]
];

function Keyboard({ onKeyPress, keyboard, gameState }) {
  // Handle physical keyboard input
  useEffect(() => {
    const onKeyDown = (e) => {
      let key = e.key;
      if (key === "Enter" || key === "Backspace" || (/^[a-zA-Z]$/.test(key) && key.length === 1)) {
        onKeyPress(key.length === 1 ? key.toUpperCase() : key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyPress]);

  return (
    <div className="wordle-keyboard">
      {QWERTY.map((row, i) => (
        <div className="wordle-keyboard-row" key={i}>
          {row.map((key) => (
            <button
              key={key}
              className={`wordle-key ${keyboard[key] || ""}`}
              onClick={() => onKeyPress(key)}
              disabled={gameState !== "playing" && key !== "Enter" && key !== "Backspace"}
              aria-label={key}
            >
              {key === "Backspace" ? "⌫" : key === "Enter" ? "⤶" : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Keyboard;

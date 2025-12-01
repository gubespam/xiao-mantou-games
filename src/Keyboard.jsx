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

  const renderEnterIcon = () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 48 48"
      style={{ verticalAlign: "middle", display: "block", margin: "0 auto" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M44 36V16C44 11.5817 40.4183 8 36 8H12M12 8L20 16M12 8L20 0"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="0,24 16,16 16,32" fill="#fff" />
    </svg>
  );

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
              {key === "Backspace" ? "⌫" : key === "Enter" ? renderEnterIcon() : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Keyboard;

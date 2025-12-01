import React, { useEffect } from "react";

const QWERTY = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Backspace"]
];

function Keyboard({ onKeyPress, keyboardLeft, keyboardRight, gameState }) {
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

  const getKeyStyle = (key) => {
    const leftStatus = keyboardLeft?.[key] || "";
    const rightStatus = keyboardRight?.[key] || "";

    let leftBg = "#18181b";
    let rightBg = "#18181b";

    // Map status to background color
    const statusToColor = {
      correct: "#22c55e",
      present: "#eab308",
      absent: "#52525b",
    };

    if (leftStatus) leftBg = statusToColor[leftStatus] || "#18181b";
    if (rightStatus) rightBg = statusToColor[rightStatus] || "#18181b";

    // Create a split background
    return {
      background: `linear-gradient(to right, ${leftBg} 0%, ${leftBg} 50%, ${rightBg} 50%, ${rightBg} 100%)`,
    };
  };

  return (
    <div className="wordle-keyboard">
      {QWERTY.map((row, i) => (
        <div className="wordle-keyboard-row" key={i}>
          {row.map((key) => (
            <button
              key={key}
              className="wordle-key"
              style={getKeyStyle(key)}
              onClick={() => onKeyPress(key)}
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

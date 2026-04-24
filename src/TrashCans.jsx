import React, { useState } from 'react';
import './TrashCans.css'; // Assuming we'll create a CSS file for styling

function TrashCans() {
  const [score, setScore] = useState(0);
  const [trashItems, setTrashItems] = useState([
    { id: 1, name: 'Plastic Bottle', type: 'recycle', placed: false },
    { id: 2, name: 'Banana Peel', type: 'compost', placed: false },
    { id: 3, name: 'Paper', type: 'recycle', placed: false },
    { id: 4, name: 'Candy Wrapper', type: 'trash', placed: false },
    { id: 5, name: 'Apple Core', type: 'compost', placed: false },
  ]);

  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDrop = (canType) => {
    if (draggedItem && draggedItem.type === canType && !draggedItem.placed) {
      setScore(score + 10);
      setTrashItems(trashItems.map(item =>
        item.id === draggedItem.id ? { ...item, placed: true } : item
      ));
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="trash-cans-game">
      <h1>Trash Cans Game</h1>
      <p>Score: {score}</p>
      <div className="game-area">
        <div className="trash-items">
          <h2>Trash Items</h2>
          {trashItems.filter(item => !item.placed).map(item => (
            <div
              key={item.id}
              className="trash-item"
              draggable
              onDragStart={() => handleDragStart(item)}
            >
              {item.name}
            </div>
          ))}
        </div>
        <div className="cans">
          <div
            className="can recycle-can"
            onDrop={() => handleDrop('recycle')}
            onDragOver={handleDragOver}
          >
            <h3>Recycle</h3>
          </div>
          <div
            className="can compost-can"
            onDrop={() => handleDrop('compost')}
            onDragOver={handleDragOver}
          >
            <h3>Compost</h3>
          </div>
          <div
            className="can trash-can"
            onDrop={() => handleDrop('trash')}
            onDragOver={handleDragOver}
          >
            <h3>Trash</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrashCans;
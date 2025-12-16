
import React from 'react';
import Wordle from './Wordle';


const Duordle = () => {
  return (
    <div className="game-page">
      <h1>Duordle</h1>
      <Wordle storageKey="xmg/duordle" />
    </div>
  );
};

export default Duordle;

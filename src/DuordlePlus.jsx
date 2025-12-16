
import React from 'react';
import Wordle from './Wordle';


const Duordle = () => {
  return (
    <div className="game-page">
      <h1>Duordle Plus</h1>
      <Wordle rules="plus" storageKey="xmg/duordle-plus" />
    </div>
  );
};

export default Duordle;

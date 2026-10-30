import './CandyRun.css';
import React from "react";
import snickersImage from "./assets/Snickers.avif";
import snickersAudio from "./assets/Snickers.m4a";

const assets = [{
  title: 'Snickers',
  sound: snickersAudio,
  image: 'Snickers.avif'
}]

function chooseOption(asset, optionElement){
  const audio = new Audio(asset.sound);
  audio.play();

  optionElement.classList.remove('waggle');
  // offsetWidth forces the browser to calculate the element’s current layout, 
  // which makes the next animation restart reliably.
  void optionElement.offsetWidth;
  
  optionElement.classList.add('waggle');
}

function CandyRun({}){
  return <div className='candy-run'>Hi
    <div className='options'>
      {assets.map(asset => (
        <div
          key={asset.title}
          className="option"
          onClick={event => chooseOption(asset, event.currentTarget)}
          onAnimationEnd={event => event.currentTarget.classList.remove('waggle')}
        >
          <div className='title'>{asset.title}</div>
          <img src={snickersImage} alt={asset.title} />
        </div>
      ))}
    </div>
  </div>
}

export default CandyRun;

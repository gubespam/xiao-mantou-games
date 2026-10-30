import './CandyRun.css';
import React from "react";
import snickersImage from "./assets/Snickers.avif";
import snickersAudio from "./assets/Snickers.m4a";
import skittlesImage from "./assets/Skittles.webp";
import skittlesAudio from "./assets/Skittles.m4a";
import milkyWayImage from "./assets/MilkyWay.jpeg";
import milkyWayAudio from "./assets/MilkyWay.m4a";
import kitKatImage from "./assets/KitKat.webp";
import kitKatAudio from "./assets/KitKat.m4a";
import sourPatchImage from "./assets/SourPatch.webp";
import sourPatchAudio from "./assets/SourPatch.m4a";

const assets = [
  {
    title: 'Snickers',
    sound: snickersAudio,
    image: snickersImage
  },
  {
    title: 'Skittles',
    sound: skittlesAudio,
    image: skittlesImage
  },
  {
    title: 'Milky Way',
    sound: milkyWayAudio,
    image: milkyWayImage
  },
  {
    title: 'KitKat',
    sound: kitKatAudio,
    image: kitKatImage
  },
  {
    title: 'Sour Patch',
    sound: sourPatchAudio,
    image: sourPatchImage
  }
  // 
]

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
          <img src={asset.image} alt={asset.title} />
        </div>
      ))}
    </div>
  </div>
}

export default CandyRun;

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { staggerReveal } from '../../utils/animations';
import Card from '../common/Card';
import Button from '../common/Button';

const Home = () => {
  const headingRef = useRef(null);

  useEffect(() => {
    // Stagger reveal for cards
    staggerReveal('.home-card');
    // Animate heading letter by letter
    anime({
      targets: headingRef.current,
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 800,
      easing: 'easeOutQuad',
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 ref={headingRef} className="text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
        Wolf Society Esports
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="home-card" title="Live Matches" description="Watch our teams in action." />
        <Card className="home-card" title="Roster" description="Meet our players." />
        <Card className="home-card" title="Content" description="Latest videos and streams." />
      </div>
    </div>
  );
};

export default Home;

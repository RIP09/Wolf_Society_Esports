import React, { useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { staggerReveal } from '../../utils/animations';

const Home = () => {
  useEffect(() => {
    staggerReveal('.home-card');
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Wolf Society Esports
        </h1>
        <p className="text-muted text-lg mt-4 max-w-2xl mx-auto">
          Where champions rise. Join the pack and dominate the leaderboards.
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <Button variant="primary">Watch Live</Button>
          <Button variant="outline">Our Teams</Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="home-card"
          title="🏆 Live Matches"
          description="Watch our teams battle in real-time. Upcoming schedules and VODs available."
        />
        <Card
          className="home-card"
          title="🎮 Roster"
          description="Meet our talented players, their roles, and stats."
        />
        <Card
          className="home-card"
          title="📺 Content Hub"
          description="Exclusive highlights, interviews, and behind-the-scenes content."
        />
      </section>
    </div>
  );
};

export default Home;

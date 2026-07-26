import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { staggerReveal } from '../../utils/animations';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teams')
      .then(res => {
        setTeams(res.data);
        setLoading(false);
        setTimeout(() => staggerReveal('.team-card'), 100);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Our Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teams.map(team => (
          <Card key={team.id} className="team-card" title={team.name}>
            <p className="text-muted">Tag: {team.tag}</p>
            <p className="text-muted">Game: {team.game}</p>
            <p className="text-muted">Wins: {team.wins} | Losses: {team.losses} | Draws: {team.draws}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Teams;

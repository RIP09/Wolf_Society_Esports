import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { staggerReveal } from '../../utils/animations';

const Schedule = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matches')
      .then(res => {
        setMatches(res.data);
        setLoading(false);
        setTimeout(() => staggerReveal('.match-row'), 100);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Match Schedule</h1>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Team</th>
              <th className="p-3 text-left">Opponent</th>
              <th className="p-3 text-left">Game</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Result</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id} className="match-row border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 font-medium">{match.Team?.name || 'TBD'}</td>
                <td className="p-3">{match.opponent}</td>
                <td className="p-3">{match.game}</td>
                <td className="p-3">{match.match_date}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${match.result === 'win' ? 'bg-green-500/20 text-green-300' : match.result === 'loss' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {match.result || 'upcoming'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { staggerReveal } from '../../utils/animations';
import Button from '../common/Button';

const MatchesTable = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const res = await api.get('/matches');
      setMatches(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => staggerReveal('.match-row'), 100);
    }
  }, [loading]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this match?')) {
      await api.delete(`/matches/${id}`);
      await fetchMatches();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary">Match Management</h2>
        <Button variant="secondary" size="sm">Add Match</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Team</th>
              <th className="p-3 text-left">Opponent</th>
              <th className="p-3 text-left">Game</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Result</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="match-row border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 font-medium">{m.Team?.name || 'TBD'}</td>
                <td className="p-3">{m.opponent}</td>
                <td className="p-3">{m.game}</td>
                <td className="p-3">{m.match_date}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${m.result === 'win' ? 'bg-green-500/20 text-green-300' : m.result === 'loss' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {m.result || 'upcoming'}
                  </span>
                </td>
                <td className="p-3 text-center space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(m.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchesTable;

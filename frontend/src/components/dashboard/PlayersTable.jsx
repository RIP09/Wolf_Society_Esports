import React, { useState, useEffect } from 'react';
import anime from 'animejs';
import { api } from '../../services/api';
import { staggerReveal } from '../../utils/animations';
import Button from '../common/Button';

const PlayersTable = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await api.get('/players');
      setPlayers(data);
      setLoading(false);
      // Animate table rows after render
      setTimeout(() => staggerReveal('.player-row'), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this player?')) {
      await api.delete(`/players/${id}`);
      await fetchPlayers();
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Roster Management</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/60">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Game</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <tr key={p.id} className="player-row border-b border-zinc-700/50 hover:bg-zinc-800/30 transition-colors">
                <td className="p-3 font-medium">{p.display_name}</td>
                <td className="p-3">{p.game}</td>
                <td className="p-3">{p.role}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 text-center space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayersTable;

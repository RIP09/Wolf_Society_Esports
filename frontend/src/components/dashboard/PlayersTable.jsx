import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { staggerReveal } from '../../utils/animations';
import Button from '../common/Button';

const PlayersTable = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      const res = await api.get('/players');
      setPlayers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => staggerReveal('.player-row'), 100);
    }
  }, [loading]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this player?')) {
      await api.delete(`/players/${id}`);
      await fetchPlayers();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary">Roster Management</h2>
        <Button variant="secondary" size="sm">Add Player</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Game</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="player-row border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 font-medium">{p.display_name}</td>
                <td className="p-3">{p.game || '—'}</td>
                <td className="p-3">{p.role || '—'}</td>
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

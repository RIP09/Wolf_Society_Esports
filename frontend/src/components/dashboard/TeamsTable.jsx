import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { staggerReveal } from '../../utils/animations';
import Button from '../common/Button';

const TeamsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => staggerReveal('.team-row'), 100);
    }
  }, [loading]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this team?')) {
      await api.delete(`/teams/${id}`);
      await fetchTeams();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary">Team Management</h2>
        <Button variant="secondary" size="sm">Add Team</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Tag</th>
              <th className="p-3 text-left">Game</th>
              <th className="p-3 text-left">W/L/D</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="team-row border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3">{t.tag}</td>
                <td className="p-3">{t.game}</td>
                <td className="p-3">{t.wins}/{t.losses}/{t.draws}</td>
                <td className="p-3 text-center space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(t.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamsTable;

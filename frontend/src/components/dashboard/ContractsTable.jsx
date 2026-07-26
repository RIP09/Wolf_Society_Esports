import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { staggerReveal } from '../../utils/animations';
import Button from '../common/Button';

const ContractsTable = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    try {
      const res = await api.get('/contracts');
      setContracts(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => staggerReveal('.contract-row'), 100);
    }
  }, [loading]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this contract?')) {
      await api.delete(`/contracts/${id}`);
      await fetchContracts();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary">Contracts</h2>
        <Button variant="secondary" size="sm">Add Contract</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">End Date</th>
              <th className="p-3 text-left">Value</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="contract-row border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 font-medium">{c.User?.full_name || 'Unknown'}</td>
                <td className="p-3">{c.type}</td>
                <td className="p-3">{c.start_date}</td>
                <td className="p-3">{c.end_date}</td>
                <td className="p-3">${c.value || '—'}</td>
                <td className="p-3 text-center space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractsTable;

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { staggerReveal } from '../../utils/animations';
import Button from '../common/Button';

const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => staggerReveal('.announcement-row'), 100);
    }
  }, [loading]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      await api.delete(`/announcements/${id}`);
      await fetchAnnouncements();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary">Announcements</h2>
        <Button variant="secondary" size="sm">Add Announcement</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Author</th>
              <th className="p-3 text-left">Published</th>
              <th className="p-3 text-left">Pinned</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className="announcement-row border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 font-medium">{a.title}</td>
                <td className="p-3">{a.User?.full_name || 'Unknown'}</td>
                <td className="p-3">{a.published ? '✅' : '❌'}</td>
                <td className="p-3">{a.pinned ? '📌' : ''}</td>
                <td className="p-3 text-center space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(a.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnouncementsManager;

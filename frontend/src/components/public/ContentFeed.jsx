import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { staggerReveal } from '../../utils/animations';

const ContentFeed = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content')
      .then(res => {
        setContent(res.data);
        setLoading(false);
        setTimeout(() => staggerReveal('.content-card'), 100);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Content Hub</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {content.map(item => (
          <Card key={item.id} className="content-card" title={item.title}>
            <p className="text-muted text-sm">{item.description}</p>
            <p className="text-muted text-xs">Type: {item.type} • {new Date(item.upload_date).toLocaleDateString()}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
              Watch
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentFeed;

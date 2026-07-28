'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { motion } from 'motion/react';

export default function ContentFeed() {
  const { data: content, isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: () => api.get('/content').then((res) => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Latest Content</h3>
      {content?.slice(0, 3).map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card title={item.title}>
            <p className="text-muted text-sm">{item.description}</p>
            <p className="text-muted text-xs">{item.type} • {new Date(item.upload_date).toLocaleDateString()}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Watch</a>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

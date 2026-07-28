'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { motion } from 'motion/react';

export default function TeamsList() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((res) => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {teams?.slice(0, 3).map((team, i) => (
        <motion.div
          key={team.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card title={team.name} description={`Game: ${team.game}`}>
            <p className="text-muted">Tag: {team.tag}</p>
            <p className="text-muted">Wins: {team.wins} | Losses: {team.losses}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

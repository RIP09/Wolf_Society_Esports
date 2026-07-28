'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { motion } from 'motion/react';

export default function ScheduleList() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches').then((res) => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Upcoming Matches</h3>
      {matches?.slice(0, 3).map((match, i) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card>
            <p><strong>{match.opponent}</strong> vs {match.team_name || 'TBD'}</p>
            <p className="text-muted text-sm">{match.game} • {match.match_date}</p>
            <span className={`text-xs px-2 py-1 rounded-full ${match.result === 'win' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              {match.result || 'upcoming'}
            </span>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

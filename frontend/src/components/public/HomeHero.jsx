'use client';

import { Button, Typography, Box } from '@mui/material';
import { motion } from 'motion/react';

export default function HomeHero() {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      sx={{ textAlign: 'center', py: 8 }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem', fontWeight: 900 }}>
        Wolf Society <span style={{ color: '#00F0FF' }}>Esports</span>
      </Typography>
      <Typography variant="h5" color="textSecondary" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
        Where champions rise. Join the pack and dominate the leaderboards.
      </Typography>
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" color="primary" size="large">
          Watch Live
        </Button>
        <Button variant="outlined" color="primary" size="large">
          Our Teams
        </Button>
      </Box>
    </Box>
  );
}

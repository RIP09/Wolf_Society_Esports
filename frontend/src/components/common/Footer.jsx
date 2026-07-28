import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 4, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <Typography variant="body2" color="textSecondary">
        © {new Date().getFullYear()} Wolf Society Esports. All rights reserved.
      </Typography>
    </Box>
  );
}

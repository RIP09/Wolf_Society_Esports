import { Paper, Typography } from '@mui/material';

export default function Card({ title, description, children }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
      {description && <Typography variant="body2" color="textSecondary" gutterBottom>{description}</Typography>}
      {children}
    </Paper>
  );
}

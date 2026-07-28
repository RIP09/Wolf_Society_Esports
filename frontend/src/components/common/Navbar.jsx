'use client';

import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';

export default function Navbar() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(8px)' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          <Link href="/" style={{ color: '#00F0FF', textDecoration: 'none' }}>
            Wolf<span style={{ color: '#fff' }}>Society</span>
          </Link>
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Link href="/" passHref><Button color="inherit">Home</Button></Link>
          <Link href="/teams" passHref><Button color="inherit">Teams</Button></Link>
          <Link href="/schedule" passHref><Button color="inherit">Schedule</Button></Link>
          <Link href="/content" passHref><Button color="inherit">Content</Button></Link>
          {user ? (
            <>
              <Link href="/dashboard" passHref><Button color="primary">Dashboard</Button></Link>
              <Button color="secondary" onClick={() => dispatch(logout())}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" passHref><Button color="inherit">Login</Button></Link>
              <Link href="/auth/register" passHref><Button variant="contained" color="primary">Register</Button></Link>
            </>
          )}
        </Box>
        <IconButton sx={{ display: { md: 'none' } }} color="inherit">
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Shield } from 'lucide-react';
import { pulseLive } from '../../utils/animations';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const liveDotRef = useRef(null);

  useEffect(() => {
    if (liveDotRef.current) {
      pulseLive(liveDotRef.current);
    }
  }, []);

  return (
    <nav className="bg-surface/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          Wolf<span className="text-white">Society</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-primary transition">Home</Link>
            <Link to="/teams" className="hover:text-primary transition">Teams</Link>
            <Link to="/schedule" className="hover:text-primary transition">Schedule</Link>
            <Link to="/content" className="hover:text-primary transition">Content</Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1 text-sm hover:text-primary transition">
                  <Shield size={16} /> Dashboard
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="flex items-center gap-1 text-sm hover:text-secondary transition"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm hover:text-primary transition">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </>
            )}
            <div ref={liveDotRef} className="w-3 h-3 rounded-full bg-secondary inline-block" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

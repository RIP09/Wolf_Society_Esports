import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'player' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form.email, form.password, form.full_name, form.role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 glass p-8 rounded-xl">
      <h2 className="text-2xl font-bold text-center text-primary mb-6">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary outline-none"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary outline-none"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary outline-none"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary outline-none"
        >
          <option value="player">Player</option>
          <option value="content_creator">Content Creator</option>
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" variant="primary" className="w-full">Register</Button>
      </form>
      <p className="text-center text-muted text-sm mt-4">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
      </p>
    </div>
  );
};

export default Register;

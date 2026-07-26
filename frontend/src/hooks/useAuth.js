import { useContext } from 'react';
import { AuthContext } from '../store';

export const useAuth = () => useContext(AuthContext);

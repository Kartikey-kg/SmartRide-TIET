// src/context/AuthContext.jsx
// Global authentication context — provides user state to the whole app

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { registerUser, getMe } from '../services/api';

// Create context
const AuthContext = createContext(null);

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// AuthProvider wraps the entire app
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // Firebase user
  const [profile, setProfile] = useState(null);   // Firestore user document
  const [loading, setLoading] = useState(true);

  // ─── Listen to Firebase auth state changes ────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const res = await getMe();
          setProfile(res.user);
        } catch {
          setProfile(null); // Not registered yet
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Sign Up with Email ────────────────────────────────────
  const signUpWithEmail = async (email, password, extraData) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    // Register profile in Firestore via backend
    const res = await registerUser(extraData);
    setProfile(res.user);
    return { user: firebaseUser, profile: res.user };
  };

  // ─── Sign In with Email ────────────────────────────────────
  const signInWithEmail = async (email, password) => {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    const res = await getMe();
    setProfile(res.user);
    return { user: firebaseUser, profile: res.user };
  };

  // ─── Sign In with Google ───────────────────────────────────
  const signInWithGoogle = async (role) => {
    const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
    let userProfile;
    try {
      const res = await getMe();
      userProfile = res.user;
      setProfile(res.user);
    } catch {
      // New Google user — register them
      const res = await registerUser({
        name:  firebaseUser.displayName,
        phone: '',
        role:  role || 'student',
      });
      userProfile = res.user;
      setProfile(res.user);
    }
    return { user: firebaseUser, profile: userProfile };
  };

  // ─── Sign Out ──────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    role: profile?.role || null,
    isStudent: profile?.role === 'student',
    isDriver:  profile?.role === 'driver',
    isAdmin:   profile?.role === 'admin',
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
    refreshProfile: async () => {
      const res = await getMe();
      setProfile(res.user);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        // Global loading screen while Firebase resolves auth on first load
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d1a',
          gap: '1.5rem',
        }}>
          <div style={{ fontSize: '3rem', animation: 'pulse 1.5s ease-in-out infinite' }}>🚌</div>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#6666aa', fontSize: '0.9rem' }}>Loading SmartRideTIET...</p>
          <style>{`
            @keyframes spin  { to { transform: rotate(360deg); } }
            @keyframes pulse {
              0%,100% { opacity:1; transform:scale(1); }
              50%      { opacity:0.6; transform:scale(0.9); }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

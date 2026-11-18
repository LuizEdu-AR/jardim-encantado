import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, configured, db } from '../services/firebase';
import { emailForId } from '../utils/helpers';
import { uploadImage } from '../services/uploadService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile(uid = auth?.currentUser?.uid) {
    if (!uid || !db) {
      setProfile(null);
      return null;
    }
    const snapshot = await getDoc(doc(db, 'users', uid));
    const data = snapshot.exists() ? { uid, ...snapshot.data() } : null;
    setProfile(data);
    return data;
  }

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);
      try {
        await refreshProfile(nextUser?.uid);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function register({ characterId, name, password, photo }) {
    const credential = await createUserWithEmailAndPassword(auth, emailForId(characterId), password);
    try {
      await setDoc(doc(db, 'users', credential.user.uid), {
        characterId: String(characterId).trim(),
        name: name.trim(),
        photo: photo || '',
        role: 'pending',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      await refreshProfile(credential.user.uid);
      if (photo) {
        try {
          const photoUrl = await uploadImage(photo);
          await updateDoc(doc(db, 'users', credential.user.uid), { photo: photoUrl });
          await refreshProfile(credential.user.uid);
        } catch (uploadError) {
          console.warn('Cadastro criado; foto não enviada:', uploadError);
        }
      }
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  }

  async function login(characterId, password) {
    await signInWithEmailAndPassword(auth, emailForId(characterId), password);
  }

  async function updateOwnProfile(changes) {
    await updateDoc(doc(db, 'users', user.uid), changes);
    await refreshProfile(user.uid);
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      configured,
      register,
      login,
      logout: () => signOut(auth),
      refreshProfile,
      updateOwnProfile,
      changePassword: (password) => updatePassword(auth.currentUser, password),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

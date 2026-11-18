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

  async function createPendingProfile(uid, characterId, name) {
    const cleanId = String(characterId).trim();
    const cleanName = String(name).trim();

    if (!/^\d+$/.test(cleanId) || !cleanName) {
      throw new Error('Informe um ID numérico e um nome válido.');
    }

    await setDoc(doc(db, 'users', uid), {
      characterId: cleanId,
      name: cleanName,
      photo: '',
      role: 'pending',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return refreshProfile(uid);
  }

  async function register({ characterId, name, password, photo }) {
    const cleanId = String(characterId).trim();
    const credential = await createUserWithEmailAndPassword(
      auth,
      emailForId(cleanId),
      password,
    );

    try {
      // Nunca gravar o objeto File no Firestore: somente uma URL de imagem.
      await createPendingProfile(credential.user.uid, cleanId, name);
    } catch (error) {
      // A conta do Authentication pode existir mesmo se o Firestore falhar.
      // Mantemos a sessão para permitir recuperação, sem afirmar que houve sucesso.
      throw new Error(
        `Conta de acesso criada, mas o perfil não foi salvo. ` +
        `Entre novamente com seu ID e senha para concluir o cadastro. ` +
        `Detalhes: ${error.message}`,
      );
    }

    if (photo) {
      try {
        const photoUrl = await uploadImage(photo);
        await updateDoc(doc(db, 'users', credential.user.uid), { photo: photoUrl });
        await refreshProfile(credential.user.uid);
      } catch (uploadError) {
        // Foto opcional: uma falha no Cloudinary não invalida o cadastro.
        console.warn('Cadastro salvo, mas foto não enviada:', uploadError);
      }
    }
  }

  async function recoverMissingProfile(name) {
    const currentUser = auth?.currentUser;
    const match = currentUser?.email?.match(/^(\d+)@jardim-encantado\.invalid$/);

    if (!currentUser || !match) {
      throw new Error('Entre com sua conta do Jardim Encantado para recuperar o cadastro.');
    }

    const existing = await getDoc(doc(db, 'users', currentUser.uid));
    if (existing.exists()) return refreshProfile(currentUser.uid);

    return createPendingProfile(currentUser.uid, match[1], name);
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
      recoverMissingProfile,
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

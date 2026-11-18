import admin from 'firebase-admin';

export function getAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('Credencial administrativa não configurada.');
    const credential = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(credential) });
  }
  return admin;
}

export async function authenticate(req) {
  const bearer = req.headers.authorization || '';
  if (!bearer.startsWith('Bearer ')) throw new Error('Token de autenticação ausente.');
  const sdk = getAdmin();
  const decoded = await sdk.auth().verifyIdToken(bearer.slice(7), true);
  const snapshot = await sdk.firestore().collection('users').doc(decoded.uid).get();
  const profile = snapshot.data();
  if (!profile || profile.status !== 'approved') throw new Error('Conta não autorizada.');
  return { uid: decoded.uid, profile, sdk };
}

export function adminAllowed(profile) {
  return profile.role === 'admin' || profile.role === 'dev';
}

export function reject(res, error) {
  return res.status(403).json({ error: error.message || 'Acesso negado.' });
}

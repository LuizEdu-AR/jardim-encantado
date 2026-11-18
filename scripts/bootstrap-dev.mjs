import admin from 'firebase-admin';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.error('Defina FIREBASE_SERVICE_ACCOUNT_JSON com o JSON da conta de serviço antes de executar.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const auth = admin.auth();
const db = admin.firestore();
const email = '194@jardim-encantado.invalid';
const rl = createInterface({ input, output });

try {
  const password = await rl.question('Defina a senha inicial do Dev (mínimo 6 caracteres): ');
  if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  let user;
  try {
    user = await auth.getUserByEmail(email);
    const existing = await db.collection('users').doc(user.uid).get();
    if (existing.exists && existing.data()?.role !== 'dev') throw new Error('O ID 194 já pertence a uma conta não-Dev. Verifique manualmente.');
    await auth.updateUser(user.uid, { password });
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    user = await auth.createUser({ email, password, displayName: 'Chico D. Wind' });
  }
  await db.collection('users').doc(user.uid).set({
    characterId: '194',
    name: 'Chico D. Wind',
    photo: '',
    role: 'dev',
    status: 'approved',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('Conta Dev configurada. ID 194.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rl.close();
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export async function listCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function addRecord(name, data) {
  return addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });
}

export async function editRecord(name, id, data) {
  return updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() });
}

export async function removeRecord(name, id) {
  return deleteDoc(doc(db, name, id));
}

export async function addUniqueActivity(data) {
  const normalized = data.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  const rawKey = new TextEncoder().encode(`${data.date}|${normalized}`);
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  const key = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const reference = doc(db, 'activities', key);

  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    if (existing.exists()) {
      throw new Error('Já existe uma atividade com esse nome nessa data.');
    }
    transaction.set(reference, { ...data, createdAt: serverTimestamp() });
  });
}

export async function getRecentRecords() {
  const snapshot = await getDocs(query(collection(db, 'activities'), orderBy('date', 'desc'), limit(100)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function getMonthRecords(start, end) {
  const snapshot = await getDocs(query(
    collection(db, 'activities'),
    where('date', '>=', start),
    where('date', '<=', end),
  ));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

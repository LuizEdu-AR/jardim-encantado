import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

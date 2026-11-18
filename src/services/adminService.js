import { auth } from './firebase';

export async function manageUser(action, targetUid, data = {}) {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch('/api/manage-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, targetUid, data }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Falha ao gerenciar usuário.');
  return result;
}

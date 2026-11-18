import { authenticate, adminAllowed, reject } from './_admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const { uid, profile, sdk } = await authenticate(req);
    if (!adminAllowed(profile)) throw new Error('Apenas administradores podem gerenciar usuários.');
    const { action, targetUid, data = {} } = req.body || {};
    if (!targetUid || typeof targetUid !== 'string') return res.status(400).json({ error: 'Usuário inválido.' });
    if (uid === targetUid) return res.status(400).json({ error: 'Use a página Perfil para editar sua própria conta.' });

    const reference = sdk.firestore().collection('users').doc(targetUid);
    const snapshot = await reference.get();
    if (!snapshot.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const target = snapshot.data();
    const protectedRole = ['admin', 'dev'].includes(target.role);
    if (target.role === 'dev') throw new Error('A conta de desenvolvedor é protegida.');
    if (protectedRole && profile.role !== 'dev') throw new Error('Somente o Dev pode gerenciar administradores.');

    if (action === 'approve') {
      if (target.status !== 'pending') throw new Error('Este usuário não está pendente.');
      await reference.update({ role: 'monitor', status: 'approved' });
    } else if (action === 'delete') {
      await sdk.auth().deleteUser(targetUid);
      await reference.delete();
    } else if (action === 'edit') {
      const updates = {};
      if (typeof data.name === 'string' && data.name.trim()) updates.name = data.name.trim();
      if (typeof data.photo === 'string') updates.photo = data.photo;
      if (data.role && ['monitor', 'admin'].includes(data.role)) {
        if (profile.role !== 'dev' && data.role === 'admin') throw new Error('Somente o Dev pode atribuir o cargo de administrador.');
        updates.role = data.role;
      }
      if (data.characterId && String(data.characterId) !== String(target.characterId)) {
        const nextId = String(data.characterId).trim();
        if (!/^\d+$/.test(nextId)) throw new Error('O ID deve ser numérico.');
        await sdk.auth().updateUser(targetUid, { email: `${nextId}@jardim-encantado.invalid` });
        updates.characterId = nextId;
      }
      await reference.update(updates);
    } else if (action === 'password') {
      if (typeof data.password !== 'string' || data.password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      await sdk.auth().updateUser(targetUid, { password: data.password });
      await sdk.auth().revokeRefreshTokens(targetUid);
    } else {
      return res.status(400).json({ error: 'Ação inválida.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    return reject(res, error);
  }
}

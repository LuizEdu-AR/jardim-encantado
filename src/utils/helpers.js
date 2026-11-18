export const emailForId = (id) => `${String(id).trim()}@jardim-encantado.invalid`;

export const isAdmin = (profile) => ['admin', 'dev'].includes(profile?.role);

export const formatDate = (value) => {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
};

export const todayLocal = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const roleLabel = (role) => ({
  dev: 'Desenvolvedor',
  admin: 'Administrador',
  monitor: 'Monitor',
  pending: 'Pendente',
})[role] || 'Pendente';

export const errorMessage = (error) => {
  const messages = {
    'auth/email-already-in-use': 'Este ID já possui cadastro.',
    'auth/invalid-credential': 'ID ou senha incorretos.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres (limitação do Firebase Authentication).',
    'permission-denied': 'Você não tem permissão para esta operação.',
  };
  return messages[error?.code] || error?.message || 'Não foi possível concluir a operação.';
};

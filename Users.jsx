import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Check, Pencil, Trash2, KeyRound } from 'lucide-react';
import { listCollection } from '../services/dataService';
import { manageUser } from '../services/adminService';
import { Confirm, Empty, Field, Modal } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage, roleLabel } from '../utils/helpers';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    try { setUsers(await listCollection('users')); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return { users, load, loading };
}

export function Approvals() {
  const { users, load } = useUsers();
  const [busy, setBusy] = useState(null);
  const pending = users.filter((item) => item.status === 'pending');

  async function approve(item) {
    setBusy(item.id);
    try { await manageUser('approve', item.id); toast.success(`${item.name} aprovado como monitor!`); load(); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(null); }
  }

  return <div className="page-stack"><div className="page-heading"><div><h1>Autorizações</h1><p>Novos cadastros aguardando aprovação.</p></div><span className="pill amber">{pending.length} pendente(s)</span></div><section className="panel">{pending.length ? <div className="table-wrap"><table><thead><tr><th>Nome</th><th>ID</th><th>Status</th><th>Ação</th></tr></thead><tbody>{pending.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.characterId}</td><td><span className="pill amber">Pendente</span></td><td><button className="button primary small" disabled={busy === item.id} onClick={() => approve(item)}><Check size={15} /> Autorizar como monitor</button></td></tr>)}</tbody></table></div> : <Empty text="Nenhuma autorização pendente." />}</section></div>;
}

export default function Users() {
  const { profile } = useAuth();
  const { users, load } = useUsers();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [form, setForm] = useState({});
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  function canManage(item) {
    return item.role !== 'dev' && (profile.role === 'dev' || item.role === 'monitor');
  }

  async function run(action, item, data = {}) {
    setBusy(true);
    try { await manageUser(action, item.id, data); toast.success('Operação realizada!'); setEditing(null); setDeleting(null); setResetting(null); load(); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return <div className="page-stack"><div className="page-heading"><div><h1>Usuários</h1><p>Gerencie os membros do Jardim Encantado.</p></div></div><section className="panel">{users.length ? <div className="table-wrap"><table><thead><tr><th>Nome</th><th>ID</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.characterId}</td><td>{roleLabel(item.role)}</td><td><span className={`pill ${item.status === 'approved' ? 'green' : 'amber'}`}>{item.status === 'approved' ? 'Autorizado' : 'Pendente'}</span></td><td><div className="table-actions">{canManage(item) && <><button className="icon-button" title="Editar" onClick={() => { setEditing(item); setForm({ name: item.name, characterId: item.characterId, role: item.role }); }}><Pencil size={17} /></button><button className="icon-button" title="Redefinir senha" onClick={() => { setResetting(item); setPassword(''); }}><KeyRound size={17} /></button><button className="icon-button danger-text" title="Excluir" onClick={() => setDeleting(item)}><Trash2 size={17} /></button></>}</div></td></tr>)}</tbody></table></div> : <Empty />}</section>
    {editing && <Modal title={`Editar ${editing.name}`} onClose={() => setEditing(null)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); run('edit', editing, form); }}><Field label="Nome"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="ID"><input required value={form.characterId} onChange={(event) => setForm({ ...form, characterId: event.target.value })} /></Field><Field label="Cargo"><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="monitor">Monitor</option>{profile.role === 'dev' && <option value="admin">Administrador</option>}</select></Field><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="button primary" disabled={busy}>Salvar</button></div></form></Modal>}
    {resetting && <Modal title={`Redefinir senha · ${resetting.name}`} onClose={() => setResetting(null)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); run('password', resetting, { password }); }}><Field label="Nova senha"><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></Field><div className="form-actions"><button type="button" className="button secondary" onClick={() => setResetting(null)}>Cancelar</button><button className="button primary" disabled={busy}>Redefinir senha</button></div></form></Modal>}
    {deleting && <Confirm message={`Excluir permanentemente a conta de ${deleting.name}?`} onClose={() => setDeleting(null)} onConfirm={() => run('delete', deleting)} />}
  </div>;
}

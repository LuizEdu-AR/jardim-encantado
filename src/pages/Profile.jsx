import { ImageInput } from '../components/Inputs';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Field } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../services/uploadService';
import { errorMessage, roleLabel } from '../utils/helpers';

export default function Profile() {
  const { profile, updateOwnProfile, changePassword } = useAuth();
  const [name, setName] = useState(profile.name);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const photo = file ? await uploadImage(file) : profile.photo;
      await updateOwnProfile({ name: name.trim(), photo });
      toast.success('Perfil atualizado!');
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (password !== confirm) return toast.error('As senhas não coincidem.');
    setBusy(true);
    try {
      await changePassword(password);
      setPassword('');
      setConfirm('');
      toast.success('Senha alterada!');
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return <div className="page-stack"><div className="page-heading"><div><h1>Meu perfil</h1><p>Atualize seus dados pessoais e sua senha.</p></div></div><div className="reports-grid"><section className="panel form-panel"><h2>Informações pessoais</h2><form className="form-stack" onSubmit={save}><div className="profile-summary">{profile.photo ? <img src={profile.photo} alt="Foto de perfil" /> : <img src="/logo-flor.png" alt="" />}<div><strong>{profile.name}</strong><p>{roleLabel(profile.role)} · ID {profile.characterId}</p></div></div><Field label="Nome"><input required value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="ID do personagem"><input value={profile.characterId} disabled /><small className="muted">Somente a administração pode alterar o ID.</small></Field><Field label="Foto de perfil" asLabel={false}><ImageInput value={file} onChange={setFile} existingImage={profile.photo} /></Field><button className="button primary" disabled={busy}>Salvar alterações</button></form></section><section className="panel form-panel"><h2>Alterar senha</h2><form className="form-stack" onSubmit={savePassword}><Field label="Nova senha"><input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></Field><Field label="Confirmar nova senha"><input required type="password" minLength={6} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></Field><button className="button primary" disabled={busy}>Atualizar senha</button><p className="muted">Por segurança, o Firebase pode exigir um login recente para alterar a senha.</p></form></section></div></div>;
}

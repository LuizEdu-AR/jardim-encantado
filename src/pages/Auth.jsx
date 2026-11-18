import { ImageInput } from '../components/Inputs';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Flower2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Field } from '../components/UI';
import { errorMessage } from '../utils/helpers';
import { Footer } from '../components/Layout';

export default function AuthPage({ register = false }) {
  const { user, profile, configured, login, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ characterId: '', name: '', password: '', confirm: '' });
  const [photo, setPhoto] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user && profile) return <Navigate to={profile.status === 'approved' ? '/' : '/aguardando'} replace />;

  async function submit(event) {
    event.preventDefault();
    if (register && data.password !== data.confirm) return toast.error('As senhas não coincidem.');
    if (register && data.password.length < 6) return toast.error('Informe uma senha de pelo menos 6 caracteres.');
    if (register && photo && (!photo.type.startsWith('image/') || photo.size > 5 * 1024 * 1024)) {
      return toast.error('Escolha uma imagem de até 5 MB.');
    }
    setBusy(true);
    try {
      if (register) {
        await createAccount({ ...data, photo });
        toast.success('Cadastro solicitado com sucesso!');
        navigate('/aguardando');
      } else {
        await login(data.characterId, data.password);
        toast.success('Bem-vindo ao Jardim Encantado!');
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-main">
        <section className="auth-intro">
          <img src="/logo-selo.png" alt="Jardim Encantado Rua 2" />
          <h1>Um cantinho especial para aprender e crescer.</h1>
          <p>Organização, carinho e cuidado em cada atividade do Jardim Encantado.</p>
        </section>
        <section className="auth-card">
          <div className="auth-mobile-brand"><img src="/logo-flor.png" alt="" /><strong>Jardim Encantado</strong></div>
          <h2>{register ? 'Criar uma conta' : 'Bem-vindo de volta'}</h2>
          <p>{register ? 'Preencha os dados para solicitar seu acesso.' : 'Entre com as credenciais do seu personagem.'}</p>
          {!configured && <div className="notice warning">Configure as variáveis do Firebase no arquivo .env para ativar o acesso.</div>}
          <form onSubmit={submit} className="form-stack">
            <Field label="ID do personagem"><input required inputMode="numeric" value={data.characterId} onChange={(event) => setData({ ...data, characterId: event.target.value })} placeholder="Ex.: 194" /></Field>
            {register && <Field label="Nome completo"><input required value={data.name} onChange={(event) => setData({ ...data, name: event.target.value })} placeholder="Nome do personagem" /></Field>}
            <Field label="Senha">
              <div className="password-wrap"><input required type={showPassword ? 'text' : 'password'} value={data.password} onChange={(event) => setData({ ...data, password: event.target.value })} placeholder="Sua senha" /><button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar senha">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </Field>
            {register && <>
              <Field label="Confirmar senha"><input required type={showPassword ? 'text' : 'password'} value={data.confirm} onChange={(event) => setData({ ...data, confirm: event.target.value })} placeholder="Repita sua senha" /></Field>
              <Field label="Foto de perfil"><ImageInput value={photo} onChange={setPhoto} existingImage={''} /><small className="muted">A foto será adicionada ao perfil após a aprovação.</small></Field>
            </>}
            <button className="button primary full" disabled={busy || !configured}>{busy ? 'Aguarde...' : register ? 'Solicitar cadastro' : 'Entrar no sistema'}</button>
          </form>
          <div className="auth-switch">{register ? 'Já possui cadastro?' : 'Ainda não possui cadastro?'} <Link to={register ? '/login' : '/cadastro'}>{register ? 'Fazer login' : 'Criar conta'}</Link></div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export function PendingPage() {
  const { profile, logout, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="auth-page pending-page">
      <section className="auth-card pending-card">
        <img src="/logo-flor.png" className="pending-logo" alt="Jardim Encantado" />
        <span className="pill amber">Aguardando aprovação</span>
        <h2>Seu cadastro está em análise!</h2>
        <p>Olá, {profile?.name}! Aguarde enquanto a administração do Jardim Encantado autoriza seu acesso ao sistema.</p>
        <p>Em caso de dúvidas, entre em contato com a administração do Jardim Encantado.</p>
        <div className="form-actions centered">
          <button className="button secondary" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              const updated = await refreshProfile();
              if (updated?.status === 'approved') navigate('/');
              else toast('Seu cadastro ainda está pendente.');
            } catch (error) { toast.error(errorMessage(error)); }
            finally { setBusy(false); }
          }}>Verificar aprovação</button>
          <button className="button primary" onClick={logout}>Sair da conta</button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

/** Recupera uma conta criada no Authentication sem documento no Firestore. */
export function MissingProfilePage() {
  const { recoverMissingProfile, logout } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);

    try {
      await recoverMissingProfile(name);
      toast.success('Cadastro recuperado! Aguarde a aprovação.');
      navigate('/aguardando', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page pending-page">
      <section className="auth-card pending-card">
        <img src="/logo-flor.png" className="pending-logo" alt="Jardim Encantado" />
        <h2>Concluir cadastro</h2>
        <p>Sua conta de acesso existe, mas o perfil ainda não foi salvo. Informe seu nome para enviar a solicitação de aprovação.</p>
        <form className="form-stack" onSubmit={submit}>
          <Field label="Nome completo">
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do personagem"
            />
          </Field>
          <button className="button primary full" disabled={busy || !name.trim()}>
            {busy ? 'Salvando...' : 'Concluir cadastro'}
          </button>
        </form>
        <div className="form-actions centered">
          <button className="button secondary" type="button" onClick={logout}>Sair da conta</button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

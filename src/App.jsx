import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthPage, { MissingProfilePage, PendingPage } from './pages/Auth';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import { Enrollment } from './pages/Students';
import Students from './pages/Students';
import Records from './pages/Records';
import Users, { Approvals } from './pages/Users';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import { isAdmin } from './utils/helpers';

function Gate({ children, admin = false }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><img src="/logo-flor.png" alt="" /><span>Carregando Jardim Encantado...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/completar-cadastro" replace />;
  if (profile.status !== 'approved') return <Navigate to="/aguardando" replace />;
  if (admin && !isAdmin(profile)) return <Navigate to="/" replace />;
  return children;
}

function PendingGate() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/completar-cadastro" replace />;
  if (profile?.status === 'approved') return <Navigate to="/" replace />;
  return <PendingPage />;
}

function MissingProfileGate() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to={profile.status === 'approved' ? '/' : '/aguardando'} replace />;
  return <MissingProfilePage />;
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/cadastro" element={<AuthPage register />} />
    <Route path="/completar-cadastro" element={<MissingProfileGate />} />
    <Route path="/aguardando" element={<PendingGate />} />
    <Route element={<Gate><Layout /></Gate>}>
      <Route path="/" element={<Home />} />
      <Route path="/frequencia" element={<Attendance />} />
      <Route path="/matricula" element={<Enrollment />} />
      <Route path="/alunos" element={<Students />} />
      <Route path="/registros" element={<Records />} />
      <Route path="/perfil" element={<Profile />} />
    </Route>
    <Route element={<Gate admin><Layout /></Gate>}>
      <Route path="/usuarios" element={<Users />} />
      <Route path="/categorias" element={<Categories />} />
      <Route path="/autorizacoes" element={<Approvals />} />
      <Route path="/relatorios" element={<Reports />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter><Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '12px', background: '#fff', color: '#21434a', border: '1px solid #e2ebe6' } }} /></AuthProvider>;
}

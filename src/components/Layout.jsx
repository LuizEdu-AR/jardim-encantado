import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Flower2,
  GraduationCap,
  House,
  Layers3,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
  Github,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, roleLabel } from '../utils/helpers';

const navigation = [
  { to: '/', label: 'Início', icon: House },
  { to: '/frequencia', label: 'Realizar frequência', icon: CalendarDays },
  { to: '/matricula', label: 'Realizar matrícula', icon: GraduationCap },
  { to: '/alunos', label: 'Ver alunos', icon: BookOpenCheck },
  { to: '/registros', label: 'Ver registros', icon: ClipboardList },
  { to: '/usuarios', label: 'Ver usuários', icon: Users, admin: true },
  { to: '/categorias', label: 'Ver categorias', icon: Layers3, admin: true },
  { to: '/autorizacoes', label: 'Autorização', icon: ShieldCheck, admin: true },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined, admin: true },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
];

export function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Jardim Encantado. Todos os direitos reservados.</span>
      <span>Desenvolvido por Luiz Eduardo de Almeida Rodrigues <a href="https://github.com/LuizEdu-AR/" target="_blank" rel="noreferrer" aria-label="GitHub do desenvolvedor"><Github size={17} /></a></span>
    </footer>
  );
}

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo-flor.png" alt="Flor Jardim Encantado" />
          <div><strong>Jardim Encantado</strong><small>Rua 2 · Gestão escolar</small></div>
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <nav className="nav-list" aria-label="Navegação principal">
          {navigation.filter((item) => !item.admin || isAdmin(profile)).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />{item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-user">
          {profile?.photo ? <img src={profile.photo} alt="" /> : <span className="avatar-placeholder"><Flower2 size={21} /></span>}
          <div><strong>{profile?.name}</strong><small>{roleLabel(profile?.role)} · ID {profile?.characterId}</small></div>
          <button className="icon-button" aria-label="Sair" title="Sair" onClick={async () => { await logout(); navigate('/login'); }}><LogOut size={18} /></button>
        </div>
      </aside>
      {menuOpen && <button className="mobile-overlay" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <div className="app-content">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button>
          <span>Jardim Encantado <span className="topbar-divider">/</span> Sistema de Gestão</span>
          <span className="topbar-badge">Rua 2</span>
        </header>
        <main className="main-content"><Outlet /></main>
        <Footer />
      </div>
    </div>
  );
}

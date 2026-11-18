import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, GraduationCap, ClipboardList, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listCollection } from '../services/dataService';
import { isAdmin } from '../utils/helpers';

export default function Home() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, activities: 0, categories: 0 });

  useEffect(() => {
    Promise.all(['students', 'activities', 'categories'].map(listCollection))
      .then(([students, activities, categories]) => setStats({
        students: students.length,
        activities: activities.length,
        categories: categories.length,
      }))
      .catch(() => {});
  }, []);

  const shortcuts = [
    { to: '/frequencia', label: 'Realizar frequência', description: 'Registre a presença dos alunos', icon: CalendarDays },
    { to: '/matricula', label: 'Realizar matrícula', description: 'Cadastre uma nova criança', icon: GraduationCap },
    { to: '/registros', label: 'Ver registros', description: 'Consulte as atividades realizadas', icon: ClipboardList },
    ...(isAdmin(profile) ? [{ to: '/autorizacoes', label: 'Autorizações', description: 'Gerencie novos cadastros', icon: Users }] : []),
  ];

  return (
    <div className="page-stack">
      <div className="welcome-banner">
        <div><span className="eyebrow">Jardim Encantado · Rua 2</span><h1>Olá, {profile?.name?.split(' ')[0]}!</h1><p>Bem-vindo ao seu espaço de gestão. Que seja um dia encantador!</p></div>
        <img src="/logo-flor.png" alt="" />
      </div>
      <div className="stat-grid">
        <article className="stat-card"><span>Alunos matriculados</span><strong>{stats.students}</strong></article>
        <article className="stat-card"><span>Atividades registradas</span><strong>{stats.activities}</strong></article>
        <article className="stat-card"><span>Categorias disponíveis</span><strong>{stats.categories}</strong></article>
      </div>
      <div className="section-heading"><div><h2>Acesso rápido</h2><p>O que você deseja fazer hoje?</p></div></div>
      <div className="shortcut-grid">{shortcuts.map(({ to, label, description, icon: Icon }) => (
        <Link className="shortcut-card" to={to} key={to}><span className="shortcut-icon"><Icon size={22} /></span><strong>{label}</strong><small>{description}</small></Link>
      ))}</div>
    </div>
  );
}

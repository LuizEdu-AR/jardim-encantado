import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { listCollection } from '../services/dataService';
import { Empty, Field } from '../components/UI';
import { errorMessage, todayLocal } from '../utils/helpers';

export default function Reports() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [period, setPeriod] = useState('month');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState(todayLocal());
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all(['students', 'users', 'activities'].map(listCollection))
      .then(([studentData, userData, activityData]) => { setStudents(studentData); setUsers(userData); setActivities(activityData); })
      .catch((error) => toast.error(errorMessage(error)));
  }, []);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (period === 'week' ? 7 : 30));
  const cutoffString = new Date(cutoff.getTime() - cutoff.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const filtered = activities.filter((item) => period === 'custom' ? (!start || item.date >= start) && (!end || item.date <= end) : item.date >= cutoffString && item.date <= todayLocal());
  const matching = (name) => name.toLowerCase().includes(search.toLowerCase());
  const monitors = users.filter((item) => ['monitor', 'admin', 'dev'].includes(item.role));

  return <div className="page-stack"><div className="page-heading"><div><h1>Relatórios</h1><p>Acompanhe presenças e atividades registradas.</p></div></div><section className="panel"><div className="report-filters"><Field label="Período"><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="week">Última semana</option><option value="month">Último mês</option><option value="custom">Personalizado</option></select></Field>{period === 'custom' && <><Field label="Início"><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></Field><Field label="Fim"><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></Field></>}<Field label="Pesquisar"><input placeholder="Nome de aluno ou monitor" value={search} onChange={(event) => setSearch(event.target.value)} /></Field></div></section><div className="reports-grid"><section className="panel"><h2>Presenças por aluno</h2>{students.filter((item) => matching(item.name)).length ? <div className="table-wrap"><table><thead><tr><th>Aluno</th><th>Presenças</th></tr></thead><tbody>{students.filter((item) => matching(item.name)).map((student) => <tr key={student.id}><td>{student.name}</td><td>{filtered.filter((activity) => activity.attendance?.[student.id] === true).length}</td></tr>)}</tbody></table></div> : <Empty />}</section><section className="panel"><h2>Registros por monitor</h2>{monitors.filter((item) => matching(item.name)).length ? <div className="table-wrap"><table><thead><tr><th>Monitor</th><th>Registros</th></tr></thead><tbody>{monitors.filter((item) => matching(item.name)).map((monitor) => <tr key={monitor.id}><td>{monitor.name}</td><td>{filtered.filter((activity) => activity.creatorUid === monitor.id).length}</td></tr>)}</tbody></table></div> : <Empty />}</section></div></div>;
}

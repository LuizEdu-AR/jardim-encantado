import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Pencil, Search, Trash2, RotateCcw } from 'lucide-react';
import { getRecentRecords, listCollection, removeRecord } from '../services/dataService';
import ActivityEditor from '../components/ActivityEditor';
import { DateInput, SelectInput } from '../components/Inputs';
import { Field } from '../components/UI';
import { Confirm, Empty } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { compareNames, errorMessage, formatDate, isAdmin, todayLocal } from '../utils/helpers';

export default function Records() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('all');
  const [order, setOrder] = useState('recent');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);

  async function load() {
    try {
      const [records, cats] = await Promise.all([getRecentRecords(), listCollection('categories')]);
      setItems(records);
      setCategories(cats);
    } catch (error) { toast.error(errorMessage(error)); }
  }
  useEffect(() => { load(); }, []);
  const today = todayLocal();
  const todayDate = new Date(`${today}T12:00:00`);
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - todayDate.getDay());
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const monthStart = `${today.slice(0, 7)}-01`;
  const matchesPeriod = (date) => {
    if (!date) return false;
    if (period === 'all') return true;
    if (period === 'today') return date === today;
    if (period === 'week') return date >= dateKey(weekStart) && date <= dateKey(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6));
    if (period === 'month') return date >= monthStart && date <= dateKey(new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0));
    return (!start || date >= start) && (!end || date <= end);
  };
  const queryText = search.trim().toLocaleLowerCase('pt-BR');
  const filtered = items.filter((item) => {
    const matchesSearch = `${item.name || ''} ${item.responsible || ''}`.toLocaleLowerCase('pt-BR').includes(queryText);
    return matchesSearch && (categoryFilter === 'all' || item.categoryId === categoryFilter)
      && (status === 'all' || (status === 'pending' ? item.attendanceStatus === 'pending' : item.attendanceStatus !== 'pending'))
      && matchesPeriod(item.date);
  }).sort((a, b) => {
    if (order === 'az') return compareNames(a.name, b.name) || String(b.date || '').localeCompare(String(a.date || ''));
    if (order === 'za') return compareNames(b.name, a.name) || String(b.date || '').localeCompare(String(a.date || ''));
    return order === 'oldest' ? String(a.date || '').localeCompare(String(b.date || '')) : String(b.date || '').localeCompare(String(a.date || ''));
  });
  const resetFilters = () => {
    setSearch(''); setCategoryFilter('all'); setPeriod('all'); setStatus('all');
    setOrder('recent'); setStart(''); setEnd('');
  };

  const canEdit = ['dev', 'admin', 'monitor'].includes(profile?.role);
  const canDelete = isAdmin(profile);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Registros</h1>
          <p>Histórico das atividades e frequências realizadas.</p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar atividade ou monitor..."
            />
          </div>
        </div>

        <div className="records-filters">
          <Field label="Categoria"><SelectInput value={categoryFilter} onChange={setCategoryFilter} options={[{ value: 'all', label: 'Todas as categorias' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} /></Field>
          <Field label="Período"><SelectInput value={period} onChange={setPeriod} options={[{ value: 'all', label: 'Todas as datas' }, { value: 'today', label: 'Hoje' }, { value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mês' }, { value: 'custom', label: 'Personalizado' }]} /></Field>
          <Field label="Frequência"><SelectInput value={status} onChange={setStatus} options={[{ value: 'all', label: 'Todas' }, { value: 'pending', label: 'Pendente' }, { value: 'completed', label: 'Concluída' }]} /></Field>
          <Field label="Ordenação"><SelectInput value={order} onChange={setOrder} options={[{ value: 'recent', label: 'Mais recentes' }, { value: 'oldest', label: 'Mais antigas' }, { value: 'az', label: 'Nome (A–Z)' }, { value: 'za', label: 'Nome (Z–A)' }]} /></Field>
        </div>
        {period === 'custom' && <div className="records-custom-dates">
          <Field label="Data inicial"><DateInput value={start} onChange={setStart} /></Field>
          <Field label="Data final"><DateInput value={end} onChange={setEnd} /></Field>
        </div>}
        <div className="records-filter-footer">
          <span>Exibindo {filtered.length} de {items.length} registros</span>
          <button type="button" className="records-clear-button" onClick={resetFilters}><RotateCcw size={15} /> Limpar filtros</button>
        </div>

        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Atividade</th>
                  <th>Categoria</th>
                  <th>Responsável</th>
                  <th>Presenças</th><th>Frequência</th>
                  {canEdit && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td><strong>{item.name}</strong></td>
                    <td>{categories.find((category) => category.id === item.categoryId)?.name || '—'}</td>
                    <td>{item.responsible}</td>
                    <td>{item.attendanceStatus === 'pending' ? '—' : Object.values(item.attendance || {}).filter(Boolean).length}</td><td><span className={`frequency-status ${item.attendanceStatus === 'pending' ? 'pending' : 'completed'}`}>{item.attendanceStatus === 'pending' ? '◷ Pendente' : '✓ Concluída'}</span></td>
                    {canEdit && (
                      <td>
                        <button
                          className="icon-button"
                          aria-label="Editar registro"
                          title={item.attendanceStatus === 'pending' ? 'Registrar frequência' : 'Editar registro'}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil size={17} />
                        </button>
                        {canDelete && (
                          <button
                            className="icon-button danger-text"
                            aria-label="Excluir registro"
                            title="Excluir registro"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Nenhum registro encontrado." />
        )}
      </section>

      {canEdit && editing && (
        <ActivityEditor
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      {canDelete && deleting && (
        <Confirm
          message={`Excluir o registro ${deleting.name}?`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await removeRecord('activities', deleting.id);
            toast.success('Registro excluído.');
            load();
          }}
        />
      )}
    </div>
  );
}

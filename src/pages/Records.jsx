import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { getRecentRecords, listCollection, removeRecord } from '../services/dataService';
import ActivityEditor from '../components/ActivityEditor';
import { Confirm, Empty } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage, formatDate, isAdmin } from '../utils/helpers';

export default function Records() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
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
  const filtered = items.filter((item) => `${item.name} ${item.date} ${item.responsible} ${item.creatorName} ${categories.find((category) => category.id === item.categoryId)?.name || ''}`.toLowerCase().includes(search.toLowerCase()));

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
              placeholder="Buscar atividade, data, tipo ou monitor..."
            />
          </div>
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
                  <th>Presenças</th>
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
                    <td>{Object.values(item.attendance || {}).filter(Boolean).length}</td>
                    {canEdit && (
                      <td>
                        <button
                          className="icon-button"
                          aria-label="Editar registro"
                          title="Editar registro"
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LayoutGrid, List, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { addRecord, editRecord, listCollection, removeRecord } from '../services/dataService';
import { Confirm, Empty, Field, Modal } from '../components/UI';
import { errorMessage } from '../utils/helpers';
import { uploadImage } from '../services/uploadService';

const blankStudent = () => ({ characterId: '', name: '', photo: '', guardians: [{ name: '', characterId: '' }] });

export function StudentForm({ student, onSaved, onCancel }) {
  const [form, setForm] = useState(student || blankStudent());
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  function changeGuardian(index, field, value) {
    const guardians = form.guardians.map((guardian, i) => i === index ? { ...guardian, [field]: value } : guardian);
    setForm({ ...form, guardians });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const photo = file ? await uploadImage(file) : form.photo;
      const data = {
        characterId: form.characterId.trim(),
        name: form.name.trim(),
        photo,
        guardians: form.guardians.map(({ name, characterId }) => ({ name: name.trim(), characterId: characterId.trim() })),
      };
      if (student?.id) await editRecord('students', student.id, data);
      else await addRecord('students', data);
      toast.success(student?.id ? 'Aluno atualizado!' : 'Matrícula realizada!');
      onSaved();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="form-stack">
      <div className="form-grid">
        <Field label="Nome do aluno"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome completo" /></Field>
        <Field label="ID do aluno"><input required value={form.characterId} onChange={(event) => setForm({ ...form, characterId: event.target.value })} placeholder="ID no RP" /></Field>
      </div>
      <Field label="Foto do aluno"><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></Field>
      <div className="section-heading compact"><h3>Responsáveis</h3><button className="button subtle" type="button" onClick={() => setForm({ ...form, guardians: [...form.guardians, { name: '', characterId: '' }] })}><Plus size={15} /> Adicionar responsável</button></div>
      {form.guardians.map((guardian, index) => <div className="guardian-row" key={index}>
        <Field label={`Nome do responsável ${index + 1}`}><input required value={guardian.name} onChange={(event) => changeGuardian(index, 'name', event.target.value)} /></Field>
        <Field label="ID do responsável"><input required value={guardian.characterId} onChange={(event) => changeGuardian(index, 'characterId', event.target.value)} /></Field>
        {form.guardians.length > 1 && <button type="button" className="icon-button danger-text" aria-label="Remover responsável" onClick={() => setForm({ ...form, guardians: form.guardians.filter((_, i) => i !== index) })}><Trash2 size={17} /></button>}
      </div>)}
      <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? 'Salvando...' : student?.id ? 'Salvar alterações' : 'Realizar matrícula'}</button></div>
    </form>
  );
}

export function Enrollment() {
  const navigate = useNavigate();
  return <div className="page-stack"><div className="page-heading"><div><h1>Realizar matrícula</h1><p>Cadastre uma criança e seus responsáveis.</p></div></div><section className="panel form-panel"><StudentForm onCancel={() => navigate('/alunos')} onSaved={() => navigate('/alunos')} /></section></div>;
}

export default function Students() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    try { setItems(await listCollection('students')); }
    catch (error) { toast.error(errorMessage(error)); }
  }
  useEffect(() => { load(); }, []);
  const filtered = items.filter((item) => `${item.name} ${item.characterId}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="page-stack">
    <div className="page-heading"><div><h1>Alunos</h1><p>Consulte e gerencie os alunos matriculados.</p></div><button className="button primary" onClick={() => setEditing(blankStudent())}><Plus size={17} /> Novo aluno</button></div>
    <section className="panel">
      <div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Buscar por nome ou ID..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="segmented"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="Lista"><List size={18} /></button><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grade"><LayoutGrid size={18} /></button></div></div>
      {!filtered.length ? <Empty text="Nenhum aluno encontrado." /> : view === 'list' ? <div className="table-wrap"><table><thead><tr><th>Nome</th><th>ID</th><th>Responsáveis</th><th>Ações</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.characterId}</td><td>{(item.guardians || []).map((guardian) => guardian.name).join(', ')}</td><td><div className="table-actions"><button className="icon-button" aria-label="Editar" onClick={() => setEditing(item)}><Pencil size={17} /></button><button className="icon-button danger-text" aria-label="Excluir" onClick={() => setDeleting(item)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div> : <div className="student-grid">{filtered.map((item) => <article className="student-card" key={item.id}>{item.photo ? <img src={item.photo} alt="" /> : <div className="student-photo-placeholder"><UserRound size={32} /></div>}<h3>{item.name}</h3><p>ID {item.characterId}</p><div className="table-actions"><button className="button subtle" onClick={() => setEditing(item)}>Editar</button><button className="button subtle danger-text" onClick={() => setDeleting(item)}>Excluir</button></div></article>)}</div>}
    </section>
    {editing && <Modal title={editing.id ? 'Editar aluno' : 'Novo aluno'} wide onClose={() => setEditing(null)}><StudentForm student={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} /></Modal>}
    {deleting && <Confirm message={`Deseja excluir o aluno ${deleting.name}? Esta ação não pode ser desfeita.`} onClose={() => setDeleting(null)} onConfirm={async () => { await removeRecord('students', deleting.id); toast.success('Aluno excluído.'); load(); }} />}
  </div>;
}

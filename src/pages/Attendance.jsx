import { SelectInput, TimeInput, DateInput } from '../components/Inputs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react';
import { addUniqueActivity, editRecord, getMonthRecords, listCollection } from '../services/dataService';
import { Field, Modal, Empty } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { compareNames, errorMessage, formatDate, isAdmin, todayLocal } from '../utils/helpers';

function monthBounds(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
  return [start, end];
}

export default function Attendance() {
  const { user, profile } = useAuth();
  const [month, setMonth] = useState(() => new Date());
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', categoryId: '', responsible: '', startTime: '14:00', endTime: '15:00', attendance: {} });
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [start, end] = monthBounds(month);
      const [records, categoryData, studentData] = await Promise.all([
        getMonthRecords(start, end), listCollection('categories'), listCollection('students'),
      ]);
      setActivities(records);
      setCategories(categoryData);
      setStudents([...studentData].sort((a, b) => compareNames(a.name, b.name)));
    } catch (error) { toast.error(errorMessage(error)); }
  }
  useEffect(() => { load(); }, [month]);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1).getDay();
    const total = new Date(year, m + 1, 0).getDate();
    const count = Math.ceil((first + total) / 7) * 7;
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(year, m, index - first + 1);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return { key: local.toISOString().slice(0, 10), number: date.getDate(), current: date.getMonth() === m };
    });
  }, [month]);

  function startCreate(date, record = null) {
    setSelectedDate(date);
    setEditingId(record?.id || null);
    setStep(1);
    setViewing(null);
    setForm(record ? {
      name: record.name,
      categoryId: record.categoryId,
      responsible: record.responsible,
      startTime: record.startTime,
      endTime: record.endTime,
      attendance: record.attendance || {},
    } : { name: '', categoryId: categories[0]?.id || '', responsible: profile.name, startTime: '14:00', endTime: '15:00', attendance: {} });
  }

  function normalizeActivityName(name) {
    return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  }

  async function ensureUniqueActivity() {
    const sameDate = await getMonthRecords(selectedDate, selectedDate);
    const duplicate = sameDate.some((activity) =>
      activity.id !== editingId &&
      normalizeActivityName(activity.name) === normalizeActivityName(form.name)
    );
    if (duplicate) throw new Error('Já existe uma atividade com esse nome nessa data.');
  }

  async function save() {
    setBusy(true);
    try {
      await ensureUniqueActivity();
      const data = {
        ...form,
        date: selectedDate,
        creatorUid: editingId ? activities.find((item) => item.id === editingId)?.creatorUid : user.uid,
        creatorName: editingId ? activities.find((item) => item.id === editingId)?.creatorName : profile.name,
      };
      if (editingId) await editRecord('activities', editingId, data);
      else await addUniqueActivity(data);
      toast.success('Frequência registrada com sucesso!');
      setSelectedDate(null);
      await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }

  const counts = Object.fromEntries(categories.map((category) => [category.id, activities.filter((item) => item.categoryId === category.id).length]));

  return <div className="page-stack">
    <div className="page-heading"><div><h1>Realizar frequência</h1><p>Organize atividades e registre a presença das crianças.</p></div><button className="button primary" onClick={() => startCreate(todayLocal())}><Plus size={17} /> Nova atividade</button></div>
    <div className="calendar-layout">
      <aside className="panel calendar-aside">
        <div className="aside-stats"><div><small>Atividades no mês</small><strong>{activities.length}</strong></div><div><small>Categorias</small><strong>{categories.length}</strong></div></div>
        <h3>Categorias</h3>
        {categories.length ? categories.map((category) => <div className="calendar-category" key={category.id}><span className="color-dot" style={{ background: category.color }} /><span>{category.name}</span><span className="count">{counts[category.id]}</span></div>) : <p className="muted">Nenhuma categoria cadastrada. Peça à administração para criar uma.</p>}
      </aside>
      <section className="panel calendar-panel">
        <div className="calendar-top"><div className="calendar-title"><button className="icon-button bordered" aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><button className="icon-button bordered" aria-label="Próximo mês" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button><h2>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2></div><button className="button subtle" onClick={() => setMonth(new Date())}>Hoje</button></div>
        <div className="calendar-grid"><div className="calendar-weekdays">{['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{days.map((day) => {
          const dayActivities = activities.filter((item) => item.date === day.key);
          return <div className={`calendar-day ${day.current ? '' : 'outside'} ${day.key === todayLocal() ? 'today' : ''}`} key={day.key}>
            <button className="day-number" onClick={() => startCreate(day.key)} title="Registrar atividade">{day.number}</button>
            <div className="day-events">{dayActivities.map((activity) => {
              const color = categories.find((category) => category.id === activity.categoryId)?.color || '#80bfb2';
              return <button key={activity.id} className="calendar-event" style={{ borderLeftColor: color, backgroundColor: `${color}19` }} title={activity.name} onClick={() => setViewing(activity)}>{activity.name}</button>;
            })}</div>
          </div>;
        })}</div></div>
      </section>
    </div>
    {viewing && <Modal title="Detalhes da atividade" onClose={() => setViewing(null)}>
      <div className="details-list"><p><strong>Atividade:</strong> {viewing.name}</p><p><strong>Data:</strong> {formatDate(viewing.date)}</p><p><strong>Categoria:</strong> {categories.find((category) => category.id === viewing.categoryId)?.name || '—'}</p><p><strong>Responsável:</strong> {viewing.responsible}</p><p><strong>Horário:</strong> {viewing.startTime} às {viewing.endTime}</p><p><strong>Presenças:</strong> {Object.values(viewing.attendance || {}).filter(Boolean).length}</p></div>
      {isAdmin(profile) && <div className="form-actions"><button className="button primary" onClick={() => startCreate(viewing.date, viewing)}>Editar registro</button></div>}
    </Modal>}
    {selectedDate && <Modal title={editingId ? 'Editar frequência' : `Registrar aula · ${formatDate(selectedDate)}`} wide onClose={() => setSelectedDate(null)}>
      {step === 1 ? <form className="form-stack" onSubmit={async (event) => {
        event.preventDefault();
        if (!form.categoryId) return toast.error('Cadastre uma categoria antes de continuar.');
        if (!form.name.trim()) return toast.error('Informe o nome da atividade.');
        if (form.endTime <= form.startTime) return toast.error('O horário de término deve ser posterior ao início.');
        try {
          await ensureUniqueActivity();
          setStep(2);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}>
        <Field label="Data da atividade"><DateInput value={selectedDate} onChange={setSelectedDate} /></Field>
        <Field label="Nome da atividade"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Oficina de pintura" /></Field>
        <div className="form-grid"><Field label="Tipo de atividade"><SelectInput required value={form.categoryId} onChange={(categoryId) => setForm({ ...form, categoryId })} options={categories.map((category) => ({ value: category.id, label: category.name }))} /></Field><Field label="Responsável"><input required value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} /></Field></div>
        <div className="form-grid"><Field label="Horário de início"><TimeInput value={form.startTime} onChange={(startTime) => setForm({ ...form, startTime })} /></Field><Field label="Horário de término"><TimeInput value={form.endTime} onChange={(endTime) => setForm({ ...form, endTime })} /></Field></div>
        <div className="form-actions"><button type="button" className="button secondary" onClick={() => setSelectedDate(null)}>Cancelar</button><button className="button primary">Próximo: presenças</button></div>
      </form> : <div className="form-stack">
        <div className="section-heading compact"><div><h3>Presença dos alunos</h3><p>{students.length} aluno(s) matriculado(s)</p></div><div className="table-actions"><button className="button subtle" onClick={() => setForm({ ...form, attendance: Object.fromEntries(students.map((student) => [student.id, true])) })}>Presença em todos</button><button className="button subtle" onClick={() => setForm({ ...form, attendance: Object.fromEntries(students.map((student) => [student.id, false])) })}>Ausência em todos</button></div></div>
        {students.length ? <div className="attendance-list">{students.map((student) => <div className="attendance-row" key={student.id}><div><strong>{student.name}</strong><small>ID {student.characterId}</small></div><div className="attendance-buttons"><button className={`attendance-choice ${form.attendance[student.id] === true ? 'present' : ''}`} aria-label={`Presente: ${student.name}`} onClick={() => setForm({ ...form, attendance: { ...form.attendance, [student.id]: true } })}><Check size={18} /></button><button className={`attendance-choice ${form.attendance[student.id] === false ? 'absent' : ''}`} aria-label={`Ausente: ${student.name}`} onClick={() => setForm({ ...form, attendance: { ...form.attendance, [student.id]: false } })}><X size={18} /></button></div></div>)}</div> : <Empty text="Cadastre alunos antes de registrar a frequência." />}
        <div className="form-actions"><button className="button secondary" onClick={() => setStep(1)}>Voltar</button><button className="button primary" disabled={busy || !students.length || students.some((student) => typeof form.attendance[student.id] !== 'boolean')} onClick={save}>{busy ? 'Salvando...' : 'Finalizar registro'}</button></div>
      </div>}
    </Modal>}
  </div>;
}

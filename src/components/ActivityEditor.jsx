import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Check, Search, X } from 'lucide-react';
import { DateInput, SelectInput, TimeInput } from './Inputs';
import { useAuth } from '../contexts/AuthContext';
import { Empty, Field, Modal } from './UI';
import { editRecord, getMonthRecords, listCollection } from '../services/dataService';
import { compareNames, errorMessage, isAdmin } from '../utils/helpers';

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
const normalizeSearch = (value) => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function ActivityEditor({ record, onClose, onSaved }) {
  const { user, profile } = useAuth();
  const [monitors, setMonitors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    date: record.date,
    name: record.name || '',
    categoryId: record.categoryId || '',
    responsible: record.responsible || '',
    startTime: record.startTime || '14:00',
    endTime: record.endTime || '15:00',
    attendance: { ...(record.attendance || {}) },
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      listCollection('categories'),
      listCollection('students'),
      isAdmin(profile) ? listCollection('users') : Promise.resolve([]),
    ])
      .then(([categoryData, studentData, userData]) => {
        if (!active) return;
        setCategories(categoryData);
        setMonitors(userData.filter((item) => item.status === 'approved' && ['monitor', 'admin', 'dev'].includes(item.role)).sort((a, b) => compareNames(a.name, b.name)));
        setStudents([...studentData].sort((a, b) => compareNames(a.name, b.name)));
      })
      .catch((error) => toast.error(errorMessage(error)));
    return () => { active = false; };
  }, []);

  const visibleStudents = useMemo(() => students.filter((student) =>
    normalizeSearch(student.name).includes(normalizeSearch(search))
  ), [students, search]);

  async function validate() {
    if (!form.date || !form.name.trim() || !form.categoryId || !form.responsible.trim()) {
      throw new Error('Preencha todos os dados da atividade.');
    }
    if (form.endTime <= form.startTime) {
      throw new Error('O horário de término deve ser posterior ao início.');
    }
    const sameDay = await getMonthRecords(form.date, form.date);
    if (sameDay.some((item) => item.id !== record.id && normalize(item.name) === normalize(form.name))) {
      throw new Error('Já existe uma atividade com esse nome nessa data.');
    }
  }

  async function next() {
    setBusy(true);
    try {
      await validate();
      setForm((prev) => ({ ...prev, attendance: Object.fromEntries(students.map((student) => [student.id, prev.attendance[student.id] === true])) }));
      setStep(2);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function save(pending = false) {
    if (!pending && !students.length) {
      toast.error('Nenhum aluno matriculado.');
      return;
    }
    setBusy(true);
    try {
      await validate();
      await editRecord('activities', record.id, {
        date: form.date,
        name: form.name.trim(),
        categoryId: form.categoryId,
        responsible: form.responsible.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        attendance: pending ? (record.attendance || {}) : Object.fromEntries(students.map((student) => [student.id, form.attendance[student.id] === true])),
        attendanceStatus: pending ? 'pending' : 'completed',
        ...(!pending ? { attendanceRecordedByUid: user.uid, attendanceRecordedByName: profile.name } : {}),
      });
      toast.success('Registro atualizado com sucesso!');
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Editar registro" wide onClose={onClose}>
      {step === 1 ? (
        <form className="form-stack" onSubmit={(event) => { event.preventDefault(); next(); }}>
          <Field label="Data da atividade">
            <DateInput value={form.date} onChange={(date) => setForm((prev) => ({ ...prev, date }))} />
          </Field>
          <Field label="Nome da atividade">
            <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </Field>
          <div className="form-grid">
            <Field label="Tipo de atividade">
              <SelectInput required value={form.categoryId} onChange={(categoryId) => setForm((prev) => ({ ...prev, categoryId }))} options={categories.map((category) => ({ value: category.id, label: category.name }))} />
            </Field>
            <Field label="Responsável">{isAdmin(profile) ? <SelectInput required value={form.responsible} onChange={(responsible) => setForm((prev) => ({ ...prev, responsible }))} options={[...monitors.map((monitor) => ({ value: monitor.name, label: monitor.name })), ...(!monitors.some((monitor) => monitor.name === form.responsible) && form.responsible ? [{ value: form.responsible, label: form.responsible }] : [])]} /> : <input readOnly value={form.responsible} />}</Field>
          </div>
          <div className="form-grid">
            <Field label="Horário de início">
              <TimeInput value={form.startTime} onChange={(startTime) => setForm((prev) => ({ ...prev, startTime }))} />
            </Field>
            <Field label="Horário de término">
              <TimeInput value={form.endTime} onChange={(endTime) => setForm((prev) => ({ ...prev, endTime }))} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="button secondary" disabled={busy} onClick={() => save(true)}>Salvar sem frequência</button><button className="button primary" disabled={busy}>Próximo: presenças</button>
          </div>
        </form>
      ) : (
        <div className="form-stack">
          <div className="section-heading compact">
            <div><h3>Presença dos alunos</h3><p>{students.length} aluno(s) matriculado(s)</p></div>

          </div>
          <div className="search-box attendance-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar aluno por nome..." aria-label="Pesquisar aluno por nome" />
          </div>
          {students.length ? (
            visibleStudents.length ? (
              <div className="attendance-list">
                {visibleStudents.map((student) => (
                  <div className="attendance-row" key={student.id}>
                    <div><strong>{student.name}</strong><small>ID {student.characterId}</small></div>
                    <div className="attendance-buttons">
                      <button className={`attendance-choice ${form.attendance[student.id] === true ? 'present' : ''}`} aria-label={`Presente: ${student.name}`} onClick={() => setForm((prev) => ({ ...prev, attendance: { ...prev.attendance, [student.id]: true } }))}><Check size={18} /></button>
                      <button className={`attendance-choice ${form.attendance[student.id] !== true ? 'absent' : ''}`} aria-label={`Ausente: ${student.name}`} onClick={() => setForm((prev) => ({ ...prev, attendance: { ...prev.attendance, [student.id]: false } }))}><X size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty text="Nenhum aluno encontrado na pesquisa." />
          ) : <Empty text="Nenhum aluno matriculado." />}
          <div className="form-actions">
            <button className="button secondary" onClick={() => setStep(1)}>Voltar</button>
            <button className="button primary" disabled={busy || !students.length} onClick={() => save(false)}>{busy ? 'Salvando...' : 'Salvar alterações'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

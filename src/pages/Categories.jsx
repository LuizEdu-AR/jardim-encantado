import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil } from 'lucide-react';
import { addRecord, editRecord, listCollection } from '../services/dataService';
import { Field, Modal, Empty } from '../components/UI';
import { errorMessage } from '../utils/helpers';
import ColorPicker from '../components/ColorPicker';

const suggestedColors = ['#E94C89', '#9C83E7', '#F97316', '#06B6D4', '#22C55E', '#EAB308', '#3B82F6', '#EF4444', '#58BE97', '#C43BDD'];

export default function Categories() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#58BE97' });
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setItems(await listCollection('categories')); }
    catch (error) { toast.error(errorMessage(error)); }
  }
  useEffect(() => { load(); }, []);

  function open(item = null) {
    setEditing(item || { id: null });
    setForm({ name: item?.name || '', color: item?.color || '#58BE97' });
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing.id) await editRecord('categories', editing.id, form);
      else await addRecord('categories', form);
      toast.success('Categoria salva!');
      setEditing(null);
      await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><div><h1>Categorias</h1><p>Organize as categorias das atividades e suas cores.</p></div><button className="button primary" onClick={() => open()}><Plus size={17} /> Nova categoria</button></div>
      <section className="panel">
        {items.length ? <div className="category-list">{items.map((item) => (
          <div className="category-row" key={item.id}><span className="color-dot" style={{ background: item.color }} /><strong>{item.name}</strong><span className="muted">{item.color}</span><button className="button subtle" onClick={() => open(item)}><Pencil size={15} /> Editar</button></div>
        ))}</div> : <Empty text="Nenhuma categoria cadastrada. Crie a primeira!" />}
      </section>
      {editing && <Modal title={editing.id ? 'Editar categoria' : 'Nova categoria'} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="form-stack">
          <Field label="Nome da categoria"><input required maxLength={60} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Recreação" /></Field>
          <Field label="Cor de identificação"><div className="color-input-row"><input aria-label="Selecionar cor" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /><input aria-label="Código HEX" pattern="#[0-9a-fA-F]{6}" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div></Field>
          <ColorPicker value={form.color} onChange={(color) => setForm((current) => ({ ...current, color }))} />
          <div className="field"><span>Cores sugeridas</span><div className="color-swatches">{suggestedColors.map((color) => <button key={color} type="button" className={`swatch ${form.color.toLowerCase() === color.toLowerCase() ? 'selected' : ''}`} style={{ background: color }} onClick={() => setForm({ ...form, color })} aria-label={`Selecionar ${color}`} />)}</div></div>
          <div className="category-preview"><span className="color-dot" style={{ background: form.color }} /> Prévia: <strong style={{ color: /^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : undefined }}>{form.name || 'Nome da categoria'}</strong></div>
          <div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar categoria'}</button></div>
        </form>
      </Modal>}
    </div>
  );
}

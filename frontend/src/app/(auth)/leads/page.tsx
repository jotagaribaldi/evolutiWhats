'use client';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Upload, Download, Pencil, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, Tag } from 'lucide-react';

interface GroupInfo {
  id: string;
  name: string;
}

interface LeadGroupRelation {
  groupId: string;
  group: GroupInfo;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  tags: string[];
  source?: string;
  groups?: LeadGroupRelation[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  NEW: { label: 'Novo', cls: 'badge-info' },
  CONTACTED: { label: 'Contatado', cls: 'badge-warning' },
  QUALIFIED: { label: 'Qualificado', cls: 'badge-purple' },
  CONVERTED: { label: 'Convertido', cls: 'badge-success' },
  LOST: { label: 'Perdido', cls: 'badge-error' },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockLeads: Lead[] = Array.from({ length: 18 }, (_, i) => ({
  id: `lead-${i + 1}`,
  name: ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Fernanda Lima'][i % 6],
  phone: `5511${String(90000000 + i).padStart(9, '0')}`,
  email: i % 3 === 0 ? `contato${i}@email.com` : undefined,
  status: (['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const)[i % 5],
  tags: i % 2 === 0 ? ['cliente', 'whatsapp'] : ['prospecto'],
  source: ['Orgânico', 'Indicação', 'Google Ads', 'Instagram'][i % 4],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

// ─── Group Multi-Select Component ─────────────────────────────────────────────
function GroupMultiSelect({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups-list'],
    queryFn: async () => {
      const { data } = await api.get('/groups', { params: { limit: 200 } });
      return data.data as GroupInfo[];
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(g => g !== id) : [...selectedIds, id]);
  };

  const selectedNames = groups.filter(g => selectedIds.includes(g.id)).map(g => g.name);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="form-input"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left', minHeight: 38,
          color: selectedNames.length ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selectedNames.length ? selectedNames.join(', ') : 'Selecionar grupos...'}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, marginLeft: 8, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        }}>
          {groups.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Nenhum grupo criado</div>
          ) : groups.map(g => (
            <label
              key={g.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(g.id)}
                onChange={() => toggle(g.id)}
                style={{ accentColor: 'var(--brand-400)', width: 16, height: 16 }}
              />
              <span>{g.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function LeadModal({ lead, onClose }: { lead?: Lead; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    status: lead?.status || 'NEW',
    tags: lead?.tags?.join(', ') || '',
    source: lead?.source || '',
    notes: '',
  });
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    lead?.groups?.map(g => g.groupId) || []
  );

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        groupIds: selectedGroupIds,
      };
      if (lead) return api.put(`/leads/${lead.id}`, payload);
      return api.post('/leads', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(lead ? 'Lead atualizado!' : 'Lead criado!');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar lead'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="form-input" placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone *</label>
              <input className="form-input" placeholder="5511999999999" value={form.phone} onChange={e => set('phone', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Grupos</label>
            <GroupMultiSelect selectedIds={selectedGroupIds} onChange={setSelectedGroupIds} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-input" placeholder="cliente, whatsapp, ..." value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Origem</label>
              <input className="form-input" placeholder="Google Ads, Indicação..." value={form.source} onChange={e => set('source', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea className="form-textarea" placeholder="Observações sobre o lead..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate(form)}>
            {mutation.isPending ? 'Salvando...' : (lead ? 'Salvar alterações' : 'Criar Lead')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || '');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | Lead | null>(null);
  const PER_PAGE = 10;

  // Load groups for the filter dropdown
  const { data: allGroups = [] } = useQuery({
    queryKey: ['groups-list'],
    queryFn: async () => {
      const { data } = await api.get('/groups', { params: { limit: 200 } });
      return data.data as GroupInfo[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter, groupFilter, page],
    queryFn: async () => {
      const { data } = await api.get('/leads', { params: {
        search, status: statusFilter || undefined,
        groupId: groupFilter || undefined,
        page, limit: PER_PAGE,
      } });
      return data;
    },
    placeholderData: { data: mockLeads, total: mockLeads.length, page: 1, limit: PER_PAGE, totalPages: 2 },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead removido'); },
    onError: () => toast.error('Erro ao remover lead'),
  });

  const leads: Lead[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages: number = data?.totalPages || 1;

  return (
    <div>
      {modal && <LeadModal lead={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{total.toLocaleString()} leads no total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm">
            <Upload size={15} /> Importar CSV
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={15} /> Exportar
          </button>
          <button id="new-lead-btn" className="btn btn-primary btn-sm" onClick={() => setModal('create')}>
            <Plus size={15} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 160, height: 38, fontSize: 13 }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          className="form-select"
          style={{ width: 200, height: 38, fontSize: 13 }}
          value={groupFilter}
          onChange={e => { setGroupFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todos os grupos</option>
          {allGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Grupos</th>
              <th>Tags</th>
              <th>Origem</th>
              <th>Criado em</th>
              <th style={{ width: 80 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state">Nenhum lead encontrado</div></td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{lead.name}</div>
                  {lead.email && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lead.email}</div>}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{lead.phone}</td>
                <td><span className={`badge ${STATUS_LABELS[lead.status]?.cls}`}>{STATUS_LABELS[lead.status]?.label}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(lead.groups || []).length === 0 ? (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                    ) : (lead.groups || []).slice(0, 2).map(g => (
                      <span key={g.groupId} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, color: 'var(--brand-400)', fontWeight: 500 }}>
                        {g.group.name}
                      </span>
                    ))}
                    {(lead.groups || []).length > 2 && (
                      <span style={{ fontSize: 11, padding: '2px 6px', color: 'var(--text-muted)' }}>+{(lead.groups || []).length - 2}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {lead.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, color: 'var(--text-muted)' }}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{lead.source || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => setModal(lead)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Remover"
                      style={{ color: 'var(--error)' }}
                      onClick={() => { if (confirm('Remover este lead?')) deleteMut.mutate(lead.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Página {page} de {totalPages} — {total} registros
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={15} />
            </button>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

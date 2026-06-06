'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Users, ChevronRight, UserPlus, Search, Check } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  _count?: { leads: number };
  createdAt: string;
}

interface LeadBasic {
  id: string;
  name: string;
  phone: string;
  email?: string;
  groups?: { groupId: string }[];
}

const mockGroups: Group[] = [
  { id: '1', name: 'Clientes VIP', description: 'Clientes com alto valor de compra', _count: { leads: 124 }, createdAt: new Date().toISOString() },
  { id: '2', name: 'Novos Leads', description: 'Leads captados nos últimos 7 dias', _count: { leads: 48 }, createdAt: new Date().toISOString() },
  { id: '3', name: 'Prospects Qualificados', description: 'Leads que responderam ao 1º contato', _count: { leads: 87 }, createdAt: new Date().toISOString() },
  { id: '4', name: 'Campanha Maio', description: undefined, _count: { leads: 310 }, createdAt: new Date().toISOString() },
];

// ─── Group Create/Edit Modal ──────────────────────────────────────────────────
function GroupModal({ group, onClose }: { group?: Group; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');

  const mut = useMutation({
    mutationFn: () => group
      ? api.put(`/groups/${group.id}`, { name, description })
      : api.post('/groups', { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(group ? 'Grupo atualizado!' : 'Grupo criado!');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar grupo'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{group ? 'Editar Grupo' : 'Novo Grupo'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" placeholder="Nome do grupo" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" placeholder="Descrição opcional..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={mut.isPending || !name} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Salvando...' : (group ? 'Salvar' : 'Criar Grupo')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Leads to Group Modal ─────────────────────────────────────────────────
function AddLeadsModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Load all leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['all-leads-for-group', group.id],
    queryFn: async () => {
      const { data } = await api.get('/leads', { params: { limit: 500 } });
      return data.data as LeadBasic[];
    },
  });

  const leads = leadsData || [];

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.email?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  // Check which leads are already in the group
  const alreadyInGroup = useMemo(() => {
    return new Set(leads.filter(l => l.groups?.some(g => g.groupId === group.id)).map(l => l.id));
  }, [leads, group.id]);

  const toggleLead = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const available = filtered.filter(l => !alreadyInGroup.has(l.id)).map(l => l.id);
    setSelectedIds(prev => {
      const combined = new Set([...prev, ...available]);
      return Array.from(combined);
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const addMut = useMutation({
    mutationFn: () => api.post(`/groups/${group.id}/leads`, { leadIds: selectedIds }),
    onSuccess: (res) => {
      const result = res.data;
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['all-leads-for-group'] });
      toast.success(`${result.added} lead(s) adicionado(s) ao grupo!`);
      onClose();
    },
    onError: () => toast.error('Erro ao adicionar leads ao grupo'),
  });

  const availableCount = filtered.filter(l => !alreadyInGroup.has(l.id)).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Adicionar Leads ao Grupo
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {group.name}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Bulk actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {selectedIds.length} selecionado(s) · {availableCount} disponível(eis)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12 }}
                onClick={selectAllFiltered}
              >
                Selecionar todos
              </button>
              {selectedIds.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, color: 'var(--error)' }}
                  onClick={clearSelection}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lead list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 0, maxHeight: 360 }}>
          {isLoading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Carregando leads...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhum lead encontrado
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map(lead => {
                const inGroup = alreadyInGroup.has(lead.id);
                const selected = selectedIds.includes(lead.id);
                return (
                  <label
                    key={lead.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 8, cursor: inGroup ? 'default' : 'pointer',
                      background: selected ? 'rgba(99,102,241,0.08)' : 'transparent',
                      border: `1px solid ${selected ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                      opacity: inGroup ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {inGroup ? (
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: 'var(--success)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="white" />
                      </div>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleLead(lead.id)}
                        style={{ accentColor: 'var(--brand-400)', width: 18, height: 18 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lead.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                        <span style={{ fontFamily: 'monospace' }}>{lead.phone}</span>
                        {lead.email && <span>{lead.email}</span>}
                      </div>
                    </div>
                    {inGroup && (
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(34,197,94,0.15)', color: 'var(--success)', fontWeight: 500,
                      }}>
                        Já no grupo
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={addMut.isPending || selectedIds.length === 0}
            onClick={() => addMut.mutate()}
          >
            {addMut.isPending ? 'Adicionando...' : `Adicionar ${selectedIds.length} lead(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Group | null>(null);
  const [addLeadsGroup, setAddLeadsGroup] = useState<Group | null>(null);

  const { data: groups = mockGroups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await api.get('/groups', { params: { limit: 100 } });
      return data.data as Group[];
    },
    placeholderData: mockGroups,
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/groups/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); toast.success('Grupo removido'); },
    onError: () => toast.error('Erro ao remover grupo'),
  });

  return (
    <div>
      {modal && <GroupModal group={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
      {addLeadsGroup && <AddLeadsModal group={addLeadsGroup} onClose={() => setAddLeadsGroup(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Grupos</h1>
          <p className="page-subtitle">{groups.length} grupos de leads</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>
          <Plus size={15} /> Novo Grupo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 110, background: 'var(--bg-elevated)', animationName: 'pulse' }} />
            ))
          : groups.map(group => (
              <div key={group.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{group.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Adicionar leads"
                      style={{ color: 'var(--brand-400)' }}
                      onClick={() => setAddLeadsGroup(group)}
                    >
                      <UserPlus size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => setModal(group)}><Pencil size={14} /></button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Remover"
                      style={{ color: 'var(--error)' }}
                      onClick={() => { if (confirm('Remover este grupo?')) delMut.mutate(group.id); }}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} style={{ color: 'var(--brand-400)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {group._count?.leads || 0} leads
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, color: 'var(--brand-400)', padding: '4px 8px' }}
                      onClick={() => setAddLeadsGroup(group)}
                    >
                      <UserPlus size={12} style={{ marginRight: 4 }} /> Adicionar Leads
                    </button>
                    <a
                      href={`/leads?group=${group.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--brand-400)', textDecoration: 'none' }}
                    >
                      Ver leads <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

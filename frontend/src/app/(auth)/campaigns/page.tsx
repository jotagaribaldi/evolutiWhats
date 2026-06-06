'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Play, Pause, Eye, X, Send, Clock, CheckCircle2, AlertCircle, FileText, ChevronDown } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  messageTemplate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  instanceId?: string;
  instance?: {
    instanceName: string;
    status: string;
  };
}

interface GroupInfo {
  id: string;
  name: string;
  _count?: { leads: number };
}

interface WhatsappInstance {
  id: string;
  instanceName: string;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ComponentType<any> }> = {
  DRAFT:     { label: 'Rascunho', cls: 'badge-neutral', icon: FileText },
  SCHEDULED: { label: 'Agendada', cls: 'badge-warning', icon: Clock },
  RUNNING:   { label: 'Em andamento', cls: 'badge-success', icon: Send },
  PAUSED:    { label: 'Pausada', cls: 'badge-warning', icon: Pause },
  COMPLETED: { label: 'Concluída', cls: 'badge-info', icon: CheckCircle2 },
  FAILED:    { label: 'Falhou', cls: 'badge-error', icon: AlertCircle },
};

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Promoção de Maio', description: 'Oferta especial para clientes VIP', messageTemplate: 'Olá {nome}! Temos uma oferta especial para você...', status: 'RUNNING', totalRecipients: 800, sentCount: 430, failedCount: 12, startedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: '2', name: 'Boas-vindas Novos', messageTemplate: 'Bem-vindo, {nome}! Obrigado por se cadastrar...', status: 'COMPLETED', totalRecipients: 215, sentCount: 215, failedCount: 3, completedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: '3', name: 'Follow-up Junho', messageTemplate: 'Oi {nome}, gostaria de conversar sobre...', status: 'SCHEDULED', totalRecipients: 320, sentCount: 0, failedCount: 0, scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(), createdAt: new Date().toISOString() },
  { id: '4', name: 'Reengajamento', messageTemplate: 'Faz tempo que não falamos, {nome}...', status: 'DRAFT', totalRecipients: 0, sentCount: 0, failedCount: 0, createdAt: new Date().toISOString() },
];

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

  const selectedGroups = groups.filter(g => selectedIds.includes(g.id));
  const totalLeads = selectedGroups.reduce((sum, g) => sum + (g._count?.leads || 0), 0);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="form-input"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left', minHeight: 38,
          color: selectedGroups.length ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selectedGroups.length
            ? `${selectedGroups.length} grupo(s) · ~${totalLeads} leads`
            : 'Selecionar grupos de destinatários...'}
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
              <span style={{ flex: 1 }}>{g.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g._count?.leads || 0} leads</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', messageTemplate: '', minDelayMs: 3000, maxDelayMs: 10000, instanceId: '' });
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const { data: instances = [] } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/instances');
      return data as WhatsappInstance[];
    },
  });

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        instanceId: form.instanceId || undefined,
        groupIds: selectedGroupIds,
      };
      return api.post('/campaigns', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campanha criada!'); onClose(); },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao criar campanha';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Nova Campanha</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome da campanha *</label>
            <input className="form-input" placeholder="Ex: Promoção de Junho" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="form-input" placeholder="Descrição breve da campanha" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Conexão WhatsApp</label>
            <select
              className="form-input"
              value={form.instanceId}
              onChange={e => set('instanceId', e.target.value)}
            >
              <option value="">Selecionar instância do WhatsApp...</option>
              {instances.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.instanceName} ({inst.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'})
                </option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              A instância deve estar Conectada para que você possa iniciar os envios da campanha.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Grupos de destinatários</label>
            <GroupMultiSelect selectedIds={selectedGroupIds} onChange={setSelectedGroupIds} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Selecione os grupos cujos leads receberão a campanha. Leads duplicados entre grupos serão enviados apenas uma vez.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Mensagem *</label>
            <textarea className="form-textarea" rows={5}
              placeholder="Olá {nome}! Aqui é a {empresa}. Temos uma novidade especial para você...&#10;&#10;Use {nome} para personalizar com o nome do lead."
              value={form.messageTemplate} onChange={e => set('messageTemplate', e.target.value)}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Variáveis disponíveis: <code style={{ color: 'var(--brand-400)' }}>{'{nome}'}</code>, <code style={{ color: 'var(--brand-400)' }}>{'{telefone}'}</code>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Delay mínimo (ms)</label>
              <input className="form-input" type="number" value={form.minDelayMs} onChange={e => set('minDelayMs', Number(e.target.value))} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Espera mínima entre mensagens</p>
            </div>
            <div className="form-group">
              <label className="form-label">Delay máximo (ms)</label>
              <input className="form-input" type="number" value={form.maxDelayMs} onChange={e => set('maxDelayMs', Number(e.target.value))} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Espera máxima entre mensagens</p>
            </div>
          </div>
          <div style={{ padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--warning)' }}>
            ⚡ Recomendamos delays entre 3-15 segundos para evitar bloqueios do WhatsApp.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={mut.isPending || !form.name || !form.messageTemplate} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Criando...' : 'Criar Campanha'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: campaigns = mockCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns', { params: { limit: 50 } });
      return data.data as Campaign[];
    },
    placeholderData: mockCampaigns,
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'pause' | 'resume' }) =>
      api.post(`/campaigns/${id}/${action}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Ação realizada!'); },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro na ação';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  return (
    <div>
      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Campanhas</h1>
          <p className="page-subtitle">{campaigns.length} campanhas criadas</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nova Campanha
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {campaigns.map(c => {
          const sc = STATUS_CONFIG[c.status];
          const Icon = sc.icon;
          const pct = c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;

          return (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: c.status === 'RUNNING' ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                  border: `1px solid ${c.status === 'RUNNING' ? 'rgba(16,185,129,0.2)' : 'var(--border-subtle)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: c.status === 'RUNNING' ? 'var(--success)' : 'var(--text-muted)' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h3>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>
                  {c.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>}

                  {/* Progress */}
                  {c.totalRecipients > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>{c.sentCount.toLocaleString()} enviados de {c.totalRecipients.toLocaleString()}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                    {c.failedCount > 0 && <span style={{ color: 'var(--error)' }}>✗ {c.failedCount} falhas</span>}
                    {c.scheduledAt && <span>⏰ {new Date(c.scheduledAt).toLocaleString('pt-BR')}</span>}
                    <span>📅 {new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                    {c.instance && (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4, 
                        color: c.instance.status === 'CONNECTED' ? 'var(--success)' : 'var(--error)',
                        background: c.instance.status === 'CONNECTED' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: `1px solid ${c.instance.status === 'CONNECTED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
                      }}>
                        📱 {c.instance.instanceName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {c.status === 'DRAFT' && (
                    <button className="btn btn-primary btn-sm" onClick={() => actionMut.mutate({ id: c.id, action: 'start' })}>
                      <Play size={14} /> Iniciar
                    </button>
                  )}
                  {c.status === 'RUNNING' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => actionMut.mutate({ id: c.id, action: 'pause' })}>
                      <Pause size={14} /> Pausar
                    </button>
                  )}
                  {c.status === 'PAUSED' && (
                    <button className="btn btn-primary btn-sm" onClick={() => actionMut.mutate({ id: c.id, action: 'resume' })}>
                      <Play size={14} /> Retomar
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm"><Eye size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

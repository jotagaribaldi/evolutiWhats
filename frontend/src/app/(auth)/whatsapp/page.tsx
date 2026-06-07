'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, RefreshCw, Trash2, QrCode, X, Smartphone,
  RefreshCcw, Link2, Link2Off, Building2, ChevronDown,
} from 'lucide-react';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

interface WhatsappInstance {
  id: string;
  instanceName: string;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  tenantId: string | null;
  tenant?: TenantInfo | null;
  connectionData?: {
    evolutionId?: string;
    ownerJid?: string;
    profileName?: string;
    profilePicUrl?: string;
    integration?: string;
    messageCount?: number;
    qrcode?: string;
  };
  dailyLimit: number;
  sentToday: number;
  createdAt: string;
}

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  disconnected: number;
}

// ─── QR Modal ──────────────────────────────────────────────────────────────
function QRModal({ instance, onClose }: { instance: WhatsappInstance; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['qr', instance.id],
    queryFn: async () => {
      const { data } = await api.get(`/whatsapp/instances/${instance.id}/qr`);
      return data;
    },
    refetchInterval: 20000,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Conectar WhatsApp</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Instância: <strong style={{ color: 'var(--text-secondary)' }}>{instance.instanceName}</strong>
          </p>
          <div style={{
            width: 240, height: 240, margin: '0 auto',
            background: 'white', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border-default)',
          }}>
            {isLoading ? (
              <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid #10b981', borderRadius: '50%' }} />
            ) : data?.qrcode ? (
              <img src={`data:image/png;base64,${data.qrcode}`} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 8 }} />
            ) : (
              <div style={{ color: '#475569', fontSize: 13, padding: 16, textAlign: 'center' }}>
                QR code indisponível.<br />A instância pode já estar conectada.
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
            Abra o WhatsApp → Menu → Dispositivos Conectados → Conectar Dispositivo
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────
function CreateInstanceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(500);

  const mut = useMutation({
    mutationFn: () => api.post('/whatsapp/instances', { instanceName: name, dailyLimit: limit }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances'] });
      toast.success('Instância criada! Escaneie o QR code para conectar.');
      onClose();
    },
    onError: () => toast.error('Erro ao criar instância'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Nova Instância WhatsApp</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome da instância *</label>
            <input
              className="form-input"
              placeholder="ex: vendas-principal"
              value={name}
              onChange={e => setName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Será criada na Evolution API como: <code style={{ color: 'var(--brand-400)' }}>[tenant-id]_{name || 'nome'}</code>
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Limite diário de mensagens</label>
            <input className="form-input" type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} min={1} max={1000} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Recomendado: máx 500/dia para contas novas</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={mut.isPending || !name} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Criando...' : 'Criar e Conectar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Tenant Dropdown ─────────────────────────────────────────────────
function AssignTenantDropdown({
  instance,
  tenants,
  onAssign,
  onClose,
}: {
  instance: WhatsappInstance;
  tenants: TenantInfo[];
  onAssign: (instanceId: string, tenantId: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: 20, minWidth: 320, maxWidth: 400,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Vincular empresa
          </h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Instância: <code style={{ color: 'var(--brand-400)', fontSize: 11 }}>{instance.instanceName}</code>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {/* Unassign option */}
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              border: !instance.tenantId ? '2px solid var(--brand-400)' : '1px solid var(--border-subtle)',
              background: !instance.tenantId ? 'rgba(16,185,129,0.06)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 13,
              transition: 'all 0.15s',
            }}
            onClick={() => { onAssign(instance.id, null); onClose(); }}
          >
            <Link2Off size={15} style={{ color: '#f59e0b' }} />
            <span>Sem empresa (desvinculada)</span>
          </button>

          {tenants.map(t => (
            <button
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                border: instance.tenantId === t.id ? '2px solid var(--brand-400)' : '1px solid var(--border-subtle)',
                background: instance.tenantId === t.id ? 'rgba(16,185,129,0.06)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontSize: 13,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (instance.tenantId !== t.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; }}
              onMouseLeave={e => { if (instance.tenantId !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              onClick={() => { onAssign(instance.id, t.id); onClose(); }}
            >
              <Building2 size={15} style={{ color: 'var(--brand-400)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{t.slug}</div>
              </div>
              {instance.tenantId === t.id && (
                <span style={{ fontSize: 10, color: 'var(--brand-400)', fontWeight: 700 }}>ATUAL</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [qrInstance, setQrInstance] = useState<WhatsappInstance | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [assigningInstance, setAssigningInstance] = useState<WhatsappInstance | null>(null);

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/instances');
      return data as WhatsappInstance[];
    },
    refetchInterval: 30000,
  });

  // Fetch tenants (only for SUPER_ADMIN, for the assign dropdown)
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: async () => {
      const { data } = await api.get('/tenants');
      return data as TenantInfo[];
    },
    enabled: isSuperAdmin,
  });

  // Sync mutation
  const syncMut = useMutation({
    mutationFn: () => api.post('/whatsapp/instances/sync'),
    onSuccess: (res) => {
      const r: SyncResult = res.data;
      qc.invalidateQueries({ queryKey: ['instances'] });
      toast.success(
        `Sincronização concluída!\n` +
        `${r.created} criada${r.created !== 1 ? 's' : ''}, ` +
        `${r.updated} atualizada${r.updated !== 1 ? 's' : ''}, ` +
        `${r.disconnected} desconectada${r.disconnected !== 1 ? 's' : ''}`,
        { duration: 5000 }
      );
    },
    onError: () => toast.error('Erro ao sincronizar com a Evolution API'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/whatsapp/instances/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['instances'] }); toast.success('Instância removida'); },
    onError: () => toast.error('Erro ao remover instância'),
  });

  // Assign tenant mutation
  const assignMut = useMutation({
    mutationFn: ({ instanceId, tenantId }: { instanceId: string; tenantId: string | null }) =>
      api.patch(`/whatsapp/instances/${instanceId}/assign`, { tenantId }),
    onSuccess: (_, { tenantId }) => {
      qc.invalidateQueries({ queryKey: ['instances'] });
      toast.success(tenantId ? 'Empresa vinculada com sucesso!' : 'Instância desvinculada da empresa.');
    },
    onError: () => toast.error('Erro ao vincular empresa'),
  });

  const connected = instances.filter(i => i.status === 'CONNECTED').length;
  const disconnected = instances.filter(i => i.status === 'DISCONNECTED').length;
  const connecting = instances.filter(i => i.status === 'CONNECTING').length;
  const unassigned = isSuperAdmin ? instances.filter(i => !i.tenantId).length : 0;

  return (
    <div>
      {qrInstance && <QRModal instance={qrInstance} onClose={() => setQrInstance(null)} />}
      {showCreate && <CreateInstanceModal onClose={() => setShowCreate(false)} />}
      {assigningInstance && (
        <AssignTenantDropdown
          instance={assigningInstance}
          tenants={tenants}
          onAssign={(instanceId, tenantId) => assignMut.mutate({ instanceId, tenantId })}
          onClose={() => setAssigningInstance(null)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">WhatsApp</h1>
          <p className="page-subtitle">
            {isSuperAdmin ? 'Gerenciamento global de instâncias · Evolution API' : 'Instâncias conectadas via Evolution API'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            title="Sincronizar instâncias da Evolution API"
          >
            <RefreshCcw size={15} style={syncMut.isPending ? { animation: 'spin 1s linear infinite' } : {}} />
            {syncMut.isPending ? 'Sincronizando...' : 'Sincronizar Evolution API'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Nova Instância
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className={`grid ${isSuperAdmin ? 'grid-cols-5' : 'grid-cols-4'} gap-4 mb-6`}>
        {[
          { label: 'Total', value: instances.length, color: '#3b82f6' },
          { label: 'Conectadas', value: connected, color: '#10b981' },
          { label: 'Conectando', value: connecting, color: '#f59e0b' },
          { label: 'Desconectadas', value: disconnected, color: '#ef4444' },
          ...(isSuperAdmin ? [{ label: 'Sem empresa', value: unassigned, color: '#a855f7' }] : []),
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SUPER_ADMIN notice */}
      {isSuperAdmin && (
        <div style={{
          marginBottom: 16, padding: '10px 16px',
          background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: 10, fontSize: 13, color: '#a855f7',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Building2 size={15} />
          <span>
            <strong>Modo Root:</strong> você está vendo todas as instâncias. Use o botão{' '}
            <strong>"Vincular empresa"</strong> para associar cada instância a uma empresa.
          </span>
        </div>
      )}

      {/* Evolution API hint — shown when empty */}
      {!isLoading && instances.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Smartphone size={26} style={{ color: 'var(--brand-400)' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            Nenhuma instância encontrada
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
            Clique em <strong style={{ color: 'var(--brand-400)' }}>Sincronizar Evolution API</strong> para importar
            as instâncias existentes, ou crie uma nova instância.
          </p>
          <button className="btn btn-primary" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
            <RefreshCcw size={15} />
            {syncMut.isPending ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        </div>
      )}

      {/* Instance list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 88, background: 'var(--bg-elevated)' }} />
            ))
          : instances.map(inst => {
              const isConnected = inst.status === 'CONNECTED';
              const isConnecting = inst.status === 'CONNECTING';
              const profileName = inst.connectionData?.profileName;
              const ownerJid = inst.connectionData?.ownerJid;
              const msgCount = inst.connectionData?.messageCount;
              const hasNoTenant = !inst.tenantId;

              return (
                <div
                  key={inst.id}
                  className="card"
                  style={{
                    borderLeft: isSuperAdmin && hasNoTenant
                      ? '3px solid rgba(168,85,247,0.5)'
                      : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Avatar */}
                    {inst.connectionData?.profilePicUrl ? (
                      <img
                        src={inst.connectionData.profilePicUrl}
                        alt={profileName}
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border-default)' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: isConnected ? 'rgba(16,185,129,0.1)' : isConnecting ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${isConnected ? 'rgba(16,185,129,0.2)' : isConnecting ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Smartphone size={22} style={{ color: isConnected ? '#10b981' : isConnecting ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                          {inst.instanceName}
                        </h3>
                        {profileName && (
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>— {profileName}</span>
                        )}
                        <span className={`badge ${isConnected ? 'badge-success' : isConnecting ? 'badge-warning' : 'badge-error'}`}>
                          {isConnected ? '● Conectado' : isConnecting ? '◌ Conectando' : '○ Desconectado'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                        {ownerJid && (
                          <span>📱 {ownerJid.replace('@s.whatsapp.net', '')}</span>
                        )}
                        {msgCount !== undefined && (
                          <span>💬 {msgCount.toLocaleString()} mensagens no histórico</span>
                        )}
                        <span>📤 {inst.sentToday}/{inst.dailyLimit} enviadas hoje</span>

                        {/* Tenant badge — only shown for SUPER_ADMIN */}
                        {isSuperAdmin && (
                          hasNoTenant ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
                              color: '#a855f7',
                            }}>
                              <Link2Off size={10} /> Sem empresa
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                              color: '#10b981',
                            }}>
                              <Building2 size={10} /> {inst.tenant?.name || 'Empresa vinculada'}
                            </span>
                          )
                        )}
                      </div>

                      {isConnected && inst.dailyLimit > 0 && (
                        <div style={{ marginTop: 8, maxWidth: 300 }}>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(100, (inst.sentToday / inst.dailyLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {/* Assign tenant button — SUPER_ADMIN only */}
                      {isSuperAdmin && (
                        <button
                          className="btn btn-secondary btn-sm"
                          title={inst.tenant ? `Empresa: ${inst.tenant.name}. Clique para alterar.` : 'Vincular a uma empresa'}
                          style={{
                            borderColor: hasNoTenant ? 'rgba(168,85,247,0.4)' : undefined,
                            color: hasNoTenant ? '#a855f7' : undefined,
                          }}
                          onClick={() => setAssigningInstance(inst)}
                          disabled={assignMut.isPending}
                        >
                          <Link2 size={14} />
                          {hasNoTenant ? 'Vincular' : 'Alterar empresa'}
                          <ChevronDown size={12} style={{ marginLeft: 2 }} />
                        </button>
                      )}

                      {!isConnected && (
                        <button className="btn btn-primary btn-sm" onClick={() => setQrInstance(inst)}>
                          <QrCode size={14} /> Conectar
                        </button>
                      )}
                      {isConnected && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            try {
                              await api.get(`/whatsapp/instances/${inst.id}/status`);
                              qc.invalidateQueries({ queryKey: ['instances'] });
                              toast.success('Status atualizado');
                            } catch {
                              toast.error('Erro ao verificar status');
                            }
                          }}
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--error)' }}
                        title="Remover instância"
                        onClick={() => {
                          if (confirm(`Remover "${inst.instanceName}" também da Evolution API?`)) {
                            delMut.mutate(inst.id);
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Sync result info */}
      {syncMut.isSuccess && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
        }}>
          ✓ Última sincronização: {new Date().toLocaleString('pt-BR')} —{' '}
          <strong>{(syncMut.data?.data as SyncResult)?.synced || 0}</strong> instâncias verificadas na Evolution API
        </div>
      )}
    </div>
  );
}

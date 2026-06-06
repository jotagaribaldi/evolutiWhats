'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Shield, User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

const ROLE_LABELS = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'badge-error' },
  COMPANY_ADMIN: { label: 'Admin', cls: 'badge-purple' },
  USER: { label: 'Usuário', cls: 'badge-neutral' },
};

const mockUsers: User[] = [
  { id: '1', name: 'Admin Demo', email: 'admin@demo.com', role: 'COMPANY_ADMIN', active: true, lastLogin: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: '2', name: 'Vendas 1', email: 'vendas1@demo.com', role: 'USER', active: true, lastLogin: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
  { id: '3', name: 'Vendas 2', email: 'vendas2@demo.com', role: 'USER', active: false, createdAt: new Date().toISOString() },
];

function UserModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || 'USER', password: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => user
      ? api.put(`/users/${user.id}`, { name: form.name, role: form.role })
      : api.post('/users', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(user ? 'Usuário atualizado!' : 'Usuário criado!'); onClose(); },
    onError: () => toast.error('Erro ao salvar'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" placeholder="email@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} disabled={!!user} />
          </div>
          {!user && (
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input className="form-input" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Função</label>
            <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="USER">Usuário</option>
              <option value="COMPANY_ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Salvando...' : (user ? 'Salvar' : 'Criar Usuário')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | User | null>(null);

  const { data: users = mockUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { limit: 100 } });
      return data.data as User[];
    },
    placeholderData: mockUsers,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/users/${id}`, { active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status atualizado'); },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuário removido'); },
  });

  return (
    <div>
      {modal && <UserModal user={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">{users.length} usuários na plataforma</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>
          <Plus size={15} /> Novo Usuário
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Função</th>
              <th>Status</th>
              <th>Último Acesso</th>
              <th style={{ width: 100 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${ROLE_LABELS[u.role].cls}`}>{ROLE_LABELS[u.role].label}</span></td>
                <td>
                  <span className={`badge ${u.active ? 'badge-success' : 'badge-neutral'}`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(u)}><Pencil size={14} /></button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--error)' }}
                      onClick={() => { if (confirm('Remover usuário?')) delMut.mutate(u.id); }}
                    ><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

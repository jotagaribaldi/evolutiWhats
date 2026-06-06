'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MessageSquare, Megaphone, Smartphone, TrendingUp, Send, Clock, CheckCircle2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardStats {
  leads: { total: number; new: number; contacted: number; converted: number };
  groups: { total: number };
  campaigns: { total: number; running: number; completed: number; scheduled: number };
  whatsapp: { total: number; connected: number };
  recentActivity: Array<{ date: string; sent: number; failed: number }>;
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: number | string; sub?: string;
  icon: React.ComponentType<{size?: number; style?: React.CSSProperties}>;
  color: string; trend?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
          {trend && <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>↑ {trend}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}15`,
          border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b'];

const mockData: DashboardStats = {
  leads: { total: 1240, new: 48, contacted: 320, converted: 85 },
  groups: { total: 18 },
  campaigns: { total: 12, running: 2, completed: 8, scheduled: 2 },
  whatsapp: { total: 3, connected: 2 },
  recentActivity: [
    { date: '22/05', sent: 120, failed: 5 },
    { date: '23/05', sent: 340, failed: 12 },
    { date: '24/05', sent: 200, failed: 8 },
    { date: '25/05', sent: 480, failed: 20 },
    { date: '26/05', sent: 310, failed: 11 },
    { date: '27/05', sent: 520, failed: 18 },
    { date: '28/05', sent: 145, failed: 4 },
  ],
};

const campaignStatusData = [
  { name: 'Concluídas', value: 8 },
  { name: 'Em andamento', value: 2 },
  { name: 'Agendadas', value: 2 },
];

const leadStatusData = [
  { name: 'Novos', value: 48 },
  { name: 'Contatados', value: 320 },
  { name: 'Qualificados', value: 180 },
  { name: 'Convertidos', value: 85 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data as DashboardStats;
    },
    initialData: mockData,
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bem-vindo, {user?.name}! Aqui está o resumo da sua plataforma.</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          Atualizado agora
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de Leads" value={stats.leads.total.toLocaleString()} icon={Users} color="#10b981" trend="12% este mês" />
        <StatCard label="Campanhas Ativas" value={stats.campaigns.running} sub={`${stats.campaigns.total} campanhas no total`} icon={Megaphone} color="#8b5cf6" />
        <StatCard label="Grupos" value={stats.groups.total} icon={MessageSquare} color="#3b82f6" />
        <StatCard label="WhatsApp" value={`${stats.whatsapp.connected}/${stats.whatsapp.total}`} sub="instâncias conectadas" icon={Smartphone} color="#f59e0b" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* Area chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Mensagens Enviadas</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Últimos 7 dias</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: '#10b981' }}>● Enviadas</span>
              <span style={{ color: '#ef4444' }}>● Falhas</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.recentActivity}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} fill="url(#sentGrad)" name="Enviadas" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="url(#failGrad)" name="Falhas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Status dos Leads</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Distribuição atual</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {leadStatusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Campaign status */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Campanhas Recentes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Promoção Maio', status: 'RUNNING', sent: 430, total: 800 },
              { name: 'Boas-vindas Novos Leads', status: 'COMPLETED', sent: 215, total: 215 },
              { name: 'Follow-up Clientes', status: 'SCHEDULED', sent: 0, total: 320 },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(c.sent / c.total) * 100}%` }} />
                  </div>
                </div>
                <span className={`badge badge-${c.status === 'RUNNING' ? 'success' : c.status === 'COMPLETED' ? 'info' : 'warning'}`}>
                  {c.status === 'RUNNING' ? 'Ativa' : c.status === 'COMPLETED' ? 'Concluída' : 'Agendada'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c.sent}/{c.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Ações Rápidas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Nova Campanha', icon: Megaphone, href: '/campaigns/new', color: '#10b981' },
              { label: 'Importar Leads', icon: Users, href: '/leads', color: '#8b5cf6' },
              { label: 'Novo Grupo', icon: MessageSquare, href: '/groups', color: '#3b82f6' },
              { label: 'Conectar WhatsApp', icon: Smartphone, href: '/whatsapp', color: '#f59e0b' },
            ].map(({ label, icon: Icon, href, color }) => (
              <a
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '40'; (e.currentTarget as HTMLElement).style.background = color + '10'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

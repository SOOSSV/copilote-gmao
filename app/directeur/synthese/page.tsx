'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, ArrowLeft, Target, Battery, ShieldAlert, Users, Wrench, Cpu, Trophy, Factory } from 'lucide-react';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number;
};
type MachineStat = { nom: string; count: number };
type TechStat = { prenom: string; nom: string; resolus: number };

function KpiMini({ label, value, color, sub, icon: Icon }: { label: string; value: string | number; color: string; sub?: string; icon: React.ElementType }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 14, padding: '16px' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon size={17} color={color} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function SynthesePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, ouverts: 0, en_cours: 0, fermes: 0, urgents: 0, machines: 0, techniciens: 0 });
  const [topMachines, setTopMachines] = useState<MachineStat[]>([]);
  const [topTechs, setTopTechs] = useState<TechStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ticketsRes, machinesRes, techniciensRes, openTicketsRes, resolvedTicketsRes] = await Promise.all([
        supabase.from('tickets').select('statut, priorite'),
        supabase.from('machines').select('id').eq('statut', 'actif'),
        supabase.from('technicians').select('id'),
        supabase.from('tickets').select('machine_id, machines(nom)').in('statut', ['ouvert', 'en_cours']),
        supabase.from('tickets').select('technicien_id, technicians(prenom, nom)').eq('statut', 'resolu').not('technicien_id', 'is', null),
      ]);

      const t = ticketsRes.data || [];
      setStats({
        total: t.length, ouverts: t.filter(x => x.statut === 'ouvert').length,
        en_cours: t.filter(x => x.statut === 'en_cours').length,
        fermes: t.filter(x => x.statut === 'resolu').length,
        urgents: t.filter(x => x.priorite === 'urgente').length,
        machines: machinesRes.data?.length || 0,
        techniciens: techniciensRes.data?.length || 0,
      });

      // Top machines avec le + de tickets ouverts
      const machineMap: Record<string, MachineStat> = {};
      for (const ticket of (openTicketsRes.data || [])) {
        const nom = (ticket.machines as { nom: string } | null)?.nom;
        if (!nom || !ticket.machine_id) continue;
        if (!machineMap[ticket.machine_id]) machineMap[ticket.machine_id] = { nom, count: 0 };
        machineMap[ticket.machine_id].count++;
      }
      setTopMachines(Object.values(machineMap).sort((a, b) => b.count - a.count).slice(0, 5));

      // Top techs par tickets résolus
      const techMap: Record<string, TechStat> = {};
      for (const ticket of (resolvedTicketsRes.data || [])) {
        const tech = ticket.technicians as { prenom: string; nom: string } | null;
        if (!tech || !ticket.technicien_id) continue;
        if (!techMap[ticket.technicien_id]) techMap[ticket.technicien_id] = { prenom: tech.prenom, nom: tech.nom, resolus: 0 };
        techMap[ticket.technicien_id].resolus++;
      }
      setTopTechs(Object.values(techMap).sort((a, b) => b.resolus - a.resolus).slice(0, 5));

      setLoading(false);
    }
    load();
  }, []);

  const tauxResolution = stats.total > 0 ? Math.round((stats.fermes / stats.total) * 100) : 0;
  const charge = stats.total > 0 ? Math.round(((stats.ouverts + stats.en_cours) / stats.total) * 100) : 0;
  const maxMachine = Math.max(...topMachines.map(m => m.count), 1);
  const maxTech = Math.max(...topTechs.map(t => t.resolus), 1);

  return (
    <div style={{ padding: '16px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden', paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Vue synthèse</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </div>

      {!loading && stats.urgents > 0 && (
        <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>{stats.urgents} ticket{stats.urgents > 1 ? 's' : ''} urgent{stats.urgents > 1 ? 's' : ''}</span>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--text-secondary)', padding: 20 }}>Chargement...</div> : (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiMini label="Taux résolution" value={`${tauxResolution}%`} color="#22c55e" sub={`${stats.fermes}/${stats.total}`} icon={Target} />
            <KpiMini label="Charge" value={`${charge}%`} color="#6366f1" sub={`${stats.ouverts} ouverts`} icon={Battery} />
            <KpiMini label="Urgents" value={stats.urgents} color="#ef4444" icon={ShieldAlert} />
            <KpiMini label="En cours" value={stats.en_cours} color="#f59e0b" icon={Wrench} />
            <KpiMini label="Machines" value={stats.machines} color="#0ea5e9" icon={Cpu} />
            <KpiMini label="Techniciens" value={stats.techniciens} color="#8b5cf6" icon={Users} />
          </div>

          {/* Top machines en défaut */}
          {topMachines.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Factory size={15} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Machines avec le + de tickets ouverts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topMachines.map((m, i) => (
                  <div key={m.nom}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{m.nom}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{m.count} ticket{m.count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(m.count / maxMachine) * 100}%`, background: i === 0 ? '#ef4444' : '#f59e0b', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top techniciens */}
          {topTechs.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Trophy size={15} color="#22c55e" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Techniciens — tickets résolus</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topTechs.map((tech, i) => (
                  <div key={tech.prenom + tech.nom}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{tech.prenom} {tech.nom}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{tech.resolus} résolu{tech.resolus > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(tech.resolus / maxTech) * 100}%`, background: i === 0 ? '#22c55e' : '#16a34a', borderRadius: 3, opacity: i === 0 ? 1 : 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

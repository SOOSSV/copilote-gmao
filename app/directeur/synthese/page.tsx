'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, ArrowLeft, Target, Battery, ShieldAlert, Users, Wrench, Cpu, Trophy, Factory, DollarSign } from 'lucide-react';
import Link from 'next/link';

type Stats = {
  total: number; ouverts: number; en_cours: number; fermes: number;
  urgents: number; machines: number; techniciens: number;
};
type MachineStat = { id: string; nom: string; count: number; cout_heure_arret?: number | null };
type TechStat = { prenom: string; nom: string; resolus: number };
type PanneRecurrente = { machine_id: string; machine_nom: string; machine_localisation: string; nb_pannes: number; derniere_panne: string };

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
  const [pannesRecurrentes, setPannesRecurrentes] = useState<PanneRecurrente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ticketsRes, machinesRes, techniciensRes, openTicketsRes, resolvedTicketsRes, machinesCostRes] = await Promise.all([
        supabase.from('tickets').select('statut, priorite'),
        supabase.from('machines').select('id').eq('statut', 'actif'),
        supabase.from('technicians').select('id'),
        supabase.from('tickets').select('machine_id, created_at, machines(nom)').in('statut', ['ouvert', 'en_cours']),
        supabase.from('tickets').select('technicien_id, technicians(prenom, nom)').eq('statut', 'resolu').not('technicien_id', 'is', null),
        supabase.from('machines').select('id, cout_heure_arret'),
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

      // Index coût par machine
      const coutMap: Record<string, number | null> = {};
      for (const m of (machinesCostRes.data || [])) {
        coutMap[m.id] = m.cout_heure_arret ?? null;
      }

      // Top machines avec le + de tickets ouverts + durée arrêt estimée
      const machineMap: Record<string, MachineStat> = {};
      for (const ticket of (openTicketsRes.data || [])) {
        const nom = (ticket.machines as unknown as { nom: string } | null)?.nom;
        if (!nom || !ticket.machine_id) continue;
        if (!machineMap[ticket.machine_id]) machineMap[ticket.machine_id] = { id: ticket.machine_id, nom, count: 0, cout_heure_arret: coutMap[ticket.machine_id] };
        machineMap[ticket.machine_id].count++;
      }
      setTopMachines(Object.values(machineMap).sort((a, b) => b.count - a.count).slice(0, 5));

      // Top techs par tickets résolus
      const techMap: Record<string, TechStat> = {};
      for (const ticket of (resolvedTicketsRes.data || [])) {
        const tech = ticket.technicians as unknown as { prenom: string; nom: string } | null;
        if (!tech || !ticket.technicien_id) continue;
        if (!techMap[ticket.technicien_id]) techMap[ticket.technicien_id] = { prenom: tech.prenom, nom: tech.nom, resolus: 0 };
        techMap[ticket.technicien_id].resolus++;
      }
      setTopTechs(Object.values(techMap).sort((a, b) => b.resolus - a.resolus).slice(0, 5));

      const { data: pr } = await supabase.rpc('get_pannes_recurrentes', { seuil: 3, jours: 30 });
      setPannesRecurrentes((pr as PanneRecurrente[]) || []);

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
            <KpiMini label="Charge" value={`${charge}%`} color="#2563eb" sub={`${stats.ouverts} ouverts`} icon={Battery} />
            <KpiMini label="Urgents" value={stats.urgents} color="#ef4444" icon={ShieldAlert} />
            <KpiMini label="En cours" value={stats.en_cours} color="#f59e0b" icon={Wrench} />
            <KpiMini label="Machines" value={stats.machines} color="#0ea5e9" icon={Cpu} />
            <KpiMini label="Techniciens" value={stats.techniciens} color="#7c3aed" icon={Users} />
          </div>

          {/* Pannes récurrentes */}
          {pannesRecurrentes.length > 0 && (
            <div style={{ background: '#ef444410', border: '1px solid #ef444433', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={15} color="#ef4444" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Pannes récurrentes — 30 jours</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pannesRecurrentes.map(p => (
                  <Link key={p.machine_id} href={`/directeur/machines/${p.machine_id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', background: 'var(--bg-card)', borderRadius: 10, padding: '10px 14px', border: '1px solid #ef444422' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.machine_nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{p.machine_localisation} · dernière {new Date(p.derniere_panne).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{p.nb_pannes}×</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>pannes</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top machines — recommandations actionnables */}
          {topMachines.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Factory size={15} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Machines critiques — action requise</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topMachines.map((m, i) => {
                  const isCritique = i === 0 || m.count >= 3;
                  const couleur = isCritique ? '#ef4444' : '#f59e0b';
                  // Estimation impact financier : durée moy 4h par ticket * cout/h
                  const impactEst = m.cout_heure_arret ? Math.round(m.count * 4 * m.cout_heure_arret) : null;
                  return (
                    <div key={m.nom} style={{ background: `${couleur}08`, border: `1px solid ${couleur}33`, borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {isCritique ? '⚠️ ' : ''}{m.nom}
                          </div>
                          <div style={{ fontSize: 12, color: couleur, fontWeight: 600 }}>
                            {m.count} ticket{m.count > 1 ? 's' : ''} en cours — {isCritique ? 'Situation critique' : 'À surveiller'}
                          </div>
                        </div>
                        {impactEst !== null && (
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                              <DollarSign size={12} color={couleur} />
                              <span style={{ fontSize: 13, fontWeight: 800, color: couleur }}>{impactEst.toLocaleString('fr-FR')}€</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>impact estimé</div>
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/directeur/tickets?filtre=${encodeURIComponent(m.nom)}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${couleur}15`, border: `1px solid ${couleur}44`, borderRadius: 6, padding: '5px 12px', color: couleur, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                      >
                        Voir les tickets →
                      </Link>
                    </div>
                  );
                })}
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

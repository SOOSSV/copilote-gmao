import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Ticket = {
  id: string;
  titre: string;
  description: string;
  machine_id: string;
  technicien_id: string | null;
  type_intervention: 'corrective' | 'preventive';
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  classification: string;
  statut: 'ouvert' | 'en_cours' | 'ferme';
  source: string;
  created_at: string;
  machines?: { nom: string };
  technicians?: { prenom: string; nom: string };
};

export type Machine = {
  id: string;
  nom: string;
  reference: string;
  localisation: string;
  type_machine: string;
  statut: string;
};

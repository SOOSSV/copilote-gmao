-- ============================================================
-- MIGRATION COMPLÈTE — COPILOTE GMAO
-- À coller dans le SQL Editor d'un nouveau projet Supabase
-- ============================================================

-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS machines (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  connector_id uuid,
  external_id text NOT NULL,
  nom text NOT NULL,
  type_equipement text,
  localisation text,
  site text,
  criticite text DEFAULT 'normale',
  statut text DEFAULT 'actif',
  date_installation date,
  metadata jsonb DEFAULT '{}',
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  cout_heure_arret numeric
);

CREATE TABLE IF NOT EXISTS technicians (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  connector_id uuid,
  external_id text,
  nom text NOT NULL,
  prenom text,
  specialites text[] DEFAULT '{}',
  disponible boolean DEFAULT true,
  charge_actuelle integer DEFAULT 0,
  email text,
  telephone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  connector_id uuid,
  external_id text,
  machine_id uuid REFERENCES machines(id),
  titre text NOT NULL,
  description text,
  type_intervention text DEFAULT 'corrective',
  priorite text DEFAULT 'normale',
  statut text DEFAULT 'ouvert',
  technicien_id uuid REFERENCES technicians(id),
  source text DEFAULT 'manuel',
  classification text,
  resolution text,
  duree_intervention_min integer,
  created_by_ai boolean DEFAULT false,
  ai_confidence numeric,
  metadata jsonb DEFAULT '{}',
  ouvert_le timestamptz DEFAULT now(),
  resolu_le timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  diagnostic_ia text
);

CREATE TABLE IF NOT EXISTS preventive_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  machine_id uuid NOT NULL REFERENCES machines(id),
  nom text NOT NULL,
  type_maintenance text DEFAULT 'preventive' NOT NULL,
  frequence_jours integer NOT NULL,
  derniere_exec timestamptz,
  prochaine_exec timestamptz,
  instructions text,
  actif boolean DEFAULT true,
  created_by_ai boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  technicien_id uuid REFERENCES technicians(id),
  description text
);

CREATE TABLE IF NOT EXISTS maintenance_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  machine_id uuid REFERENCES machines(id),
  ticket_id uuid REFERENCES tickets(id),
  type_action text NOT NULL,
  description text,
  technicien_id uuid REFERENCES technicians(id),
  cout_estime numeric,
  cout_reel numeric,
  pieces_changees jsonb DEFAULT '[]',
  observations text,
  realise_le timestamptz NOT NULL,
  duree_min integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stocks (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reference varchar(50) NOT NULL,
  nom varchar(200) NOT NULL,
  description text,
  categorie varchar(100),
  unite varchar(20) DEFAULT 'unité',
  quantite_actuelle numeric DEFAULT 0,
  seuil_minimum numeric DEFAULT 0,
  emplacement varchar(100),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  role text DEFAULT 'manager' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  workflow_id text NOT NULL,
  workflow_name text,
  status text,
  input_data jsonb,
  output_data jsonb,
  error_msg text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- 2. INDEX (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tickets_machine_id ON tickets(machine_id);
CREATE INDEX IF NOT EXISTS idx_tickets_statut ON tickets(statut);
CREATE INDEX IF NOT EXISTS idx_tickets_type_intervention ON tickets(type_intervention);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_technicien_id ON tickets(technicien_id);
CREATE INDEX IF NOT EXISTS idx_preventive_plans_machine_id ON preventive_plans(machine_id);
CREATE INDEX IF NOT EXISTS idx_preventive_plans_actif ON preventive_plans(actif);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_machine_id ON maintenance_history(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_realise_le ON maintenance_history(realise_le DESC);

-- 3. FONCTIONS
-- ============================================================

-- Créer un plan préventif (bypass cache PostgREST)
CREATE OR REPLACE FUNCTION public.create_preventive_plan(
  p_machine_id uuid,
  p_nom text,
  p_description text DEFAULT NULL,
  p_frequence_jours integer DEFAULT 30,
  p_prochaine_exec date DEFAULT NULL,
  p_technicien_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO preventive_plans (machine_id, nom, description, type_maintenance, frequence_jours, prochaine_exec, technicien_id, actif)
  VALUES (p_machine_id, p_nom, p_description, 'preventive', p_frequence_jours, p_prochaine_exec, p_technicien_id, true)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Détecter les pannes récurrentes (≥ seuil pannes en X jours)
CREATE OR REPLACE FUNCTION public.get_pannes_recurrentes(
  seuil integer DEFAULT 3,
  jours integer DEFAULT 30
) RETURNS TABLE(
  machine_id uuid,
  machine_nom text,
  machine_localisation text,
  nb_pannes bigint,
  derniere_panne timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.machine_id,
    m.nom AS machine_nom,
    m.localisation AS machine_localisation,
    COUNT(*)::bigint AS nb_pannes,
    MAX(t.created_at) AS derniere_panne
  FROM tickets t
  JOIN machines m ON m.id = t.machine_id
  WHERE t.created_at >= NOW() - (jours || ' days')::interval
    AND t.type_intervention = 'corrective'
    AND t.statut != 'annule'
    AND t.machine_id IS NOT NULL
  GROUP BY t.machine_id, m.nom, m.localisation
  HAVING COUNT(*) >= seuil
  ORDER BY nb_pannes DESC, derniere_panne DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Métriques MTBF / MTTR / taux résolution par machine
CREATE OR REPLACE FUNCTION public.get_machine_metrics(p_machine_id uuid)
RETURNS TABLE(
  mtbf_jours numeric,
  mttr_heures numeric,
  nb_pannes_total bigint,
  nb_pannes_resolues bigint,
  taux_resolution numeric
) AS $$
DECLARE
  tickets_dates timestamptz[];
  i integer;
  total_gap interval := interval '0';
  nb_gaps integer := 0;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE statut = 'resolu'),
    ROUND(AVG(EXTRACT(EPOCH FROM (resolu_le - created_at)) / 3600)::numeric, 1),
    ROUND((COUNT(*) FILTER (WHERE statut = 'resolu')::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 0)
  INTO nb_pannes_total, nb_pannes_resolues, mttr_heures, taux_resolution
  FROM tickets
  WHERE machine_id = p_machine_id
    AND type_intervention = 'corrective'
    AND resolu_le IS NOT NULL OR (type_intervention = 'corrective' AND machine_id = p_machine_id);

  SELECT ARRAY_AGG(created_at ORDER BY created_at)
  INTO tickets_dates
  FROM tickets
  WHERE machine_id = p_machine_id
    AND type_intervention = 'corrective'
    AND statut = 'resolu';

  IF tickets_dates IS NOT NULL AND array_length(tickets_dates, 1) > 1 THEN
    FOR i IN 1..(array_length(tickets_dates, 1) - 1) LOOP
      total_gap := total_gap + (tickets_dates[i+1] - tickets_dates[i]);
      nb_gaps := nb_gaps + 1;
    END LOOP;
    mtbf_jours := ROUND((EXTRACT(EPOCH FROM total_gap) / nb_gaps / 86400)::numeric, 1);
  ELSE
    mtbf_jours := NULL;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS — désactivé pour usage interne
-- ============================================================

ALTER TABLE machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs DISABLE ROW LEVEL SECURITY;

-- 5. Recharger le cache PostgREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

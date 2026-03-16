import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ijxyluoxrkeqhanmmfbh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeHlsdW94cmtlcWhhbm1tZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzkyMzUsImV4cCI6MjA4MzYxNTIzNX0.Au6oYMOaEIi1Q3j9WJn4S5Q3CCbkDYisRn31NFp1s6A'
);

const machines = [
  { external_id: 'PS-001', nom: 'Pétrin spirale PS-1',           type_equipement: 'Pétrin industriel',     localisation: 'Atelier pétrissage',        criticite: 'haute',   statut: 'actif' },
  { external_id: 'PS-002', nom: 'Pétrin spirale PS-2',           type_equipement: 'Pétrin industriel',     localisation: 'Atelier pétrissage',        criticite: 'haute',   statut: 'actif' },
  { external_id: 'DV-001', nom: 'Diviseuse volumétrique DV-1',   type_equipement: 'Diviseuse',             localisation: 'Ligne façonnage A',         criticite: 'haute',   statut: 'actif' },
  { external_id: 'FA-001', nom: 'Façonneuse baguettes FA-1',     type_equipement: 'Façonneuse',            localisation: 'Ligne façonnage A',         criticite: 'haute',   statut: 'actif' },
  { external_id: 'FA-002', nom: 'Façonneuse baguettes FA-2',     type_equipement: 'Façonneuse',            localisation: 'Ligne façonnage B',         criticite: 'haute',   statut: 'actif' },
  { external_id: 'FT-001', nom: 'Four tunnel FT-1',              type_equipement: 'Four tunnel gaz',       localisation: 'Zone cuisson',              criticite: 'critique', statut: 'actif' },
  { external_id: 'FT-002', nom: 'Four tunnel FT-2',              type_equipement: 'Four tunnel gaz',       localisation: 'Zone cuisson',              criticite: 'critique', statut: 'actif' },
  { external_id: 'CF-001', nom: 'Chambre de fermentation CF-1',  type_equipement: 'Chambre de pousse',     localisation: 'Zone fermentation',         criticite: 'haute',   statut: 'actif' },
  { external_id: 'CF-002', nom: 'Chambre de fermentation CF-2',  type_equipement: 'Chambre de pousse',     localisation: 'Zone fermentation',         criticite: 'haute',   statut: 'actif' },
  { external_id: 'SR-001', nom: 'Spirale de refroidissement SR-1', type_equipement: 'Convoyeur spirale',   localisation: 'Zone refroidissement',      criticite: 'normale', statut: 'actif' },
  { external_id: 'EA-001', nom: 'Ensacheuse automatique EA-1',   type_equipement: 'Ensacheuse',            localisation: 'Ligne conditionnement A',   criticite: 'haute',   statut: 'actif' },
  { external_id: 'EA-002', nom: 'Ensacheuse automatique EA-2',   type_equipement: 'Ensacheuse',            localisation: 'Ligne conditionnement B',   criticite: 'haute',   statut: 'actif' },
  { external_id: 'CA-001', nom: 'Compresseur air CA-1',          type_equipement: 'Compresseur',           localisation: 'Local technique',           criticite: 'critique', statut: 'actif' },
  { external_id: 'GF-001', nom: 'Groupe froid GF-1',             type_equipement: 'Groupe frigorifique',   localisation: 'Local technique',           criticite: 'critique', statut: 'actif' },
  { external_id: 'CV-001', nom: 'Chaudière vapeur CV-1',         type_equipement: 'Chaudière',             localisation: 'Local technique',           criticite: 'critique', statut: 'actif' },
];

const techniciens = [
  { prenom: 'Marc',    nom: 'Dupont',   specialites: ['Mécanique', 'Pneumatique'],     email: 'marc.dupont@boulangerie-europe.fr',    telephone: '06 11 22 33 44', disponible: true, charge_actuelle: 2 },
  { prenom: 'Sophie',  nom: 'Lefebvre', specialites: ['Électrique', 'Automatisme'],    email: 'sophie.lefebvre@boulangerie-europe.fr', telephone: '06 22 33 44 55', disponible: true, charge_actuelle: 1 },
  { prenom: 'Karim',   nom: 'Benali',   specialites: ['Froid', 'CVC', 'Hydraulique'],  email: 'karim.benali@boulangerie-europe.fr',    telephone: '06 33 44 55 66', disponible: true, charge_actuelle: 1 },
  { prenom: 'Julie',   nom: 'Martin',   specialites: ['Mécanique', 'Polyvalent'],      email: 'julie.martin@boulangerie-europe.fr',    telephone: '06 44 55 66 77', disponible: true, charge_actuelle: 0 },
  { prenom: 'Thomas',  nom: 'Petit',    specialites: ['Mécanique'],                    email: 'thomas.petit@boulangerie-europe.fr',    telephone: '06 55 66 77 88', disponible: true, charge_actuelle: 1 },
  { prenom: 'Nadia',   nom: 'Rousseau', specialites: ['Automatisme', 'Électrique'],    email: 'nadia.rousseau@boulangerie-europe.fr',  telephone: '06 66 77 88 99', disponible: false, charge_actuelle: 3 },
];

async function seed() {
  console.log('🚀 Insertion données démo Boulangerie de l\'Europe (Neuhauser Reims)...\n');

  console.log('🧹 Nettoyage...');
  await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('machines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('technicians').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('🏭 Insertion des machines...');
  const { data: machinesData, error: machinesError } = await supabase.from('machines').insert(machines).select();
  if (machinesError) { console.error('❌', machinesError.message); return; }
  console.log(`✅ ${machinesData.length} machines`);

  console.log('👷 Insertion des techniciens...');
  const { data: techData, error: techError } = await supabase.from('technicians').insert(techniciens).select();
  if (techError) { console.error('❌', techError.message); return; }
  console.log(`✅ ${techData.length} techniciens`);

  const mId = {};
  machinesData.forEach(m => mId[m.external_id] = m.id);
  const tId = {};
  techData.forEach(t => tId[t.prenom] = t.id);

  const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

  const tickets = [
    { titre: 'Four tunnel FT-1 — perte de chauffe zone 3', description: 'Chute de température en zone 3. Nominale 240°C, mesurée à 180°C. Impact direct sur la cuisson. 200 000 baguettes/jour en jeu.', machine_id: mId['FT-001'], technicien_id: tId['Marc'], type_intervention: 'corrective', priorite: 'urgente', classification: 'Panne', statut: 'ouvert', source: 'manuel', created_at: daysAgo(0) },
    { titre: 'Compresseur CA-1 — alarme surpression répétée', description: 'Soupape de sécurité ouverte 3 fois en 2h. Risque arrêt général de la ligne pneumatique.', machine_id: mId['CA-001'], technicien_id: tId['Sophie'], type_intervention: 'corrective', priorite: 'urgente', classification: 'Panne', statut: 'en_cours', source: 'manuel', created_at: daysAgo(0) },
    { titre: 'Façonneuse FA-2 — vibrations anormales', description: 'Vibrations importantes en production. Baguettes mal formées, pertes à 15% de cadence.', machine_id: mId['FA-002'], technicien_id: tId['Marc'], type_intervention: 'corrective', priorite: 'haute', classification: 'Dysfonctionnement', statut: 'ouvert', source: 'manuel', created_at: daysAgo(1) },
    { titre: 'Ensacheuse EA-1 — bourrage film répété', description: 'Bourrages toutes les 20 min environ. Rouleau de guidage à remplacer.', machine_id: mId['EA-001'], technicien_id: tId['Thomas'], type_intervention: 'corrective', priorite: 'haute', classification: 'Usure', statut: 'en_cours', source: 'manuel', created_at: daysAgo(1) },
    { titre: 'Chambre CF-1 — température de pousse insuffisante', description: 'Chambre CF-1 n\'atteint plus les 28°C requis. Relevé à 24°C. Temps de pousse rallongé, impact cadence.', machine_id: mId['CF-001'], technicien_id: tId['Karim'], type_intervention: 'corrective', priorite: 'haute', classification: 'Panne', statut: 'ouvert', source: 'manuel', created_at: daysAgo(2) },
    { titre: 'Four tunnel FT-2 — révision préventive trimestrielle', description: 'Nettoyage brûleurs, contrôle joints, vérification régulation, graissage convoyeur sole.', machine_id: mId['FT-002'], technicien_id: tId['Marc'], type_intervention: 'preventive', priorite: 'normale', classification: 'Préventif', statut: 'en_cours', source: 'manuel', created_at: daysAgo(3) },
    { titre: 'Pétrin PS-1 — contrôle usure couteaux et garnitures', description: 'Contrôle mensuel : état couteaux, garnitures caoutchouc, niveau huile réducteur, jeu paliers.', machine_id: mId['PS-001'], technicien_id: tId['Thomas'], type_intervention: 'preventive', priorite: 'normale', classification: 'Préventif', statut: 'resolu', source: 'manuel', created_at: daysAgo(5) },
    { titre: 'Pétrin PS-2 — remplacement courroie trapézoïdale', description: 'Remplacement préventif courroie principale. Durée de vie 6-8 mois atteinte.', machine_id: mId['PS-002'], technicien_id: tId['Marc'], type_intervention: 'preventive', priorite: 'normale', classification: 'Préventif', statut: 'resolu', source: 'manuel', created_at: daysAgo(7) },
    { titre: 'Groupe froid GF-1 — contrôle fluide frigorigène', description: 'Contrôle semestriel : niveau R404A, pression HP/BP, filtre déshydrateur, nettoyage condenseur.', machine_id: mId['GF-001'], technicien_id: tId['Karim'], type_intervention: 'preventive', priorite: 'normale', classification: 'Préventif', statut: 'resolu', source: 'manuel', created_at: daysAgo(10) },
    { titre: 'Chaudière CV-1 — détartrage annuel', description: 'Détartrage échangeur, contrôle soupapes, vérification brûleur gaz, relevé eau.', machine_id: mId['CV-001'], technicien_id: tId['Sophie'], type_intervention: 'preventive', priorite: 'normale', classification: 'Préventif', statut: 'resolu', source: 'manuel', created_at: daysAgo(14) },
    { titre: 'Diviseuse DV-1 — fuite huile hydraulique', description: 'Fuite joint pompe hydraulique. Remplacement joint réf DV-J024 effectué. Contrôle niveau OK.', machine_id: mId['DV-001'], technicien_id: tId['Marc'], type_intervention: 'corrective', priorite: 'haute', classification: 'Fuite', statut: 'resolu', source: 'manuel', created_at: daysAgo(8) },
    { titre: 'Façonneuse FA-1 — remplacement rouleau presseur', description: 'Rouleau presseur central usé. Remplacement effectué, réglage tension, test production OK.', machine_id: mId['FA-001'], technicien_id: tId['Thomas'], type_intervention: 'corrective', priorite: 'haute', classification: 'Usure', statut: 'resolu', source: 'manuel', created_at: daysAgo(12) },
    { titre: 'Spirale SR-1 — blocage convoyeur', description: 'Arrêt sur défaut moteur. Diagnostic surcharge thermique. Nettoyage et remplacement fusible thermique.', machine_id: mId['SR-001'], technicien_id: tId['Nadia'], type_intervention: 'corrective', priorite: 'urgente', classification: 'Panne électrique', statut: 'resolu', source: 'manuel', created_at: daysAgo(15) },
    { titre: 'Ensacheuse EA-2 — mise à jour automate Siemens S7', description: 'Mise à jour programme S7-1200 suite anomalie cadençage. Tests de validation OK sur 2h production.', machine_id: mId['EA-002'], technicien_id: tId['Nadia'], type_intervention: 'corrective', priorite: 'normale', classification: 'Automatisme', statut: 'resolu', source: 'manuel', created_at: daysAgo(20) },
    { titre: 'Chambre CF-2 — remplacement sonde hygrométrie', description: 'Sonde HY-200B défectueuse remplacée. Calibration effectuée. Paramètres fermentation nominaux.', machine_id: mId['CF-002'], technicien_id: tId['Karim'], type_intervention: 'corrective', priorite: 'normale', classification: 'Instrumentation', statut: 'resolu', source: 'manuel', created_at: daysAgo(22) },
  ];

  console.log('🎫 Insertion des tickets...');
  const { data: ticketsData, error: ticketsError } = await supabase.from('tickets').insert(tickets).select();
  if (ticketsError) { console.error('❌', ticketsError.message); return; }
  console.log(`✅ ${ticketsData.length} tickets`);

  console.log('\n🎉 Données démo insérées !');
  console.log(`   🏭 ${machinesData.length} machines (fours tunnel, pétrins, façonneuses...)`);
  console.log(`   👷 ${techData.length} techniciens (méca, élec, froid, automatisme)`);
  console.log(`   🎫 ${ticketsData.length} tickets (urgents, préventifs, résolus)`);
  console.log('\n✅ Prêt pour la démo Neuhauser Reims !');
}

seed();

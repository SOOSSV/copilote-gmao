const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubXB6c3lnZnlhY25oeXVhb2dyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzk3MSwiZXhwIjoyMDg5NDAzOTcxfQ.ttRgPYSkMU4e883Tz0WSWT0NaQLgqHbX6H2w9DzdcLs";
const BASE = "https://nnmpzsygfyacnhyuaogr.supabase.co/rest/v1";
const H = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function post(path, data) {
  const r = await fetch(`${BASE}/${path}`, { method: "POST", headers: H, body: JSON.stringify(data) });
  const json = await r.json();
  if (!r.ok) throw new Error(`${path}: ${JSON.stringify(json)}`);
  return json[0].id;
}

async function del(path) {
  await fetch(`${BASE}/${path}?id=neq.00000000-0000-0000-0000-000000000000`, { method: "DELETE", headers: H });
}

// Nettoyage
console.log("Nettoyage...");
await del("tickets");
await del("preventive_plans");
await del("maintenance_history");
await del("machines");
await del("technicians");

// Techniciens
console.log("Techniciens...");
const t1 = await post("technicians", { external_id:"T001", nom:"Dupont",    prenom:"Marc",    disponible:true,  charge_actuelle:2, equipe:"matin",      email:"m.dupont@rr-gmao.fr",    telephone:"06 12 34 56 78" });
const t2 = await post("technicians", { external_id:"T002", nom:"Martin",    prenom:"Julien",  disponible:true,  charge_actuelle:1, equipe:"matin",      email:"j.martin@rr-gmao.fr",    telephone:"06 23 45 67 89" });
const t3 = await post("technicians", { external_id:"T003", nom:"Leroy",     prenom:"Sophie",  disponible:false, charge_actuelle:3, equipe:"apres_midi", email:"s.leroy@rr-gmao.fr",     telephone:"06 34 56 78 90" });
const t4 = await post("technicians", { external_id:"T004", nom:"Bernard",   prenom:"Thomas",  disponible:true,  charge_actuelle:0, equipe:"nuit",       email:"t.bernard@rr-gmao.fr",   telephone:"06 45 67 89 01" });
const t5 = await post("technicians", { external_id:"T005", nom:"Moreau",    prenom:"Lucas",   disponible:true,  charge_actuelle:1, equipe:"matin",      email:"l.moreau@rr-gmao.fr",    telephone:"06 56 78 90 12" });
const t6 = await post("technicians", { external_id:"T006", nom:"Petit",     prenom:"Camille", disponible:true,  charge_actuelle:2, equipe:"apres_midi", email:"c.petit@rr-gmao.fr",     telephone:"06 67 89 01 23" });
const t7 = await post("technicians", { external_id:"T007", nom:"Roux",      prenom:"Antoine", disponible:false, charge_actuelle:3, equipe:"apres_midi", email:"a.roux@rr-gmao.fr",      telephone:"06 78 90 12 34" });
const t8 = await post("technicians", { external_id:"T008", nom:"Garnier",   prenom:"Nadia",   disponible:true,  charge_actuelle:0, equipe:"nuit",       email:"n.garnier@rr-gmao.fr",   telephone:"06 89 01 23 45" });
console.log("  8 techniciens OK");

// Machines
console.log("Machines...");
const m1 = await post("machines", { external_id:"MCH-001", nom:"Pétrin Spirale #1", type_equipement:"Pétrissage", localisation:"Atelier pétrissage", site:"Boulangerie de l'Europe - Reims", criticite:"haute", statut:"actif", cout_heure_arret:450 });
const m2 = await post("machines", { external_id:"MCH-002", nom:"Pétrin Spirale #2", type_equipement:"Pétrissage", localisation:"Atelier pétrissage", site:"Boulangerie de l'Europe - Reims", criticite:"haute", statut:"actif", cout_heure_arret:450 });
const m3 = await post("machines", { external_id:"MCH-003", nom:"Four Rotatif #1", type_equipement:"Cuisson", localisation:"Atelier cuisson", site:"Boulangerie de l'Europe - Reims", criticite:"critique", statut:"actif", cout_heure_arret:1200 });
const m4 = await post("machines", { external_id:"MCH-004", nom:"Four Rotatif #2", type_equipement:"Cuisson", localisation:"Atelier cuisson", site:"Boulangerie de l'Europe - Reims", criticite:"critique", statut:"actif", cout_heure_arret:1200 });
const m5 = await post("machines", { external_id:"MCH-005", nom:"Laminoir Industriel", type_equipement:"Laminage", localisation:"Atelier façonnage", site:"Boulangerie de l'Europe - Reims", criticite:"haute", statut:"actif", cout_heure_arret:600 });
const m6 = await post("machines", { external_id:"MCH-006", nom:"Diviseuse Automatique", type_equipement:"Division", localisation:"Atelier façonnage", site:"Boulangerie de l'Europe - Reims", criticite:"normale", statut:"actif", cout_heure_arret:300 });
const m7 = await post("machines", { external_id:"MCH-007", nom:"Façonneuse Baguettes", type_equipement:"Façonnage", localisation:"Atelier façonnage", site:"Boulangerie de l'Europe - Reims", criticite:"normale", statut:"actif", cout_heure_arret:300 });
const m8 = await post("machines", { external_id:"MCH-008", nom:"Chambre de Fermentation", type_equipement:"Fermentation", localisation:"Zone fermentation", site:"Boulangerie de l'Europe - Reims", criticite:"critique", statut:"actif", cout_heure_arret:900 });
const m9 = await post("machines", { external_id:"MCH-009", nom:"Trancheuse Industrielle", type_equipement:"Tranchage", localisation:"Atelier conditionnement", site:"Boulangerie de l'Europe - Reims", criticite:"normale", statut:"actif", cout_heure_arret:250 });
const m10 = await post("machines", { external_id:"MCH-010", nom:"Compresseur Air", type_equipement:"Utilité", localisation:"Local technique", site:"Boulangerie de l'Europe - Reims", criticite:"haute", statut:"actif", cout_heure_arret:800 });
console.log("  10 machines OK");

// Tickets
console.log("Tickets...");
const tickets = [
  { machine_id:m3, technicien_id:t1, titre:"Brûleur four rotatif #1 — extinction intempestive", description:"Le brûleur s'éteint aléatoirement en cours de cuisson. Arrêt production 2h.", type_intervention:"corrective", priorite:"urgente", statut:"resolu", source:"manuel", resolu_le:"2026-03-10T14:00:00+00:00", diagnostic_ia:"Défaut détecteur de flamme UV. Remplacement capteur recommandé." },
  { machine_id:m1, technicien_id:t2, titre:"Pétrin #1 — vibrations anormales", description:"Vibrations importantes sur le bras pétrisseur, bruit métallique suspect.", type_intervention:"corrective", priorite:"haute", statut:"en_cours", source:"manuel", diagnostic_ia:"Usure probable du roulement de bras. Contrôle et remplacement préventif conseillé." },
  { machine_id:m8, technicien_id:t3, titre:"Chambre fermentation — température instable", description:"Écarts de ±4°C constatés. Produits non conformes, pertes signalées.", type_intervention:"corrective", priorite:"urgente", statut:"ouvert", source:"manuel", diagnostic_ia:"Sonde température défaillante ou fuite circuit froid. Diagnostic froid prioritaire." },
  { machine_id:m5, technicien_id:t2, titre:"Laminoir — rouleau presseur bloqué", description:"Le rouleau presseur ne descend plus à la bonne hauteur, épaisseur pâte incorrecte.", type_intervention:"corrective", priorite:"haute", statut:"resolu", source:"manuel", resolu_le:"2026-03-15T11:30:00+00:00", diagnostic_ia:"Vérin pneumatique HS. Remplacement effectué." },
  { machine_id:m4, technicien_id:t1, titre:"Four rotatif #2 — révision annuelle", description:"Révision complète: brûleur, joints, chariot rotatif, nettoyage résistances.", type_intervention:"preventive", priorite:"normale", statut:"resolu", source:"manuel", resolu_le:"2026-02-20T17:00:00+00:00" },
  { machine_id:m6, technicien_id:t4, titre:"Diviseuse — calibration grammage", description:"Écart de 15g constaté sur pesées. Recalibration nécessaire.", type_intervention:"corrective", priorite:"normale", statut:"resolu", source:"manuel", resolu_le:"2026-03-12T09:00:00+00:00", diagnostic_ia:"Ressort compensateur fatigué. Remplacement et recalibration effectués." },
  { machine_id:m2, technicien_id:t2, titre:"Pétrin #2 — mise à niveau préventive", description:"Vérification courroies, lubrification, contrôle motoréducteur.", type_intervention:"preventive", priorite:"basse", statut:"ouvert", source:"manuel" },
  { machine_id:m10, technicien_id:t1, titre:"Compresseur — chute pression réseau", description:"Pression réseau tombée à 5 bars au lieu de 7. Fuites détectées sur raccords.", type_intervention:"corrective", priorite:"haute", statut:"en_cours", source:"manuel", diagnostic_ia:"Fuites multiples sur raccords pneumatiques atelier façonnage. Remplacement joints nécessaire." },
  { machine_id:m3, technicien_id:t1, titre:"Four rotatif #1 — panne brûleur récurrente #2", description:"2ème incident brûleur en 15 jours. Problème non résolu.", type_intervention:"corrective", priorite:"urgente", statut:"ouvert", source:"manuel", diagnostic_ia:"Problème systémique sur alimentation gaz. Vérifier régulateur pression gaz." },
  { machine_id:m3, technicien_id:t3, titre:"Four rotatif #1 — détecteur flamme HS", description:"Détecteur de flamme tombé en panne à nouveau.", type_intervention:"corrective", priorite:"urgente", statut:"resolu", source:"manuel", resolu_le:"2026-03-05T16:00:00+00:00" },
  { machine_id:m3, technicien_id:t2, titre:"Four rotatif #1 — surchauffe chambre", description:"Température chambre dépasse 280°C au lieu de 240°C. Alarme déclenchée.", type_intervention:"corrective", priorite:"urgente", statut:"resolu", source:"manuel", resolu_le:"2026-03-01T10:00:00+00:00", diagnostic_ia:"Thermostat défaillant. Remplacement effectué." },
  { machine_id:m9, technicien_id:t4, titre:"Trancheuse — lame émoussée", description:"Qualité de coupe dégradée, épaisseur tranches irrégulière.", type_intervention:"corrective", priorite:"normale", statut:"resolu", source:"manuel", resolu_le:"2026-03-08T10:00:00+00:00" },
  { machine_id:m7, technicien_id:t2, titre:"Façonneuse — upgrade rouleaux anti-adhésifs", description:"Remplacement des rouleaux standards par rouleaux anti-adhésifs pour réduire les pertes de pâte.", type_intervention:"ameliorative", priorite:"normale", statut:"ouvert", source:"manuel" },
  { machine_id:m1, technicien_id:t4, titre:"Pétrin #1 — capteur vibrations IoT", description:"Installation capteur vibrations connecté pour surveillance temps réel et détection précoce pannes.", type_intervention:"ameliorative", priorite:"haute", statut:"en_cours", source:"manuel" },
  { machine_id:m2, technicien_id:t3, titre:"Pétrin #2 — fuite huile motoréducteur", description:"Trace d'huile constatée sous le motoréducteur. Niveau bas.", type_intervention:"corrective", priorite:"normale", statut:"ouvert", source:"manuel", diagnostic_ia:"Joint spi motoréducteur défaillant. Remplacement nécessaire sous 48h." },
];
for (const tk of tickets) await post("tickets", tk);
console.log(`  ${tickets.length} tickets OK`);

// Plans préventifs
console.log("Plans préventifs...");
const plans = [
  { machine_id:m3, nom:"Révision mensuelle Four Rotatif #1", description:"Contrôle brûleur, joints porte, graissage chariot, nettoyage résistances", type_maintenance:"preventive", frequence_jours:30, prochaine_exec:"2026-04-01T08:00:00+00:00", technicien_id:t1, actif:true },
  { machine_id:m4, nom:"Révision mensuelle Four Rotatif #2", description:"Contrôle brûleur, joints porte, graissage chariot, nettoyage résistances", type_maintenance:"preventive", frequence_jours:30, prochaine_exec:"2026-04-05T08:00:00+00:00", technicien_id:t1, actif:true },
  { machine_id:m1, nom:"Entretien trimestriel Pétrin #1", description:"Vérification courroies, lubrification roulements, contrôle serrage boulons", type_maintenance:"preventive", frequence_jours:90, prochaine_exec:"2026-05-01T08:00:00+00:00", technicien_id:t2, actif:true },
  { machine_id:m2, nom:"Entretien trimestriel Pétrin #2", description:"Vérification courroies, lubrification roulements, contrôle serrage boulons", type_maintenance:"preventive", frequence_jours:90, prochaine_exec:"2026-05-15T08:00:00+00:00", technicien_id:t2, actif:true },
  { machine_id:m8, nom:"Contrôle hebdo Chambre Fermentation", description:"Vérification températures, contrôle hygrométrie, nettoyage filtres", type_maintenance:"preventive", frequence_jours:7, prochaine_exec:"2026-03-25T08:00:00+00:00", technicien_id:t3, actif:true },
  { machine_id:m10, nom:"Contrôle mensuel Compresseur Air", description:"Vidange condensats, contrôle filtres, vérification pression, niveau huile", type_maintenance:"preventive", frequence_jours:30, prochaine_exec:"2026-04-10T08:00:00+00:00", technicien_id:t4, actif:true },
  { machine_id:m5, nom:"Entretien semestriel Laminoir", description:"Vérification rouleaux, tension courroies, lubrification complète", type_maintenance:"preventive", frequence_jours:180, prochaine_exec:"2026-06-01T08:00:00+00:00", technicien_id:t2, actif:true },
];
for (const p of plans) await post("preventive_plans", p);
console.log(`  ${plans.length} plans préventifs OK`);

// Stocks / pièces détachées
console.log("Stocks...");
await fetch(`${BASE}/stocks?id=neq.00000000-0000-0000-0000-000000000000`, { method: "DELETE", headers: H });
const stocks = [
  { reference:"RLT-6205",  nom:"Roulement 6205-2RS",              categorie:"Roulements",   unite:"pcs",   quantite_actuelle:12, seuil_minimum:4,  emplacement:"Armoire A - E3", description:"Roulement à billes, étanche, pour pétrins",              actif:true },
  { reference:"RLT-6208",  nom:"Roulement 6208-2RS",              categorie:"Roulements",   unite:"pcs",   quantite_actuelle:6,  seuil_minimum:4,  emplacement:"Armoire A - E4", description:"Roulement à billes pour laminoir et diviseuse",           actif:true },
  { reference:"CRR-A25",   nom:"Courroie trapézoïdale A25",       categorie:"Courroies",    unite:"pcs",   quantite_actuelle:3,  seuil_minimum:4,  emplacement:"Armoire B - E1", description:"Courroie transmission pétrins",                          actif:true },
  { reference:"CRR-B38",   nom:"Courroie trapézoïdale B38",       categorie:"Courroies",    unite:"pcs",   quantite_actuelle:8,  seuil_minimum:3,  emplacement:"Armoire B - E2", description:"Courroie laminoir industriel",                           actif:true },
  { reference:"JNT-SIL10", nom:"Joint silicone haute température",categorie:"Joints",       unite:"m",     quantite_actuelle:15, seuil_minimum:5,  emplacement:"Armoire C - E1", description:"Joint porte four, résistant 300°C",                      actif:true },
  { reference:"JNT-NBR08", nom:"Joint NBR Ø8mm",                  categorie:"Joints",       unite:"pcs",   quantite_actuelle:50, seuil_minimum:20, emplacement:"Armoire C - E2", description:"Joint pour raccords pneumatiques",                       actif:true },
  { reference:"LUB-G500",  nom:"Graisse alimentaire NSF H1 500g", categorie:"Lubrifiants",  unite:"pot",   quantite_actuelle:7,  seuil_minimum:3,  emplacement:"Armoire D - E1", description:"Graisse certifiée contact alimentaire",                  actif:true },
  { reference:"LUB-H10L",  nom:"Huile hydraulique ISO 46 — 10L",  categorie:"Lubrifiants",  unite:"bidon", quantite_actuelle:4,  seuil_minimum:2,  emplacement:"Armoire D - E2", description:"Huile compresseur et vérins hydrauliques",               actif:true },
  { reference:"DET-UV1",   nom:"Détecteur de flamme UV",          categorie:"Électronique", unite:"pcs",   quantite_actuelle:2,  seuil_minimum:2,  emplacement:"Armoire E - E1", description:"Détecteur pour brûleur four rotatif Siemens",            actif:true },
  { reference:"SND-PT100", nom:"Sonde température PT100",         categorie:"Électronique", unite:"pcs",   quantite_actuelle:3,  seuil_minimum:2,  emplacement:"Armoire E - E2", description:"Sonde chambre de fermentation et fours",                 actif:true },
  { reference:"FIL-AIR3",  nom:"Filtre à air comprimé 3/4\"",    categorie:"Pneumatique",  unite:"pcs",   quantite_actuelle:5,  seuil_minimum:3,  emplacement:"Armoire F - E1", description:"Filtre ligne air comprimé compresseur",                  actif:true },
  { reference:"RCC-6A25",  nom:"Raccord rapide pneumatique Ø6",   categorie:"Pneumatique",  unite:"pcs",   quantite_actuelle:2,  seuil_minimum:5,  emplacement:"Armoire F - E2", description:"Raccord push-in pour flexible pneumatique",              actif:true },
  { reference:"FUS-10A",   nom:"Fusible 10A temporisé",           categorie:"Électrique",   unite:"pcs",   quantite_actuelle:30, seuil_minimum:10, emplacement:"Armoire G - E1", description:"Fusible protection moteurs",                             actif:true },
  { reference:"CON-3P9A",  nom:"Contacteur tripolaire 9A",        categorie:"Électrique",   unite:"pcs",   quantite_actuelle:2,  seuil_minimum:2,  emplacement:"Armoire G - E2", description:"Contacteur démarrage moteur pétrin",                     actif:true },
  { reference:"LME-INX4",  nom:"Lame inox trancheuse",            categorie:"Consommables", unite:"pcs",   quantite_actuelle:6,  seuil_minimum:3,  emplacement:"Armoire H - E1", description:"Lame de rechange trancheuse industrielle",               actif:true },
];
for (const s of stocks) await post("stocks", s);
console.log(`  ${stocks.length} articles en stock OK`);

// Historique de maintenance
console.log("Historique maintenance...");
await fetch(`${BASE}/maintenance_history?id=neq.00000000-0000-0000-0000-000000000000`, { method: "DELETE", headers: H });
const histories = [
  { machine_id:m3, technicien_id:t1, type_action:"intervention", description:"Remplacement détecteur de flamme UV brûleur four rotatif #1", pieces_changees:[{nom:"Détecteur de flamme UV",quantite:1,unite:"pcs"}], observations:"Panne récurrente — 3e remplacement en 2 mois", realise_le:"2026-03-10T14:00:00+00:00" },
  { machine_id:m3, technicien_id:t3, type_action:"intervention", description:"Remplacement thermostat chambre four rotatif #1", pieces_changees:[{nom:"Sonde température PT100",quantite:1,unite:"pcs"}], observations:"Thermostat défaillant — surchauffe 280°C", realise_le:"2026-03-01T10:00:00+00:00" },
  { machine_id:m3, technicien_id:t2, type_action:"intervention", description:"Remplacement détecteur flamme — 2e incident", pieces_changees:[{nom:"Détecteur de flamme UV",quantite:1,unite:"pcs"},{nom:"Fusible 10A temporisé",quantite:2,unite:"pcs"}], observations:"Problème alimentation gaz identifié", realise_le:"2026-03-05T16:00:00+00:00" },
  { machine_id:m5, technicien_id:t2, type_action:"intervention", description:"Remplacement vérin pneumatique laminoir", pieces_changees:[{nom:"Joint NBR Ø8mm",quantite:4,unite:"pcs"},{nom:"Raccord rapide pneumatique Ø6",quantite:2,unite:"pcs"}], observations:"Vérin HS — rouleau presseur bloqué", realise_le:"2026-03-15T11:30:00+00:00" },
  { machine_id:m4, technicien_id:t1, type_action:"inspection", description:"Révision annuelle four rotatif #2", pieces_changees:[{nom:"Joint silicone haute température",quantite:2,unite:"m"},{nom:"Graisse alimentaire NSF H1 500g",quantite:1,unite:"pot"}], observations:"Révision complète OK — chariot graissé, joints remplacés", realise_le:"2026-02-20T17:00:00+00:00" },
  { machine_id:m6, technicien_id:t4, type_action:"intervention", description:"Recalibration diviseuse automatique", pieces_changees:[], observations:"Ressort compensateur remplacé — grammage OK ±2g", realise_le:"2026-03-12T09:00:00+00:00" },
  { machine_id:m9, technicien_id:t4, type_action:"intervention", description:"Remplacement lame trancheuse industrielle", pieces_changees:[{nom:"Lame inox trancheuse",quantite:1,unite:"pcs"}], observations:"Lame émoussée — qualité coupe restaurée", realise_le:"2026-03-08T10:00:00+00:00" },
  { machine_id:m1, technicien_id:t2, type_action:"inspection", description:"Contrôle préventif pétrin #1 — roulements", pieces_changees:[{nom:"Graisse alimentaire NSF H1 500g",quantite:1,unite:"pot"}], observations:"Vibrations résiduelles — roulements à surveiller", realise_le:"2026-03-14T09:00:00+00:00" },
  { machine_id:m10, technicien_id:t1, type_action:"intervention", description:"Remplacement joints raccords pneumatiques compresseur", pieces_changees:[{nom:"Joint NBR Ø8mm",quantite:8,unite:"pcs"},{nom:"Raccord rapide pneumatique Ø6",quantite:3,unite:"pcs"},{nom:"Filtre à air comprimé 3/4\"",quantite:1,unite:"pcs"}], observations:"Fuites multiples atelier façonnage — pression restaurée 7 bars", realise_le:"2026-03-17T15:00:00+00:00" },
];
for (const h of histories) await post("maintenance_history", h);
console.log(`  ${histories.length} entrées historique OK`);

console.log("\n✅ TERMINÉ ! Toutes les données sont insérées.");
console.log("  - 8 techniciens");
console.log("  - 10 machines");
console.log(`  - ${tickets.length} tickets`);
console.log(`  - ${plans.length} plans préventifs`);
console.log(`  - ${stocks.length} articles en stock`);
console.log(`  - ${histories.length} entrées historique maintenance`);

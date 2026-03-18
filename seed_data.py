import urllib.request
import json

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubXB6c3lnZnlhY25oeXVhb2dyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzk3MSwiZXhwIjoyMDg5NDAzOTcxfQ.ttRgPYSkMU4e883Tz0WSWT0NaQLgqHbX6H2w9DzdcLs"
BASE = "https://nnmpzsygfyacnhyuaogr.supabase.co/rest/v1"
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}/{path}", data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())[0]["id"]

def delete_all(path):
    req = urllib.request.Request(
        f"{BASE}/{path}?id=neq.00000000-0000-0000-0000-000000000000",
        headers=HEADERS, method="DELETE"
    )
    try:
        urllib.request.urlopen(req)
    except:
        pass

# Nettoyage
print("Nettoyage...")
delete_all("tickets")
delete_all("preventive_plans")
delete_all("maintenance_history")
delete_all("machines")
delete_all("technicians")

# Techniciens
print("Insertion techniciens...")
t1 = post("technicians", {"external_id":"T001","nom":"Dupont","prenom":"Marc","disponible":True,"charge_actuelle":2,"email":"m.dupont@boulangerie-europe.fr","telephone":"06 12 34 56 78"})
t2 = post("technicians", {"external_id":"T002","nom":"Martin","prenom":"Julien","disponible":True,"charge_actuelle":1,"email":"j.martin@boulangerie-europe.fr","telephone":"06 23 45 67 89"})
t3 = post("technicians", {"external_id":"T003","nom":"Leroy","prenom":"Sophie","disponible":False,"charge_actuelle":3,"email":"s.leroy@boulangerie-europe.fr","telephone":"06 34 56 78 90"})
t4 = post("technicians", {"external_id":"T004","nom":"Bernard","prenom":"Thomas","disponible":True,"charge_actuelle":0,"email":"t.bernard@boulangerie-europe.fr","telephone":"06 45 67 89 01"})
print(f"  4 techniciens OK")

# Machines
print("Insertion machines...")
m1 = post("machines", {"external_id":"MCH-001","nom":"Petrin Spirale 1","type_equipement":"Petrissage","localisation":"Atelier petrissage","site":"Boulangerie de l Europe - Reims","criticite":"haute","statut":"actif","cout_heure_arret":450})
m2 = post("machines", {"external_id":"MCH-002","nom":"Petrin Spirale 2","type_equipement":"Petrissage","localisation":"Atelier petrissage","site":"Boulangerie de l Europe - Reims","criticite":"haute","statut":"actif","cout_heure_arret":450})
m3 = post("machines", {"external_id":"MCH-003","nom":"Four Rotatif 1","type_equipement":"Cuisson","localisation":"Atelier cuisson","site":"Boulangerie de l Europe - Reims","criticite":"critique","statut":"actif","cout_heure_arret":1200})
m4 = post("machines", {"external_id":"MCH-004","nom":"Four Rotatif 2","type_equipement":"Cuisson","localisation":"Atelier cuisson","site":"Boulangerie de l Europe - Reims","criticite":"critique","statut":"actif","cout_heure_arret":1200})
m5 = post("machines", {"external_id":"MCH-005","nom":"Laminoir Industriel","type_equipement":"Laminage","localisation":"Atelier faconnage","site":"Boulangerie de l Europe - Reims","criticite":"haute","statut":"actif","cout_heure_arret":600})
m6 = post("machines", {"external_id":"MCH-006","nom":"Diviseuse Automatique","type_equipement":"Division","localisation":"Atelier faconnage","site":"Boulangerie de l Europe - Reims","criticite":"normale","statut":"actif","cout_heure_arret":300})
m7 = post("machines", {"external_id":"MCH-007","nom":"Faconneuse Baguettes","type_equipement":"Facconnage","localisation":"Atelier faconnage","site":"Boulangerie de l Europe - Reims","criticite":"normale","statut":"actif","cout_heure_arret":300})
m8 = post("machines", {"external_id":"MCH-008","nom":"Chambre de Fermentation","type_equipement":"Fermentation","localisation":"Zone fermentation","site":"Boulangerie de l Europe - Reims","criticite":"critique","statut":"actif","cout_heure_arret":900})
m9 = post("machines", {"external_id":"MCH-009","nom":"Trancheuse Industrielle","type_equipement":"Tranchage","localisation":"Atelier conditionnement","site":"Boulangerie de l Europe - Reims","criticite":"normale","statut":"actif","cout_heure_arret":250})
m10 = post("machines", {"external_id":"MCH-010","nom":"Compresseur Air","type_equipement":"Utilite","localisation":"Local technique","site":"Boulangerie de l Europe - Reims","criticite":"haute","statut":"actif","cout_heure_arret":800})
print(f"  10 machines OK")

# Tickets
print("Insertion tickets...")
tickets = [
    {"machine_id":m3,"technicien_id":t1,"titre":"Bruleur four rotatif 1 extinction intempestive","description":"Le bruleur s eteint aleatoirement en cours de cuisson. Arret production 2h.","type_intervention":"corrective","priorite":"urgente","statut":"resolu","source":"manuel","resolu_le":"2026-03-10T14:00:00+00:00","diagnostic_ia":"Defaut detecteur de flamme UV. Remplacement capteur recommande."},
    {"machine_id":m1,"technicien_id":t2,"titre":"Petrin 1 vibrations anormales","description":"Vibrations importantes sur le bras petrisseur, bruit metallique suspect.","type_intervention":"corrective","priorite":"haute","statut":"en_cours","source":"manuel","diagnostic_ia":"Usure probable du roulement de bras. Controle et remplacement preventif conseille."},
    {"machine_id":m8,"technicien_id":t3,"titre":"Chambre fermentation temperature instable","description":"Ecarts de +/-4C constates. Produits non conformes, pertes signalees.","type_intervention":"corrective","priorite":"urgente","statut":"ouvert","source":"manuel","diagnostic_ia":"Sonde temperature defaillante ou fuite circuit froid. Diagnostic froid prioritaire."},
    {"machine_id":m5,"technicien_id":t2,"titre":"Laminoir rouleau presseur bloque","description":"Le rouleau presseur ne descend plus a la bonne hauteur, epaisseur pate incorrecte.","type_intervention":"corrective","priorite":"haute","statut":"resolu","source":"manuel","resolu_le":"2026-03-15T11:30:00+00:00","diagnostic_ia":"Verin pneumatique HS. Remplacement effectue."},
    {"machine_id":m4,"technicien_id":t1,"titre":"Four rotatif 2 revision annuelle","description":"Revision complete: bruleur, joints, chariot rotatif, nettoyage resistances.","type_intervention":"preventive","priorite":"normale","statut":"resolu","source":"manuel","resolu_le":"2026-02-20T17:00:00+00:00"},
    {"machine_id":m6,"technicien_id":t4,"titre":"Diviseuse calibration grammage","description":"Ecart de 15g constate sur pesees. Recalibration necessaire.","type_intervention":"corrective","priorite":"normale","statut":"resolu","source":"manuel","resolu_le":"2026-03-12T09:00:00+00:00","diagnostic_ia":"Ressort compensateur fatigue. Remplacement et recalibration effectues."},
    {"machine_id":m2,"technicien_id":t2,"titre":"Petrin 2 mise a niveau preventive","description":"Verification courroies, lubrification, controle motoreducteur.","type_intervention":"preventive","priorite":"basse","statut":"ouvert","source":"manuel"},
    {"machine_id":m10,"technicien_id":t1,"titre":"Compresseur chute pression reseau","description":"Pression reseau tombee a 5 bars au lieu de 7. Fuites detectees sur raccords.","type_intervention":"corrective","priorite":"haute","statut":"en_cours","source":"manuel","diagnostic_ia":"Fuites multiples sur raccords pneumatiques atelier faconnage. Remplacement joints necessaire."},
    {"machine_id":m3,"technicien_id":t1,"titre":"Four rotatif 1 panne bruleur recurrente","description":"3eme incident sur bruleur en 30 jours. Probleme non resolu.","type_intervention":"corrective","priorite":"urgente","statut":"ouvert","source":"manuel","diagnostic_ia":"Probleme systemique sur alimentation gaz. Verifier regulateur pression gaz."},
    {"machine_id":m3,"technicien_id":t3,"titre":"Four rotatif 1 detecteur flamme HS","description":"Detecteur de flamme tombe en panne a nouveau.","type_intervention":"corrective","priorite":"urgente","statut":"resolu","source":"manuel","resolu_le":"2026-03-05T16:00:00+00:00"},
    {"machine_id":m3,"technicien_id":t2,"titre":"Four rotatif 1 surchauffe chambre","description":"Temperature chambre depasse 280C au lieu de 240C. Alarme declenchee.","type_intervention":"corrective","priorite":"urgente","statut":"resolu","source":"manuel","resolu_le":"2026-03-01T10:00:00+00:00","diagnostic_ia":"Thermostat defaillant. Remplacement effectue."},
    {"machine_id":m9,"technicien_id":t4,"titre":"Trancheuse lame emoussee","description":"Qualite de coupe degradee, epaisseur tranches irreguliere.","type_intervention":"corrective","priorite":"normale","statut":"resolu","source":"manuel","resolu_le":"2026-03-08T10:00:00+00:00"},
    {"machine_id":m7,"technicien_id":t2,"titre":"Faconneuse upgrade rouleaux anti-adhesifs","description":"Remplacement des rouleaux standards par rouleaux anti-adhesifs pour reduire les pertes de pate.","type_intervention":"ameliorative","priorite":"normale","statut":"ouvert","source":"manuel"},
    {"machine_id":m1,"technicien_id":t4,"titre":"Petrin 1 ajout capteur vibrations IoT","description":"Installation capteur vibrations connecte pour surveillance temps reel et detection precoce pannes.","type_intervention":"ameliorative","priorite":"haute","statut":"en_cours","source":"manuel"},
]

for tk in tickets:
    post("tickets", tk)
print(f"  {len(tickets)} tickets OK")

# Plans preventifs
print("Insertion plans preventifs...")
plans = [
    {"machine_id":m3,"nom":"Revision mensuelle Four Rotatif 1","description":"Controle bruleur, joints porte, graissage chariot, nettoyage resistances","type_maintenance":"preventive","frequence_jours":30,"prochaine_exec":"2026-04-01T08:00:00+00:00","technicien_id":t1,"actif":True},
    {"machine_id":m4,"nom":"Revision mensuelle Four Rotatif 2","description":"Controle bruleur, joints porte, graissage chariot, nettoyage resistances","type_maintenance":"preventive","frequence_jours":30,"prochaine_exec":"2026-04-05T08:00:00+00:00","technicien_id":t1,"actif":True},
    {"machine_id":m1,"nom":"Entretien trimestriel Petrin 1","description":"Verification courroies, lubrification roulements, controle serrage boulons","type_maintenance":"preventive","frequence_jours":90,"prochaine_exec":"2026-05-01T08:00:00+00:00","technicien_id":t2,"actif":True},
    {"machine_id":m8,"nom":"Controle hebdo Chambre Fermentation","description":"Verification temperatures, controle hygrometrie, nettoyage filtres","type_maintenance":"preventive","frequence_jours":7,"prochaine_exec":"2026-03-25T08:00:00+00:00","technicien_id":t3,"actif":True},
    {"machine_id":m10,"nom":"Controle mensuel Compresseur","description":"Vidange condensats, controle filtres, verification pression, huile","type_maintenance":"preventive","frequence_jours":30,"prochaine_exec":"2026-04-10T08:00:00+00:00","technicien_id":t4,"actif":True},
]
for p in plans:
    post("preventive_plans", p)
print(f"  {len(plans)} plans preventifs OK")

print("\nTERMINE ! Toutes les donnees sont inserees.")

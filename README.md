# Deux Côtés (nom provisoire)

Site statique pour frontaliers Lorraine ↔ Luxembourg : pré-diagnostic (retraite FR + LU, impôts récupérables, capacité d'emprunt), estimateur de fiche de paie brut → net, prise de rendez-vous.

## Fichiers

- `index.html` : page principale (diagnostic en 6 questions, résultats, rendez-vous, méthode et sources, FAQ).
- `salaire.html` : estimateur brut → net ligne par ligne.
- `style.css` : feuille de style partagée.
- `calc.js` : moteur de calcul (cotisations et impôt luxembourgeois, crédits d'impôt, pension CNAP, pension française, capacité d'emprunt). Chaque constante porte sa source dans l'objet `P`.
- `calc.test.js` : contrôles contre des exemples officiels (ACD, CNAP, CSA).
- `tools/build_artifact.py` : construit les fichiers publiés comme artefact claude.ai (CSS et moteur inclus dans les pages).

## Commandes

```
node calc.test.js                              # contrôles du moteur
python3 -m http.server 8080                    # serveur local : http://localhost:8080/
python3 -I tools/build_artifact.py . dist      # fichiers publiables dans dist/
```

## À faire

- Choisir le nom définitif (domaines libres vérifiés le 3 novembre 2026 : deuxcotes.fr, deuxcotes.lu, luxcalcul.fr, luxcalcul.com).
- Brancher le formulaire de rendez-vous (aucune donnée n'est envoyée pour l'instant).
- Rédiger les mentions légales et la politique de confidentialité.

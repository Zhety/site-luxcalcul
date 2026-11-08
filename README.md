# brutnet.lu

Site statique pour frontaliers et résidents du Luxembourg, publié sur https://brutnet.lu (GitHub Pages, domaine chez OVH).

## Pages

- `index.html` : calculateur salaire brut → net Luxembourg 2026, exemples, explications, FAQ.
- `impot-frontalier.html` : guide de la déclaration d'impôts du frontalier France ↔ Luxembourg.
- `diagnostic.html` : pré-diagnostic en 6 questions (retraite FR + LU, impôts récupérables, capacité d'emprunt), prise de rendez-vous, méthode et sources.
- `salaire.html` : ancienne adresse de l'estimateur, redirige vers `/`.
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.*`, `apple-touch-icon.png`, `img/` : fichiers techniques et SEO.

## Code

- `style.css` : feuille de style partagée.
- `calc.js` : moteur de calcul (cotisations et impôt luxembourgeois, crédits d'impôt, pension CNAP, pension française, capacité d'emprunt). Chaque constante porte sa source dans l'objet `P`.
- `tools/leads.gs` : réception des demandes de rappel (Google Apps Script → feuille « Leads » + e-mail). Mode d'installation en tête du fichier ; l'URL `/exec` du déploiement va dans `LEADS_URL` (diagnostic.html).
- `calc.test.js` : contrôles contre des exemples officiels (ACD, CNAP, CSA), et vérification que les montants écrits dans les pages correspondent au moteur.

## Commandes

```
node calc.test.js              # contrôles du moteur et des chiffres des pages
python3 -m http.server 8080    # serveur local : http://localhost:8080/
git push                       # publie sur brutnet.lu
```

Quand un paramètre change (indexation, nouveau barème), mettre à jour `calc.js`, relancer les tests : ils signalent les montants à corriger dans les pages, ainsi que `<lastmod>` dans `sitemap.xml`.

## À faire

- Déployer `tools/leads.gs` et renseigner `LEADS_URL` : tant qu'il est vide, le formulaire affiche « ouvre très bientôt ».
- Leads : `api-mail/` est une fonction Vercel (projet brutnet-api, équipe 100diag) qui envoie le lead à info@brutnet.lu et une confirmation au visiteur, via le SMTP OVH de info@brutnet.lu. Mise à jour : `cd api-mail && npx vercel deploy --prod`. Variables : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO.

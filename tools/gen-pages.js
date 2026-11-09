/* Génère les pages SEO calculées par le moteur (calc.js) :
 *   salaire-brut-net/<montant>-euros.html   une page par salaire brut
 *   tableau-salaire-brut-net-luxembourg.html grille complète
 *   salaire-minimum-luxembourg.html          SSM 2026
 *   sitemap.xml
 * Lancer : node tools/gen-pages.js   (puis node calc.test.js) */
const fs = require("fs"), path = require("path");
const D = require("../calc.js");
const ROOT = path.join(__dirname, "..");
const SITE = "https://brutnet.lu";
const TODAY = "2026-11-09";
const SSM = D.P.lu.ssm, SSMQ = Math.round(SSM * 1.2 * 100) / 100;

const AMOUNTS = [];
for (let g = 3000; g <= 8000; g += 250) AMOUNTS.push(g);
AMOUNTS.push(8500, 9000, 9500, 10000, 11000, 12000, 15000);

/* même format que les pages et que calc.test.js : espaces simples */
const f2 = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, " ");
const f0 = (n) => Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ");
const gLabel = (g) => (Number.isInteger(g) ? f0(g) : f2(g));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const slugOf = (g) => `/salaire-brut-net/${g}-euros`;

function calc(g) {
  const c1 = D.payslip(g, 1, 0, {}), c2 = D.payslip(g, 2, 0, {}), c1a = D.payslip(g, "1a", 0, { cim: true });
  const b1 = D.bonusTax(g, g, 1, 0, {}), b2 = D.bonusTax(g, g, 2, 0, {}), b1a = D.bonusTax(g, g, "1a", 0, { cim: true });
  return { c1, c2, c1a, b1, b2, b1a, emp: D.employerCost(g), km: [10, 20, 30].map((k) => [k, D.payslip(g, 1, k, {})]) };
}
/* cellule vérifiée par calc.test.js : data-g (brut), data-c (classe), data-km */
const cell = (g, c, km, net) => `<td data-g="${g}" data-c="${c}" data-km="${km}">${f2(net)} €</td>`;

function head({ title, desc, url, type = "article", jsonld }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<script>(function(){var H=history,P=function(){return location.pathname.replace(/(index)?\\.html$/,"")};if(P()!==location.pathname)H.replaceState(null,"",P()+location.search+location.hash);var C=function(){if(location.hash)H.replaceState(null,"",P()+location.search)};addEventListener("load",function(){setTimeout(C,60)});addEventListener("hashchange",C)})()</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="brutnet.lu">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:image" content="${SITE}/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#F1F3F7">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,500..800&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>

<header class="top">
  <div class="wrap">
    <a class="logo" href="/"><i aria-hidden="true"></i>brutnet.lu</a>
    <nav class="nav" aria-label="Navigation principale">
      <a href="/">Brut → net</a>
      <a href="/impot-frontalier">Impôts frontalier</a>
      <a href="/diagnostic">Retraite et crédit</a>
      <a href="/diagnostic#sources">Méthode</a>
    </nav>
    <a class="btn small" href="/diagnostic#diagnostic">Diagnostic gratuit</a>
  </div>
</header>
`;
}

const FOOT = `
<footer>
  <div class="wrap">
    <span>© 2026 brutnet.lu · Thionville</span>
    <div class="links"><a href="/">Salaire brut net Luxembourg</a><a href="/tableau-salaire-brut-net-luxembourg">Tableau brut net 2026</a><a href="/salaire-minimum-luxembourg">Salaire minimum 2026</a><a href="/impot-frontalier">Déclaration d'impôts frontalier</a><a href="/remboursement-impot-luxembourg">Remboursement d'impôt</a><a href="/classe-impot-luxembourg">Classes d'impôt</a><a href="/teletravail-frontalier-luxembourg">Télétravail 34 jours</a><a href="/voiture-de-societe-luxembourg">Voiture de société et leasing</a><a href="/diagnostic">Retraite et crédit frontalier</a><a href="/diagnostic#sources">Méthode et sources</a><a href="/mentions-legales">Mentions légales</a><a href="/mentions-legales#confidentialite">Confidentialité</a></div>
  </div>
</footer>

<script>try{if(!sessionStorage.getItem("bn_first"))sessionStorage.setItem("bn_first",JSON.stringify(location.pathname+location.search))}catch(e){}</script>
</body>
</html>
`;

const LEAD = `<div class="callout lead" style="margin-top:28px">
        <p><strong>Frontalier ? Vous payez peut-être trop d'impôt.</strong> Assimilation, assurances, intérêts d'emprunt : le pré-diagnostic gratuit chiffre ce que vous pouvez récupérer, votre retraite France + Luxembourg et votre capacité d'emprunt. Puis un expert vous rappelle, gratuitement.</p>
        <a class="btn small" href="/diagnostic#diagnostic">Faire mon diagnostic gratuit</a>
      </div>`;

const crumbs = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + url })) });
const faq = (qa) => ({ "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const article = (headline, url) => ({ "@type": "Article", headline, inLanguage: "fr", datePublished: TODAY, dateModified: TODAY, mainEntityOfPage: SITE + url, image: SITE + "/img/og.png",
  author: { "@type": "Organization", name: "brutnet.lu", url: SITE + "/" }, publisher: { "@type": "Organization", name: "brutnet.lu", url: SITE + "/", logo: { "@type": "ImageObject", url: SITE + "/img/icon-512.png" } } });

/* ------------------------------------------------------------------ page par salaire */
function salaryPage(g, i) {
  const r = calc(g), s = r.c1, G = gLabel(g), url = slugOf(g);
  const prev = AMOUNTS[i - 1], next = AMOUNTS[i + 1];
  const yr = (c, b) => c.net * 12 + b.net;
  const title = `${G} € brut en net au Luxembourg (2026) : ${f2(s.net)} €`;
  const desc = `${G} € brut par mois au Luxembourg = ${f2(s.net)} € net en classe 1, ${f2(r.c2.net)} € en classe 2, ${f2(r.c1a.net)} € en classe 1a. Calcul détaillé 2026 : cotisations, impôt, crédits, 13ᵉ mois, coût employeur.`;
  const q = [
    [`Combien fait ${G} € brut en net au Luxembourg ?`, `En novembre 2026, ${G} € brut par mois donnent ${f2(s.net)} € net en classe 1 (célibataire, ou frontalier marié sans taux global), ${f2(r.c2.net)} € en classe 2 (résident marié) et ${f2(r.c1a.net)} € en classe 1a (parent isolé), sans frais de déplacement.`],
    [`Combien d'impôt sur ${G} € brut au Luxembourg ?`, `En classe 1, la retenue d'impôt est de ${f2(s.tax)} € par mois, avant ${f2(s.creditTotal)} € de crédits d'impôt versés avec le salaire. En classe 2, elle est de ${f2(r.c2.tax)} €.`],
    [`Combien coûte un salarié payé ${G} € brut au Luxembourg ?`, `Environ ${f2(r.emp.cost)} € par mois pour l'employeur, soit ${f2(r.emp.contributions)} € de cotisations patronales (taux d'accident de base, classe 2 de la Mutualité des employeurs, santé au travail comprise).`],
  ];
  const credits = [["Crédit d'impôt salarié (CIS)", s.credits.cis], ["Crédit d'impôt CO2 (CI-CO2)", s.credits.cico2], ["Crédit d'impôt salaire social minimum (CISSM)", s.credits.cissm], ["Crédit d'impôt conjoncture, jusqu'en décembre 2026", s.credits.cic]].filter(([, v]) => v > 0);
  const html = head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article(`${G} € brut en net au Luxembourg en 2026`, url), crumbs([["brutnet.lu", "/"], ["Tableau brut net 2026", "/tableau-salaire-brut-net-luxembourg"], [`${G} € brut`, url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Salaire brut → net · Luxembourg · barèmes de novembre 2026</p>
    <h1 style="margin-top:18px">${G} € brut, <mark>${f2(s.net)} € net</mark>.</h1>
    <p class="lede">Au Luxembourg, un salaire de ${G} € brut par mois donne <strong>${f2(s.net)} € net en classe 1</strong>, ${f2(r.c2.net)} € en classe 2 et ${f2(r.c1a.net)} € en classe 1a. Calcul pour un mois de novembre 2026, sans frais de déplacement, avec les barèmes officiels.</p>
    <p style="margin-top:22px"><a class="btn" href="/">Calculer avec ma distance et ma fiche</a></p>
  </div>
</section>

<section class="prose" id="classes">
  <div class="wrap">
    <div>
      <p class="eyebrow">Selon la classe d'impôt</p>
      <h2 style="margin-top:12px">Le net de ${G} € brut en classe 1, 2 et 1a</h2>
      <p class="intro">La classe figure sur votre fiche de retenue d'impôt. Frontalier marié : classe 1, sauf taux global demandé dans la déclaration.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Classe</th><th>Net mensuel</th><th>Net sur 12 mois</th><th>Avec 13ᵉ mois</th></tr></thead>
        <tbody>
          <tr><td>Classe 1 · célibataire, frontalier marié</td>${cell(g, 1, 0, s.net)}<td>${f0(s.net * 12)} €</td><td>${f0(yr(s, r.b1))} €</td></tr>
          <tr><td>Classe 2 · résident marié</td>${cell(g, 2, 0, r.c2.net)}<td>${f0(r.c2.net * 12)} €</td><td>${f0(yr(r.c2, r.b2))} €</td></tr>
          <tr><td>Classe 1a · parent isolé</td>${cell(g, "1a", 0, r.c1a.net)}<td>${f0(r.c1a.net * 12)} €</td><td>${f0(yr(r.c1a, r.b1a))} €</td></tr>
        </tbody>
      </table>
      <p class="note">Classe 1a avec le crédit d'impôt monoparental. Le 13ᵉ mois de ${G} € est imposé à part : il rapporte ${f2(r.b1.net)} € net en classe 1 et ${f2(r.b2.net)} € en classe 2.</p>
    </div>
  </div>
</section>

<section class="prose" id="detail">
  <div class="wrap">
    <div>
      <p class="eyebrow">Ligne par ligne</p>
      <h2 style="margin-top:12px">Du brut au net, classe 1</h2>
      <p class="intro">Méthode de l'administration des contributions directes : base arrondie aux 5 € inférieurs, impôt arrondi aux 10 centimes inférieurs.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <tbody>
          <tr><td>Salaire brut</td><td>${f2(g)} €</td></tr>
          <tr><td>Pension, 8,50 %${g > D.P.lu.capMonthly ? " (plafonnée)" : ""}</td><td>− ${f2(s.contribs.pension)} €</td></tr>
          <tr><td>Soins de santé et indemnités maladie, 3,05 %${g > D.P.lu.capMonthly ? " (plafonnés)" : ""}</td><td>− ${f2(s.contribs.health)} €</td></tr>
          <tr><td>Assurance dépendance, 1,40 % après abattement</td><td>− ${f2(s.contribs.dependency)} €</td></tr>
          <tr><td>Base imposable du mois</td><td>${f2(s.base)} €</td></tr>
          <tr><td>Impôt retenu, classe 1</td><td>− ${f2(s.tax)} €</td></tr>
${credits.map(([k, v]) => `          <tr><td>${k}</td><td>+ ${f2(v)} €</td></tr>`).join("\n")}
          <tr><td><strong>Net versé</strong></td><td><strong>${f2(s.net)} €</strong></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="prose" id="frontalier">
  <div class="wrap">
    <div>
      <p class="eyebrow">Frontalier</p>
      <h2 style="margin-top:12px">Avec vos frais de déplacement</h2>
      <p class="intro">Les frais de déplacement inscrits sur la fiche réduisent l'impôt : 99 € par an et par kilomètre au-delà du 4ᵉ, 2 574 € au plus, atteints à 30 km.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Distance domicile → travail</th><th>Net classe 1</th><th>Gain par mois</th></tr></thead>
        <tbody>
          <tr><td>0 km</td>${cell(g, 1, 0, s.net)}<td>—</td></tr>
${r.km.map(([k, p]) => `          <tr><td>${k} km${k === 30 ? " et plus" : ""}</td>${cell(g, 1, k, p.net)}<td>+ ${f2(p.net - s.net)} €</td></tr>`).join("\n")}
        </tbody>
      </table>
      ${LEAD}
    </div>
  </div>
</section>

<section class="prose" id="employeur">
  <div class="wrap">
    <div>
      <p class="eyebrow">Employeur</p>
      <h2 style="margin-top:12px">Ce que coûte ${G} € brut à l'employeur</h2>
    </div>
    <div class="txt">
      <p>Pour ${G} € brut, l'employeur paie environ <strong>${f2(r.emp.cost)} € par mois</strong>, dont ${f2(r.emp.contributions)} € de cotisations patronales (${(r.emp.rate * 100).toFixed(2).replace(".", ",")} % du brut) : pension, maladie, accident au taux de base, Mutualité des employeurs en classe 2 et santé au travail.</p>
      <p>Sur un an, avec un 13ᵉ mois, le salaire brut atteint ${f0(g * 13)} €.</p>
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([a, b]) => `      <details><summary>${a}</summary><p>${b}</p></details>`).join("\n")}
    </div>
  </div>
</section>

<section class="prose">
  <div class="wrap">
    <div><p class="eyebrow">Autres salaires</p></div>
    <div class="txt">
      <p>${prev ? `<a href="${slugOf(prev)}">← ${gLabel(prev)} € brut</a>` : `<a href="/salaire-minimum-luxembourg">← Salaire minimum</a>`}${next ? ` · <a href="${slugOf(next)}">${gLabel(next)} € brut →</a>` : ""} · <a href="/tableau-salaire-brut-net-luxembourg">Tableau complet</a> · <a href="/">Estimateur brut → net</a></p>
      <p class="note">Calcul selon les barèmes publiés par l'ACD, le CCSS et le ministère du Travail, détaillés dans la <a href="/diagnostic#sources">méthode</a>. Le crédit d'impôt conjoncture est versé de juin à décembre 2026.</p>
    </div>
  </div>
</section>
` + FOOT;
  return html;
}

/* ------------------------------------------------------------------ tableau complet */
function tablePage() {
  const url = "/tableau-salaire-brut-net-luxembourg";
  const rows = [[SSM, "/salaire-minimum-luxembourg", "SSM"], [SSMQ, "/salaire-minimum-luxembourg", "SSM qualifié"], ...AMOUNTS.map((g) => [g, slugOf(g)])];
  const title = "Tableau salaire brut net Luxembourg 2026 : classes 1, 1a et 2";
  const desc = "Grille 2026 du salaire net au Luxembourg pour chaque brut mensuel de 2 771 € à 15 000 €, en classe 1, 1a et 2. Calcul exact avec les barèmes officiels.";
  const q4 = calc(4000);
  const q = [["Quel est le net de 4 000 € brut au Luxembourg en 2026 ?", `${f2(q4.c1.net)} € en classe 1, ${f2(q4.c2.net)} € en classe 2 et ${f2(q4.c1a.net)} € en classe 1a, sans frais de déplacement.`],
             ["Quelle est la différence entre la classe 1 et la classe 2 ?", "La classe 2, celle du résident marié, applique le barème à la moitié du revenu puis double l'impôt. À salaire égal, le net est donc plus élevé qu'en classe 1, d'autant plus que le salaire est haut. Un frontalier marié reste en classe 1, sauf s'il obtient un taux global en demandant l'assimilation."]];
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Tableau salaire brut net Luxembourg 2026", url), crumbs([["brutnet.lu", "/"], ["Tableau brut net 2026", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Grille 2026 · barèmes de novembre 2026</p>
    <h1 style="margin-top:18px">Tableau du salaire brut net au Luxembourg, <mark>classe par classe</mark>.</h1>
    <p class="lede">Le net mensuel pour chaque salaire brut, du salaire social minimum à 15 000 €, en classe 1, 1a et 2, sans frais de déplacement. Cliquez sur un montant pour le détail ligne par ligne.</p>
  </div>
</section>

<section class="prose" id="tableau">
  <div class="wrap">
    <div>
      <h2>Salaire net 2026</h2>
      <p class="intro">Classe 1 : célibataire, ou frontalier marié sans taux global. Classe 2 : résident marié. Classe 1a : parent isolé, crédit d'impôt monoparental compris.</p>
      ${LEAD}
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Brut mensuel</th><th>Classe 1</th><th>Classe 2</th><th>Classe 1a</th></tr></thead>
        <tbody>
${rows.map(([g, u, lab]) => { const r = calc(g); return `          <tr><td><a href="${u}">${f2(g)} €</a>${lab ? ` <small>${lab}</small>` : ""}</td>${cell(g, 1, 0, r.c1.net)}${cell(g, 2, 0, r.c2.net)}${cell(g, "1a", 0, r.c1a.net)}</tr>`; }).join("\n")}
        </tbody>
      </table>
      <p class="note">Mois de novembre 2026, crédit d'impôt conjoncture compris (versé jusqu'en décembre 2026). Pour votre distance domicile-travail, un 13ᵉ mois ou un taux global, utilisez <a href="/">l'estimateur</a>.</p>
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([a, b]) => `      <details><summary>${a}</summary><p>${b}</p></details>`).join("\n")}
    </div>
  </div>
</section>
` + FOOT;
}

/* ------------------------------------------------------------------ salaire minimum */
function ssmPage() {
  const url = "/salaire-minimum-luxembourg";
  const a = calc(SSM), b = calc(SSMQ);
  const h = (x) => f2(Math.round((x / 173) * 100) / 100);
  const title = `Salaire minimum Luxembourg 2026 : ${f2(SSM)} € brut, ${f2(a.c1.net)} € net`;
  const desc = `Salaire social minimum au Luxembourg en 2026 : ${f2(SSM)} € brut (${f2(a.c1.net)} € net en classe 1), ${f2(SSMQ)} € brut qualifié (${f2(b.c1.net)} € net). Taux horaire, net par classe, crédit d'impôt CISSM.`;
  const q = [["Quel est le salaire minimum au Luxembourg en 2026 ?", `Depuis le 1er juin 2026, le salaire social minimum est de ${f2(SSM)} € brut par mois pour un salarié non qualifié de 18 ans ou plus, et de ${f2(SSMQ)} € pour un salarié qualifié (20 % de plus).`],
             ["Combien fait le salaire minimum luxembourgeois en net ?", `${f2(a.c1.net)} € net par mois en classe 1 et ${f2(a.c2.net)} € en classe 2 pour le SSM non qualifié ; ${f2(b.c1.net)} € et ${f2(b.c2.net)} € pour le SSM qualifié, sans frais de déplacement.`],
             ["Quel est le salaire minimum horaire au Luxembourg ?", `${h(SSM)} € brut de l'heure non qualifié et ${h(SSMQ)} € qualifié, sur la base de 173 heures par mois.`]];
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Salaire minimum au Luxembourg en 2026", url), crumbs([["brutnet.lu", "/"], ["Salaire minimum 2026", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Salaire social minimum · Luxembourg · depuis le 1ᵉʳ juin 2026</p>
    <h1 style="margin-top:18px">Salaire minimum au Luxembourg : <mark>${f2(SSM)} € brut</mark>.</h1>
    <p class="lede">Le salaire social minimum (SSM) est de ${f2(SSM)} € brut par mois pour un salarié non qualifié de 18 ans ou plus, soit <strong>${f2(a.c1.net)} € net</strong> en classe 1. Qualifié : ${f2(SSMQ)} € brut, ${f2(b.c1.net)} € net.</p>
  </div>
</section>

<section class="prose" id="montants">
  <div class="wrap">
    <div>
      <h2>Brut, net et taux horaire</h2>
      <p class="intro">Net d'un mois de novembre 2026, sans frais de déplacement. Le taux horaire se calcule sur 173 heures par mois.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th></th><th>Non qualifié</th><th>Qualifié</th></tr></thead>
        <tbody>
          <tr><td>Brut mensuel</td><td>${f2(SSM)} €</td><td>${f2(SSMQ)} €</td></tr>
          <tr><td>Brut horaire</td><td>${h(SSM)} €</td><td>${h(SSMQ)} €</td></tr>
          <tr><td>Net classe 1</td>${cell(SSM, 1, 0, a.c1.net)}${cell(SSMQ, 1, 0, b.c1.net)}</tr>
          <tr><td>Net classe 2</td>${cell(SSM, 2, 0, a.c2.net)}${cell(SSMQ, 2, 0, b.c2.net)}</tr>
          <tr><td>Net classe 1a</td>${cell(SSM, "1a", 0, a.c1a.net)}${cell(SSMQ, "1a", 0, b.c1a.net)}</tr>
          <tr><td>Coût employeur</td><td>${f2(a.emp.cost)} €</td><td>${f2(b.emp.cost)} €</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="prose" id="cissm">
  <div class="wrap">
    <div>
      <p class="eyebrow">Crédit d'impôt</p>
      <h2 style="margin-top:12px">Le CISSM s'ajoute au net</h2>
    </div>
    <div class="txt">
      <p>Le crédit d'impôt salaire social minimum (CISSM) est versé avec le salaire : 81 € par mois pour un brut mensuel compris entre 1 800 et 3 000 €, puis dégressif jusqu'à 3 600 €. Au SSM non qualifié, il vaut ${f2(a.c1.credits.cissm)} € par mois ; au SSM qualifié, ${f2(b.c1.credits.cissm)} €.</p>
      <p>Il s'ajoute au crédit d'impôt salarié (CIS), au crédit d'impôt CO2 et, de juin à décembre 2026, au crédit d'impôt conjoncture. Le détail ligne par ligne est dans <a href="/">l'estimateur brut → net</a>.</p>
      <p>Le SSM qualifié s'applique au salarié qui a une qualification professionnelle reconnue, par un diplôme ou par son expérience dans le métier. Les conditions sont détaillées par l'Inspection du travail et des mines (ITM).</p>
      ${LEAD}
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([x, y]) => `      <details><summary>${x}</summary><p>${y}</p></details>`).join("\n")}
    </div>
  </div>
</section>

<section class="prose">
  <div class="wrap">
    <div><p class="eyebrow">Sources</p></div>
    <div class="txt"><p class="note"><a href="https://itm.public.lu/fr/questions-reponses/droit-travail/remuneration/a/a3.html" rel="noopener">ITM : salaire social minimum</a> · barèmes de retenue ACD détaillés dans la <a href="/diagnostic#sources">méthode</a> · <a href="/tableau-salaire-brut-net-luxembourg">tableau brut net complet</a></p></div>
  </div>
</section>
` + FOOT;
}

/* ------------------------------------------------------------------ remboursement d'impôt */
function rembPage() {
  const url = "/remboursement-impot-luxembourg";
  const ex = [3500, 4500, 5500, 7000].map((g) => [g, calc(g)]);
  const e5 = calc(5500), gap5 = (e5.c2.net - e5.c1.net) * 12;
  const title = "Remboursement d'impôt Luxembourg frontalier : avant le 31 décembre 2026";
  const desc = "Frontalier : récupérez l'impôt luxembourgeois payé en trop sur 2025. Assimilation et taux global, assurances, intérêts d'emprunt, frais de déplacement : déclaration ou décompte avant le 31 décembre 2026.";
  const q = [
    ["Comment se faire rembourser des impôts au Luxembourg ?", "En déposant une déclaration (modèle 100) ou un décompte annuel (modèle 163 NR) pour l'année écoulée. La retenue sur salaire est alors recalculée avec votre situation réelle, et le trop-perçu vous est remboursé."],
    ["Jusqu'à quand demander un remboursement pour 2025 ?", "Jusqu'au 31 décembre 2026. Pour le décompte annuel (163 NR), ce délai est un délai de forclusion, sans prolongation possible."],
    ["Un frontalier marié peut-il payer moins d'impôt au Luxembourg ?", `Oui, s'il remplit les conditions de l'assimilation : le couple est alors imposé au taux global, calculé en classe 2 sur le revenu mondial du ménage. Quand le conjoint n'a pas de revenu, cela revient à l'impôt de la classe 2 : à ${gLabel(5500)} € brut par mois, l'écart avec la classe 1 est d'environ ${f0(gap5)} € par an.`],
    ["Quelles dépenses un frontalier peut-il déduire au Luxembourg ?", "Avec l'assimilation : primes d'assurance et intérêts débiteurs (672 € par personne du ménage), épargne-logement, prévoyance-vieillesse, intérêts d'emprunt de l'habitation principale, frais de garde. Sans assimilation : frais de déplacement, frais d'obtention, cotisations sociales et régime complémentaire de pension."],
  ];
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Remboursement d'impôt au Luxembourg pour les frontaliers", url), crumbs([["brutnet.lu", "/"], ["Remboursement d'impôt", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Frontaliers · impôt luxembourgeois 2025 · mis à jour le 9 novembre 2026</p>
    <h1 style="margin-top:18px">Remboursement d'impôt au Luxembourg : <mark>avant le 31 décembre</mark>.</h1>
    <p class="lede">La retenue sur votre salaire est calculée sans connaître votre conjoint, vos assurances ni votre crédit. Une déclaration ou un décompte annuel la recalcule, et l'administration rembourse la différence. Pour vos revenus 2025, vous avez jusqu'au <strong>31 décembre 2026</strong>.</p>
    <p style="margin-top:22px"><a class="btn" href="/diagnostic#diagnostic">Calculer ce que je peux récupérer</a></p>
  </div>
</section>

<section class="prose" id="qui">
  <div class="wrap">
    <div>
      <p class="eyebrow">Qui est concerné</p>
      <h2 style="margin-top:12px">Les trois cas où un frontalier récupère de l'impôt</h2>
    </div>
    <div class="txt">
      <h3>1. Vous êtes marié et votre conjoint gagne peu</h3>
      <p>Sans démarche, un frontalier marié est imposé en <strong>classe 1</strong>, comme un célibataire. S'il demande l'assimilation (au moins 90 % des revenus de chaque conjoint imposables au Luxembourg, ou moins de 13 000 € de revenus nets non imposables au Luxembourg), le couple est imposé au <strong>taux global</strong> : l'impôt de classe 2 sur le revenu mondial du ménage, appliqué aux seuls revenus luxembourgeois.</p>
      <h3>2. Vous avez des assurances, un crédit, de l'épargne</h3>
      <p>Une fois assimilé, vous déduisez comme un résident : primes d'assurance et intérêts débiteurs, épargne-logement, prévoyance-vieillesse, intérêts d'emprunt de votre résidence principale, frais de garde. Le détail des plafonds est dans le <a href="/impot-frontalier#deductions">guide de la déclaration</a>.</p>
      <h3>3. Votre fiche ne tient pas compte de votre trajet réel</h3>
      <p>Le décompte annuel (163 NR) prend en compte les frais de déplacement selon la distance réelle domicile-travail, les frais d'obtention et les dépenses listées sur le formulaire.</p>
    </div>
  </div>
</section>

<section class="prose" id="exemples">
  <div class="wrap">
    <div>
      <p class="eyebrow">Ordre de grandeur</p>
      <h2 style="margin-top:12px">Classe 1 ou classe 2 : l'écart sur un an</h2>
      <p class="intro">Net mensuel de novembre 2026, sans frais de déplacement. Quand le conjoint n'a aucun revenu, le taux global revient à l'impôt de la classe 2.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Brut mensuel</th><th>Net classe 1</th><th>Net classe 2</th><th>Écart sur 12 mois</th></tr></thead>
        <tbody>
${ex.map(([g, r]) => `          <tr><td><a href="${slugOf(g)}">${f2(g)} €</a></td>${cell(g, 1, 0, r.c1.net)}${cell(g, 2, 0, r.c2.net)}<td>${f0((r.c2.net - r.c1.net) * 12)} €</td></tr>`).join("\n")}
        </tbody>
      </table>
      <p class="note">Quand le conjoint a des revenus, le gain baisse et peut devenir nul : il faut comparer les deux impositions sur votre cas.</p>
      <div class="callout lead" style="margin-top:28px">
        <p><strong>Combien pour vous ?</strong> Le pré-diagnostic gratuit calcule en 2 minutes l'impôt que vous pouvez récupérer avec l'assimilation, vos assurances, votre épargne et votre crédit. Puis un expert vous rappelle pour vérifier votre cas, gratuitement.</p>
        <a class="btn small" href="/diagnostic#diagnostic">Faire mon diagnostic gratuit</a>
      </div>
    </div>
  </div>
</section>

<section class="prose" id="demarche">
  <div class="wrap">
    <div>
      <p class="eyebrow">La démarche</p>
      <h2 style="margin-top:12px">Décompte annuel ou déclaration, et avant quand</h2>
    </div>
    <div class="txt">
      <p>Le <strong>décompte annuel</strong>, modèle 163 NR, régularise la retenue : frais de déplacement selon la distance réelle, frais d'obtention et dépenses listées sur le formulaire. Les primes d'assurance, les intérêts débiteurs et l'épargne-pension ne sont déductibles qu'avec la <strong>déclaration</strong>, modèle 100, qui sert aussi à demander l'assimilation, signée par les deux conjoints.</p>
      <p>Le délai est le même pour les deux : le <strong>31 décembre de l'année qui suit</strong>, soit le 31 décembre 2026 pour les revenus 2025. Pour le décompte annuel, c'est un délai de forclusion, sans prolongation possible.</p>
      <p>Le dépôt se fait sur <strong>MyGuichet.lu</strong>, avec un produit LuxTrust ou une carte d'identité électronique luxembourgeoise, ou sur papier. L'assistant en ligne n'accepte pas tous les cas, notamment une demande de décompte annuel ou d'imposition individuelle d'un couple.</p>
      <p>La déclaration est obligatoire, et non facultative, au-delà de 100 000 € de revenu imposable, avec une fiche additionnelle au-delà de 36 000 € (30 000 € en classe 1a), ou pour demander l'assimilation.</p>
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([x, y]) => `      <details><summary>${x}</summary><p>${y}</p></details>`).join("\n")}
    </div>
  </div>
</section>

<section class="prose">
  <div class="wrap">
    <div><p class="eyebrow">Sources</p></div>
    <div class="txt"><p class="note"><a href="https://impotsdirects.public.lu/fr/support/foire-aux-questions/faq-fr/non-residents.html" rel="noopener">ACD, FAQ non-résidents</a> · <a href="https://impotsdirects.public.lu/fr/az/a/assimil.html" rel="noopener">ACD, assimilation</a> · <a href="https://guichet.public.lu/fr/citoyens/fiscalite/declaration-impot-decompte/activite-professionnelle/declaration-revenus/assimilation-resident.html" rel="noopener">Guichet.lu, assimilation</a> · <a href="https://impotsdirects.public.lu/fr/az/i/impot_assiet_revenu.html" rel="noopener">ACD, imposition par voie d'assiette</a> · <a href="https://impotsdirects.public.lu/dam-assets/fr/formulaires/pers_physiques/2025/100f-2025.pdf" rel="noopener">modèle 100 F 2025</a></p></div>
  </div>
</section>
` + FOOT;
}

/* ------------------------------------------------------------------ classes d'impôt */
function classPage() {
  const url = "/classe-impot-luxembourg";
  const ex = [3500, 4500, 5500, 7000].map((g) => [g, calc(g)]);
  const e4 = calc(4000);
  const title = "Classe d'impôt Luxembourg 2026 : classe 1, 1a ou 2, résident et frontalier";
  const desc = "Classe d'impôt au Luxembourg : qui est en classe 1, 1a ou 2, résident ou frontalier marié, et ce que ça change sur le net. Règles officielles ACD 2026.";
  const q = [
    ["Quelle classe d'impôt pour un frontalier marié ?", "La classe 1, avec ou sans enfant, tant que le couple n'est pas imposé collectivement. L'imposition collective suppose de remplir les conditions de l'assimilation : la fiche de retenue porte alors un taux, calculé en classe 2 sur les revenus du ménage."],
    ["Qui est en classe 1a au Luxembourg ?", "Les personnes qui ne sont pas en classe 2 et qui sont veuves, qui bénéficient d'une modération d'impôt pour enfant, ou qui ont 64 ans révolus au 1er janvier de l'année d'imposition. Un frontalier marié non imposé collectivement reste en classe 1 même avec des enfants."],
    ["Quelle est la différence de net entre la classe 1 et la classe 2 ?", `À ${gLabel(4000)} € brut par mois, ${f2(e4.c1.net)} € net en classe 1 et ${f2(e4.c2.net)} € en classe 2, soit ${f2(e4.c2.net - e4.c1.net)} € de plus par mois. L'écart grandit avec le salaire.`],
    ["Comment changer de classe d'impôt ?", "La classe est fixée par l'administration des contributions directes sur la fiche de retenue. Après un mariage, une naissance, un divorce ou un décès, on demande la modification de la fiche. Un frontalier marié obtient l'imposition collective en demandant l'assimilation dans sa déclaration (modèle 100)."],
  ];
  const t = (rows) => `<table class="ptable ex">
        <thead><tr><th>Situation</th><th>Sans enfant</th><th>Avec enfant</th><th>64 ans et plus</th></tr></thead>
        <tbody>
${rows.map(([s, a, b, c]) => `          <tr><td>${s}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join("\n")}
        </tbody>
      </table>`;
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Classe d'impôt au Luxembourg : 1, 1a ou 2", url), crumbs([["brutnet.lu", "/"], ["Classe d'impôt", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Fiscalité · Luxembourg · règles de l'ACD en vigueur en 2026</p>
    <h1 style="margin-top:18px">Classe d'impôt au Luxembourg : <mark>1, 1a ou 2</mark> ?</h1>
    <p class="lede">La classe d'impôt figure sur votre fiche de retenue et fixe l'impôt prélevé chaque mois. À ${gLabel(4000)} € brut, la classe 2 laisse ${f2(e4.c2.net - e4.c1.net)} € net de plus par mois que la classe 1. Qui a droit à quoi, résident ou frontalier.</p>
  </div>
</section>

<section class="prose" id="residents">
  <div class="wrap">
    <div>
      <p class="eyebrow">Résidents</p>
      <h2 style="margin-top:12px">Les classes d'un résident</h2>
      <p class="intro">« Avec enfant » : vous bénéficiez d'une modération d'impôt pour enfant. « 64 ans et plus » : 64 ans révolus au 1ᵉʳ janvier de l'année d'imposition.</p>
    </div>
    <div>
      ${t([
        ["Célibataire", "1", "1a", "1a"],
        ["Marié ou partenaire, imposé collectivement", "2", "2", "2"],
        ["Marié ou partenaire, imposition individuelle", "1, avec un taux", "1, avec un taux", "1, avec un taux"],
        ["Partenaires sans imposition collective", "1", "1a", "1a"],
        ["Un seul des époux réside au Luxembourg", "1", "1a", "1a"],
        ["Divorcé ou séparé", "1", "1a", "1a"],
        ["Veuf", "1a", "1a", "1a"],
      ])}
      <p class="note">Classe 2 aussi pendant les 3 années qui suivent un divorce ou un décès, à certaines conditions. Le couple dont un seul époux réside au Luxembourg peut demander l'imposition collective si l'époux résident gagne au moins 90 % des revenus professionnels du ménage.</p>
    </div>
  </div>
</section>

<section class="prose" id="frontaliers">
  <div class="wrap">
    <div>
      <p class="eyebrow">Frontaliers</p>
      <h2 style="margin-top:12px">Les classes d'un frontalier</h2>
      <p class="intro">Règles applicables aux non-résidents depuis l'année d'imposition 2018.</p>
    </div>
    <div>
      ${t([
        ["Célibataire", "1", "1a", "1a"],
        ["Marié, sans imposition collective", "1", "1", "1"],
        ["Marié ou partenaire, imposé collectivement (assimilation)", "taux global", "taux global", "taux global"],
        ["Partenaires sans imposition collective", "1", "1a", "1a"],
        ["Divorcé ou séparé", "1", "1a", "1a"],
        ["Veuf", "1a", "1a", "1a"],
      ])}
      <p class="note">Le « taux global » est inscrit sur la fiche à la place d'une classe : c'est le taux d'un résident imposé en classe 2 sur les revenus mondiaux du ménage, appliqué au seul salaire luxembourgeois.</p>
    </div>
  </div>
</section>

<section class="prose" id="marie">
  <div class="wrap">
    <div>
      <p class="eyebrow">Le cas qui coûte cher</p>
      <h2 style="margin-top:12px">Frontalier marié : classe 1 par défaut</h2>
    </div>
    <div class="txt">
      <p>Un frontalier marié est imposé seul, en <strong>classe 1</strong>, comme un célibataire, et sans passer en classe 1a s'il a des enfants. La règle des 50 % des revenus du ménage, qui donnait la classe 2 avant 2018, ne figure plus dans les règles de l'administration.</p>
      <p>Pour être imposé en couple, il faut remplir les conditions de l'<strong>assimilation</strong> : au moins 90 % des revenus de chaque conjoint imposables au Luxembourg, ou moins de 13 000 € de revenus nets non imposables au Luxembourg. La demande se fait dans la déclaration modèle 100, pour l'année écoulée : l'impôt trop retenu est remboursé, et le taux global est inscrit sur les fiches suivantes. Les revenus 2025 peuvent être déclarés jusqu'au <strong>31 décembre 2026</strong>.</p>
      <p>Le gain est fort quand le conjoint gagne peu, faible ou nul quand les deux revenus sont proches. <a href="/remboursement-impot-luxembourg">Combien récupérer</a> · <a href="/impot-frontalier#assimilation">conditions détaillées</a>.</p>
    </div>
  </div>
</section>

<section class="prose" id="ecart">
  <div class="wrap">
    <div>
      <p class="eyebrow">En euros</p>
      <h2 style="margin-top:12px">Le net selon la classe</h2>
      <p class="intro">Net mensuel de novembre 2026, sans frais de déplacement. Classe 1a avec le crédit d'impôt monoparental.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Brut mensuel</th><th>Classe 1</th><th>Classe 1a</th><th>Classe 2</th></tr></thead>
        <tbody>
${ex.map(([g, r]) => `          <tr><td><a href="${slugOf(g)}">${f2(g)} €</a></td>${cell(g, 1, 0, r.c1.net)}${cell(g, "1a", 0, r.c1a.net)}${cell(g, 2, 0, r.c2.net)}</tr>`).join("\n")}
        </tbody>
      </table>
      <p class="note"><a href="/tableau-salaire-brut-net-luxembourg">Tableau complet par classe</a>, de 2 771 € à 15 000 € brut.</p>
      ${LEAD}
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([x, y]) => `      <details><summary>${x}</summary><p>${y}</p></details>`).join("\n")}
    </div>
  </div>
</section>

<section class="prose">
  <div class="wrap">
    <div><p class="eyebrow">Sources</p></div>
    <div class="txt"><p class="note"><a href="https://impotsdirects.public.lu/fr/az/c/class_resid.html" rel="noopener">ACD, classes des résidents</a> · <a href="https://impotsdirects.public.lu/fr/az/c/class_nonresid.html" rel="noopener">ACD, classes des non-résidents</a> · <a href="https://impotsdirects.public.lu/fr/az/a/assimil.html" rel="noopener">ACD, assimilation</a> · <a href="https://guichet.public.lu/fr/citoyens/fiscalite/declaration-impot-decompte/activite-professionnelle/fiche-retenue-impot/demander-modifier-fiche-nonresident.html" rel="noopener">Guichet.lu, fiche de retenue d'un non-résident</a></p></div>
  </div>
</section>
` + FOOT;
}

/* ------------------------------------------------------------------ télétravail */
function teleworkPage() {
  const url = "/teletravail-frontalier-luxembourg";
  const title = "Télétravail frontalier Luxembourg 2026 : règle des 34 jours et 25 %";
  const desc = "Frontalier France-Luxembourg : 34 jours de télétravail par an côté impôt, moins de 25 % (ou 50 % avec accord) côté sécurité sociale. Jours qui comptent, temps partiel, dépassement : compteur gratuit.";
  const q = [
    ["Combien de jours de télétravail pour un frontalier français au Luxembourg ?", "34 jours par an côté impôt : jusqu'à ce seuil, le salaire reste imposable au Luxembourg seulement. Côté sécurité sociale, vous restez affilié au Luxembourg sous 25 % de temps de travail en France, ou sous 50 % avec l'accord-cadre européen."],
    ["Une demi-journée de télétravail compte-t-elle pour un jour ?", "Oui. Toute fraction de journée travaillée en France ou dans un autre pays que le Luxembourg compte comme une journée entière."],
    ["Que se passe-t-il si je dépasse 34 jours ?", "La France impose la part du salaire correspondant à tous les jours travaillés hors du Luxembourg, dès le premier jour. Elle se déclare en case 1AG ou 1BG et donne lieu à des acomptes de prélèvement à la source."],
    ["Le seuil de 34 jours est-il réduit à temps partiel ?", "Oui. Il est réduit proportionnellement au temps de travail prévu au contrat et à la durée du contrat dans l'année."],
  ];
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Télétravail des frontaliers France-Luxembourg : 34 jours et 25 %", url), crumbs([["brutnet.lu", "/"], ["Télétravail frontalier", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Frontaliers France ↔ Luxembourg · règles en vigueur en 2026</p>
    <h1 style="margin-top:18px">Télétravail frontalier : <mark>34 jours</mark>, pas un de plus.</h1>
    <p class="lede">Deux seuils différents s'appliquent : <strong>34 jours par an</strong> pour l'impôt, <strong>moins de 25 %</strong> du temps de travail (50 % avec accord) pour la sécurité sociale. Ce qui compte, ce qui ne compte pas, et votre seuil si vous êtes à temps partiel.</p>
  </div>
</section>

<section class="prose" id="compteur">
  <div class="wrap">
    <div>
      <p class="eyebrow">Compteur</p>
      <h2 style="margin-top:12px">Où en êtes-vous ?</h2>
      <p class="intro">Le seuil de 34 jours est réduit au prorata du temps partiel et des mois sous contrat dans l'année.</p>
    </div>
    <div>
      <form class="form ttf" id="tt" onsubmit="return false">
        <label>Jours de télétravail en France<input id="ttDays" type="number" inputmode="numeric" min="0" max="366" value="30"></label>
        <label>Jours de mission hors Luxembourg<input id="ttTrips" type="number" inputmode="numeric" min="0" max="366" value="2"></label>
        <label>Temps de travail (%)<input id="ttPct" type="number" inputmode="numeric" min="10" max="100" value="100"></label>
        <label>Mois sous contrat dans l'année<input id="ttMonths" type="number" inputmode="numeric" min="1" max="12" value="12"></label>
      </form>
      <div class="callout" id="ttOut" style="margin-top:18px" aria-live="polite"></div>
      <p class="note">Comptez une demi-journée comme un jour. Les congés, repos, jours fériés et jours de maladie ne comptent pas.</p>
    </div>
  </div>
</section>

<section class="prose" id="impot">
  <div class="wrap">
    <div>
      <p class="eyebrow">Impôt</p>
      <h2 style="margin-top:12px">La règle des 34 jours</h2>
      <p class="intro">Avenant du 7 novembre 2022 à la convention fiscale franco-luxembourgeoise, appliqué depuis le 1ᵉʳ janvier 2023. Aucun texte ne relève ce seuil à ce jour.</p>
    </div>
    <div class="txt">
      <h3>Les jours qui comptent</h3>
      <ul>
        <li>Les jours travaillés en France, votre pays de résidence, dont le télétravail ;</li>
        <li>les jours travaillés dans un autre pays que le Luxembourg (missions, déplacements) ;</li>
        <li>les jours de formation professionnelle suivie en France ;</li>
        <li>toute fraction de journée, qui compte comme une journée entière.</li>
      </ul>
      <h3>Les jours qui ne comptent pas</h3>
      <p>Les jours où votre présence en France n'est pas liée à votre travail : congés, repos hebdomadaire et jours fériés non travaillés, incapacité de travail pour maladie, force majeure indépendante de l'employeur et du salarié.</p>
      <h3>Au-delà de 34 jours</h3>
      <p>La France peut imposer la rémunération <strong>dès le premier jour</strong>, à hauteur du temps passé à travailler en France ou dans un pays tiers. Cette part se déclare en <strong>case 1AG</strong> (ou 1BG) et donne lieu à des acomptes de prélèvement à la source. Le reste du salaire suit la règle habituelle : 2047, cases 1AF et 8TK (<a href="/impot-frontalier#france">voir le guide</a>).</p>
      <p>Deux exceptions : les indemnités de maladie ou de maternité versées par la sécurité sociale d'un État sont imposables dans cet État, et les heures supplémentaires sont imposables là où elles ont été effectuées.</p>
    </div>
  </div>
</section>

<section class="prose" id="secu">
  <div class="wrap">
    <div>
      <p class="eyebrow">Sécurité sociale</p>
      <h2 style="margin-top:12px">Moins de 25 %, ou moins de 50 % avec accord</h2>
    </div>
    <div class="txt">
      <p>Vous restez affilié à la sécurité sociale luxembourgeoise tant que vous travaillez <strong>moins de 25 %</strong> de votre temps en France. Depuis le 1ᵉʳ juillet 2023, l'accord-cadre européen sur le télétravail transfrontalier permet d'aller jusqu'à <strong>moins de 50 %</strong> de télétravail dans le pays de résidence, sur demande de l'employeur et avec un certificat A1 de trois ans au plus.</p>
      <p>Les deux seuils sont indépendants : 40 jours de télétravail restent sous 25 % du temps de travail, mais dépassent les 34 jours fiscaux.</p>
      ${LEAD}
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([x, y]) => `      <details><summary>${x}</summary><p>${y}</p></details>`).join("\n")}
    </div>
  </div>
</section>

<section class="prose">
  <div class="wrap">
    <div><p class="eyebrow">Sources</p></div>
    <div class="txt"><p class="note"><a href="https://impotsdirects.public.lu/dam-assets/fr/conventions/conv/avenant-a-la-convention-lu-fr-34-jours-et-fonction-publique-signe-7-novembre-2022.pdf" rel="noopener">Avenant du 7 novembre 2022</a> · <a href="https://eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/Transfrontalier/Fiche_1_2025_Revenus_TS_DDFIP57.pdf" rel="noopener">DDFiP de la Moselle, fiche frontaliers</a> · <a href="https://ccss.public.lu/en/employeurs/secteur-prive/activite-etranger/accord-teletravail.html" rel="noopener">CCSS, accord-cadre</a> · <a href="https://guichet.public.lu/fr/citoyens/travail/conditions-travail/teletravail/teletravail.html" rel="noopener">Guichet.lu, télétravail</a></p></div>
  </div>
</section>

<script>
(function(){
  var $=function(i){return document.getElementById(i)};
  function n(i,min,max){var v=parseFloat($(i).value);return isNaN(v)?min:Math.min(max,Math.max(min,v))}
  function upd(){
    var d=n("ttDays",0,366), t=n("ttTrips",0,366), p=n("ttPct",10,100), m=n("ttMonths",1,12);
    var seuil=34*p/100*m/12, tot=d+t, s=(Math.round(seuil*10)/10).toLocaleString("fr-FR");
    var reste=seuil-tot;
    $("ttOut").innerHTML = tot<=seuil
      ? "<strong>"+tot+" jour"+(tot>1?"s":"")+" sur "+s+" autorisés.</strong> Il vous reste "+(Math.floor(reste*10)/10).toLocaleString("fr-FR")+" jour(s) : votre salaire reste imposable au Luxembourg seulement."
      : "<strong>Seuil dépassé : "+tot+" jours pour "+s+" autorisés.</strong> La France peut imposer la part du salaire de ces "+tot+" jours, dès le premier, en case 1AG avec des acomptes. <a href=\\"/diagnostic#diagnostic\\">Faites vérifier votre cas gratuitement</a>.";
  }
  ["ttDays","ttTrips","ttPct","ttMonths"].forEach(function(i){$(i).addEventListener("input",upd)}); upd();
})();
</script>
` + FOOT;
}

/* ------------------------------------------------------------------ voiture de société et leasing */
function carPage() {
  const url = "/voiture-de-societe-luxembourg";
  const G = 5000, PRICE = 45000;
  const atnEv = PRICE * 0.005, atnTh = PRICE * 0.02;
  const base = D.payslip(G, 1, 0, {}), ev = D.payslip(G, 1, 0, { atn: atnEv }), th = D.payslip(G, 1, 0, { atn: atnTh });
  const atnCell = (atn, net) => `<td data-g="${G}" data-c="1" data-km="0" data-atn="${atn}">${f2(net)} €</td>`;
  const title = "Voiture de société et leasing au Luxembourg 2026 : calcul de l'avantage en nature";
  const desc = "Voiture de société au Luxembourg : avantage en nature de 0,5 % à 2 % du prix catalogue par mois, électrique, hybride, thermique. Calculateur net 2026, leasing opérationnel ou financier, rachat en fin de contrat.";
  const q = [
    ["Comment est calculé l'avantage en nature d'une voiture de société au Luxembourg ?", "Chaque mois, un pourcentage du prix d'acquisition du véhicule neuf, options et TVA comprises, remise déduite : 0,5 % ou 0,6 % pour une électrique immatriculée jusqu'en 2026, 2 % pour une thermique ou hybride immatriculée depuis 2025. Ce montant s'ajoute au salaire brut pour les cotisations et l'impôt."],
    ["Le loyer du leasing sert-il de base de calcul ?", "Non. Pour une voiture en leasing, en location ou d'occasion, on retient la même base que pour un achat : le prix du véhicule à l'état neuf, options et TVA comprises, diminué de la remise."],
    ["Une hybride rechargeable bénéficie-t-elle d'un taux réduit ?", "Non, plus depuis 2025. Une voiture à moteur thermique, seul ou hybride, immatriculée à partir du 1er janvier 2025 sans contrat signé avant cette date, est évaluée à 2 % par mois."],
    ["Quel taux pour une voiture de société électrique en 2027 ?", "Pour une électrique immatriculée à partir du 1er janvier 2027 sans contrat signé au plus tard le 31 décembre 2026 : 1 % par mois (consommation jusqu'à 180 Wh/km, ou hydrogène) ou 1,2 %. Une électrique commandée par contrat signé en 2026 et immatriculée jusqu'au 31 décembre 2027 garde 0,5 % ou 0,6 %."],
    ["Que se passe-t-il si je rachète ma voiture de société en fin de leasing ?", "Si le prix payé est inférieur à la valeur de marché, la différence est un avantage imposable. La valeur de marché se calcule par un barème officiel : 75 % du prix neuf à la mise en service, puis 10 points de moins par an, jusqu'à 0 au bout de 90 mois. L'avantage est plafonné."],
  ];
  const buyback = [[12, 65], [24, 55], [36, 45], [48, 35], [60, 25], [72, 15], [84, 5], [90, 0]];
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Voiture de société et leasing au Luxembourg : l'avantage en nature en 2026", url), crumbs([["brutnet.lu", "/"], ["Voiture de société et leasing", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Voiture de société · leasing · Luxembourg · règles en vigueur en 2026</p>
    <h1 style="margin-top:18px">Voiture de société au Luxembourg : <mark>ce qu'elle coûte sur votre net</mark>.</h1>
    <p class="lede">Une voiture de société mise à votre disposition est un avantage en nature : chaque mois, <strong>0,5 % à 2 % de son prix catalogue</strong> s'ajoutent à votre brut pour les cotisations et l'impôt. À ${gLabel(G)} € brut, une voiture de ${gLabel(PRICE)} € coûte ${f2(base.net - ev.net)} € net par mois si elle est électrique, ${f2(base.net - th.net)} € si elle est thermique ou hybride.</p>
  </div>
</section>

<section class="prose" id="calcul">
  <div class="wrap">
    <div>
      <p class="eyebrow">Calculateur</p>
      <h2 style="margin-top:12px">Votre avantage en nature</h2>
      <p class="intro">Barème du règlement grand-ducal du 23 décembre 2016 modifié, sans frais de déplacement. Calcul d'un mois de novembre 2026.</p>
    </div>
    <div>
      <form class="form ttf" id="car" onsubmit="return false">
        <label>Prix neuf TTC, options comprises, remise déduite (€)<input id="cPrice" type="number" inputmode="numeric" min="0" step="500" value="${PRICE}"></label>
        <label>Motorisation<select id="cType">
          <option value="e1">Électrique, jusqu'à 180 Wh/km (ou 200 Wh/km et 150 kW)</option>
          <option value="e2">Électrique, autre</option>
          <option value="h">Hydrogène</option>
          <option value="t" selected>Thermique ou hybride, dont rechargeable</option>
        </select></label>
        <label>Immatriculation<select id="cDate">
          <option value="now" selected>À partir de 2025, ou contrat signé en 2026</option>
          <option value="2027">À partir de 2027, sans contrat signé en 2026</option>
          <option value="old">Thermique immatriculée en 2023 ou 2024</option>
        </select></label>
        <label id="cCo2Wrap">CO₂ WLTP (g/km) et carburant<span style="display:flex;gap:8px"><input id="cCo2" type="number" inputmode="numeric" min="1" max="400" value="120"><select id="cFuel"><option value="p">Essence</option><option value="d">Diesel</option></select></span></label>
        <label>Participation fixe du salarié (€ / mois)<input id="cPart" type="number" inputmode="numeric" min="0" step="10" value="0"></label>
        <label>Salaire brut mensuel (€)<input id="cGross" type="number" inputmode="numeric" min="0" step="100" value="${G}"></label>
        <label>Classe d'impôt<select id="cCls"><option value="1">1</option><option value="1a">1a</option><option value="2">2</option></select></label>
      </form>
      <table class="ptable ex num" style="margin-top:18px" aria-live="polite">
        <tbody>
          <tr><td>Taux mensuel</td><td id="oRate">—</td></tr>
          <tr><td>Avantage en nature imposable</td><td id="oAtn">—</td></tr>
          <tr><td>Net sans voiture</td><td id="oNet0">—</td></tr>
          <tr><td>Net avec la voiture</td><td id="oNet1">—</td></tr>
          <tr><td><strong>Coût de la voiture sur votre net</strong></td><td id="oCost"><strong>—</strong></td></tr>
        </tbody>
      </table>
      <p class="note">La participation à un leasing n'est déductible que dans la limite de 20 % du coût supporté par l'employeur. Les frais variables que vous payez (carburant, entretien) ne réduisent pas l'avantage.</p>
    </div>
  </div>
</section>

<section class="prose" id="taux">
  <div class="wrap">
    <div>
      <p class="eyebrow">Barème 2026</p>
      <h2 style="margin-top:12px">Les taux selon la motorisation</h2>
      <p class="intro">Pourcentage mensuel du prix d'acquisition du véhicule neuf, options et TVA comprises, remise déduite. Même base pour une voiture en leasing, en location ou d'occasion.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Voiture</th><th>Immatriculée jusqu'au 31/12/2026*</th><th>À partir du 1/1/2027</th></tr></thead>
        <tbody>
          <tr><td>Électrique jusqu'à 180 Wh/km, ou jusqu'à 200 Wh/km et 150 kW</td><td>0,5 %</td><td>1 %</td></tr>
          <tr><td>Autre électrique</td><td>0,6 %</td><td>1,2 %</td></tr>
          <tr><td>Hydrogène</td><td>0,5 %</td><td>1 %</td></tr>
          <tr><td>Thermique ou hybride, immatriculée depuis 2025</td><td>2 %</td><td>2 %</td></tr>
        </tbody>
      </table>
      <p class="note">* Ou immatriculée jusqu'au 31 décembre 2027 si le contrat a été signé au plus tard le 31 décembre 2026. Les voitures thermiques immatriculées en 2023 ou 2024 (ou commandées avant 2025 et immatriculées en 2025) restent au barème CO₂ : de 0,8 % à 1,8 % en essence, de 1 % à 1,8 % en diesel.</p>
      <table class="ptable" style="margin-top:14px">
        <thead><tr><th>CO₂, voitures de 2023-2024</th><th>Essence, seule ou hybride</th><th>Diesel, seul ou hybride</th></tr></thead>
        <tbody>
          <tr><td>jusqu'à 50 g/km</td><td>0,8 %</td><td>1,0 %</td></tr>
          <tr><td>50 à 80 g/km</td><td>1,0 %</td><td>1,2 %</td></tr>
          <tr><td>80 à 110 g/km</td><td>1,2 %</td><td>1,4 %</td></tr>
          <tr><td>110 à 130 g/km</td><td>1,5 %</td><td>1,6 %</td></tr>
          <tr><td>plus de 130 g/km</td><td>1,8 %</td><td>1,8 %</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="prose" id="exemple">
  <div class="wrap">
    <div>
      <p class="eyebrow">Exemple</p>
      <h2 style="margin-top:12px">${gLabel(G)} € brut, voiture de ${gLabel(PRICE)} €</h2>
      <p class="intro">Classe 1, sans frais de déplacement, sans participation du salarié.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Situation</th><th>Avantage / mois</th><th>Net</th><th>Coût net / mois</th></tr></thead>
        <tbody>
          <tr><td>Sans voiture de société</td><td>—</td>${cell(G, 1, 0, base.net)}<td>—</td></tr>
          <tr><td>Électrique, 0,5 %</td><td>${f2(atnEv)} €</td>${atnCell(atnEv, ev.net)}<td>${f2(base.net - ev.net)} €</td></tr>
          <tr><td>Thermique ou hybride, 2 %</td><td>${f2(atnTh)} €</td>${atnCell(atnTh, th.net)}<td>${f2(base.net - th.net)} €</td></tr>
        </tbody>
      </table>
      <p class="note">L'avantage en nature est soumis aux cotisations sociales et à la retenue d'impôt comme du salaire, mais il n'est pas versé : il réduit le net. Frontalier : il fait partie du montant à déclarer en France (cases 1AF et 8TK).</p>
      ${LEAD}
    </div>
  </div>
</section>

<section class="prose" id="leasing">
  <div class="wrap">
    <div>
      <p class="eyebrow">Leasing</p>
      <h2 style="margin-top:12px">Leasing opérationnel, financier, privé : les différences</h2>
      <p class="intro">Pour l'avantage en nature du salarié, le type de contrat ne change rien : la base reste le prix neuf du véhicule. Il change en revanche qui supporte les risques et ce qui se passe en fin de contrat.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th></th><th>Leasing opérationnel</th><th>Leasing financier</th></tr></thead>
        <tbody>
          <tr><td>Aussi appelé</td><td>location longue durée, renting</td><td>crédit-bail</td></tr>
          <tr><td>Propriétaire</td><td>la société de leasing, pendant et après le contrat</td><td>la société de leasing, jusqu'à la levée de l'option</td></tr>
          <tr><td>Loyer</td><td>usage du véhicule, souvent avec entretien, pneus, assurance et assistance</td><td>financement du véhicule, services en général à part</td></tr>
          <tr><td>Fin de contrat</td><td>restitution du véhicule, frais si kilométrage ou état non conformes</td><td>option d'achat à un prix fixé d'avance</td></tr>
          <tr><td>Risque de revente</td><td>pour le loueur</td><td>pour le preneur</td></tr>
          <tr><td>Pour qui</td><td>flottes de voitures de société, budget mensuel fixe</td><td>entreprise ou indépendant qui veut garder le véhicule</td></tr>
        </tbody>
      </table>
      <div class="txt" style="margin-top:20px">
        <h3>Leasing privé payé par l'employeur</h3>
        <p>Si vous prenez vous-même une voiture en leasing et que l'employeur en rembourse tout ou partie, ce n'est plus une voiture de société : le remboursement est du <strong>salaire imposable</strong>, forfait ou frais réels. Le barème de 0,5 % à 2 % ne s'applique pas.</p>
        <h3>Voiture contre baisse de salaire</h3>
        <p>Si l'employeur vous donne une voiture en échange d'une réduction de votre salaire en espèces, l'évaluation forfaitaire ne s'applique pas : la baisse de salaire est comparée à la valeur réelle de l'avantage.</p>
        <h3>Le carnet de bord, alternative au forfait</h3>
        <p>À la place du pourcentage, l'avantage peut être calculé au kilomètre privé réel : vous tenez un carnet de bord de tous vos trajets privés, domicile-travail compris, et l'employeur applique le prix de revient kilométrique de la voiture. Le carnet est joint au compte de salaire.</p>
      </div>
    </div>
  </div>
</section>

<section class="prose" id="rachat">
  <div class="wrap">
    <div>
      <p class="eyebrow">Fin de leasing</p>
      <h2 style="margin-top:12px">Racheter sa voiture de société</h2>
      <p class="intro">Si vous rachetez la voiture moins cher que sa valeur de marché, la différence est un avantage imposable.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Âge du véhicule</th><th>Valeur de marché, en % du prix neuf</th></tr></thead>
        <tbody>
          <tr><td>mise en service</td><td>75 %</td></tr>
${buyback.map(([m, p]) => `          <tr><td>${m} mois</td><td>${p} %</td></tr>`).join("\n")}
        </tbody>
      </table>
      <p class="note">Barème officiel : 75 % du prix neuf, moins 0,8333 point par mois. En cas de désaccord, une expertise d'un professionnel de l'automobile peut fixer une autre valeur. L'avantage total (mise à disposition au taux de 1,5 % puis rachat) est plafonné au prix d'acquisition, diminué de vos participations déductibles.</p>
      <div class="txt" style="margin-top:14px"><p>Exemple de l'administration : voiture de 30 000 € rachetée au bout de 48 mois pour l'option d'achat de 3 000 € (10 %), alors que le barème la vaut 10 500 € (35 %). L'avantage théorique est de 7 500 €, ramené au plafond de 5 400 € compte tenu de l'avantage déjà imposé et des participations.</p></div>
    </div>
  </div>
</section>

<section class="faq" id="questions">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    <div>
${q.map(([x, y]) => `      <details><summary>${x}</summary><p>${y}</p></details>`).join("\n")}
    </div>
  </div>
</section>

<section class="prose">
  <div class="wrap">
    <div><p class="eyebrow">Sources</p></div>
    <div class="txt"><p class="note"><a href="https://conseil-etat.public.lu/content/dam/conseil_etat/fr/avis/2024/10122024/62013-texte-du-projet-de-rglement-grand-ducal-02122024.pdf" rel="noopener">Règlement grand-ducal du 23 décembre 2016, texte coordonné</a> · <a href="https://impotsdirects.public.lu/fr/archive/newsletter/2025/nl10012025.html" rel="noopener">ACD, prolongation des taux électriques (règlement du 20 décembre 2024)</a> · <a href="https://impotsdirects.public.lu/dam-assets/fr/legislation/legi18/circulaireLIR-104-1du16072018.pdf" rel="noopener">circulaire L.I.R. n° 104/1 du 16 juillet 2018</a> · <a href="https://impotsdirects.public.lu/fr/az/a/avant_nature.html" rel="noopener">ACD, avantages en nature</a></p></div>
  </div>
</section>

<script src="/calc.js"></script>
<script>
(function(){
  var $=function(i){return document.getElementById(i)};
  var f=function(n){return n.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+"\\u00a0€"};
  function rate(){
    var t=$("cType").value, d=$("cDate").value;
    if(d==="old"){ var c=+$("cCo2").value||0, di=$("cFuel").value==="d";
      var T=di?[[50,1],[80,1.2],[110,1.4],[130,1.6],[1e9,1.8]]:[[50,.8],[80,1],[110,1.2],[130,1.5],[1e9,1.8]];
      for(var i=0;i<T.length;i++) if(c<=T[i][0]) return T[i][1]; }
    if(t==="t") return 2;
    var late=d==="2027";
    return t==="e2" ? (late?1.2:0.6) : (late?1:0.5);
  }
  function upd(){
    var old=$("cDate").value==="old"; $("cCo2Wrap").style.display=old?"":"none";
    if(old){ $("cType").value="t"; }
    var r=rate(), price=Math.max(0,+$("cPrice").value||0), part=Math.max(0,+$("cPart").value||0);
    var atn=Math.max(0,price*r/100-part), g=Math.max(0,+$("cGross").value||0), cls=$("cCls").value; cls=cls==="1a"?"1a":+cls;
    var o={cim:cls==="1a"}, n0=DC.payslip(g,cls,0,o).net, o1={cim:cls==="1a",atn:atn}, n1=DC.payslip(g,cls,0,o1).net;
    $("oRate").textContent=(r+"").replace(".",",")+"\\u00a0% par mois"; $("oAtn").textContent=f(atn);
    $("oNet0").textContent=f(n0); $("oNet1").textContent=f(n1); $("oCost").innerHTML="<strong>"+f(n0-n1)+" par mois</strong>";
  }
  ["cPrice","cType","cDate","cCo2","cFuel","cPart","cGross","cCls"].forEach(function(i){$(i).addEventListener("input",upd);$(i).addEventListener("change",upd)}); upd();
})();
</script>
` + FOOT;
}

/* montants insécables : « 3 151,96 € » ne se coupe pas en fin de ligne */
const nb = (html) => html.replace(/(\d) (?=\d{3}\b|€|%)/g, "$1\u00a0");

/* ------------------------------------------------------------------ écriture */
fs.mkdirSync(path.join(ROOT, "salaire-brut-net"), { recursive: true });
AMOUNTS.forEach((g, i) => fs.writeFileSync(path.join(ROOT, "salaire-brut-net", `${g}-euros.html`), nb(salaryPage(g, i))));
fs.writeFileSync(path.join(ROOT, "tableau-salaire-brut-net-luxembourg.html"), nb(tablePage()));
fs.writeFileSync(path.join(ROOT, "salaire-minimum-luxembourg.html"), nb(ssmPage()));
fs.writeFileSync(path.join(ROOT, "remboursement-impot-luxembourg.html"), nb(rembPage()));
fs.writeFileSync(path.join(ROOT, "classe-impot-luxembourg.html"), nb(classPage()));
fs.writeFileSync(path.join(ROOT, "teletravail-frontalier-luxembourg.html"), nb(teleworkPage()));
fs.writeFileSync(path.join(ROOT, "voiture-de-societe-luxembourg.html"), nb(carPage()));

const core = ["/", "/tableau-salaire-brut-net-luxembourg", "/salaire-minimum-luxembourg", "/impot-frontalier", "/remboursement-impot-luxembourg", "/classe-impot-luxembourg", "/teletravail-frontalier-luxembourg", "/voiture-de-societe-luxembourg", "/diagnostic"];
const urls = [...core, ...AMOUNTS.map(slugOf)];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}
</urlset>
`);
console.log(`${AMOUNTS.length} pages salaire + tableau + salaire minimum + sitemap (${urls.length} URL)`);

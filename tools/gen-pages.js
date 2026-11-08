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
    <div class="links"><a href="/">Salaire brut net Luxembourg</a><a href="/tableau-salaire-brut-net-luxembourg">Tableau brut net 2026</a><a href="/salaire-minimum-luxembourg">Salaire minimum 2026</a><a href="/impot-frontalier">Déclaration d'impôts frontalier</a><a href="/remboursement-impot-luxembourg">Remboursement d'impôt</a><a href="/diagnostic">Retraite et crédit frontalier</a><a href="/diagnostic#sources">Méthode et sources</a><a href="/mentions-legales">Mentions légales</a><a href="/mentions-legales#confidentialite">Confidentialité</a></div>
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

/* montants insécables : « 3 151,96 € » ne se coupe pas en fin de ligne */
const nb = (html) => html.replace(/(\d) (?=\d{3}\b|€|%)/g, "$1\u00a0");

/* ------------------------------------------------------------------ écriture */
fs.mkdirSync(path.join(ROOT, "salaire-brut-net"), { recursive: true });
AMOUNTS.forEach((g, i) => fs.writeFileSync(path.join(ROOT, "salaire-brut-net", `${g}-euros.html`), nb(salaryPage(g, i))));
fs.writeFileSync(path.join(ROOT, "tableau-salaire-brut-net-luxembourg.html"), nb(tablePage()));
fs.writeFileSync(path.join(ROOT, "salaire-minimum-luxembourg.html"), nb(ssmPage()));
fs.writeFileSync(path.join(ROOT, "remboursement-impot-luxembourg.html"), nb(rembPage()));

const core = ["/", "/tableau-salaire-brut-net-luxembourg", "/salaire-minimum-luxembourg", "/impot-frontalier", "/remboursement-impot-luxembourg", "/diagnostic"];
const urls = [...core, ...AMOUNTS.map(slugOf)];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}
</urlset>
`);
console.log(`${AMOUNTS.length} pages salaire + tableau + salaire minimum + sitemap (${urls.length} URL)`);

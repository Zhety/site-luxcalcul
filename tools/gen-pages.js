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
const TODAY = "2026-11-11";
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
    ${nav(url)}
    <a class="btn small" href="/diagnostic#diagnostic">Diagnostic gratuit</a>
  </div>
</header>
`;
}

/* menu « Guide » de l'en-tête : même bloc sur toutes les pages (générées et écrites à la main) */
const GUIDE = [
  ["Impôts", [
    ["/impot-frontalier", "Déclarer ses impôts", "Cases 1AF et 8TK, décompte au Luxembourg"],
    ["/remboursement-impot-luxembourg", "Remboursement d'impôt", "Récupérer l'impôt payé en trop"],
    ["/classe-impot-luxembourg", "Classe d'impôt", "1, 1a ou 2 : les règles officielles"],
    ["/credit-impot-luxembourg", "Crédits d'impôt 2026", "CIS, CISSM, conjoncture, monoparental"],
    ["/teletravail-frontalier-luxembourg", "Télétravail : 34 jours", "Compteur de jours et seuil de 25 %"],
  ]],
  ["Salaire", [
    ["/tableau-salaire-brut-net-luxembourg", "Tableau brut → net 2026", "Le net de chaque salaire, classes 1, 1a et 2"],
    ["/salaire-minimum-luxembourg", "Salaire minimum 2026", "Le salaire social minimum, brut et net"],
    ["/voiture-de-societe-luxembourg", "Voiture de société et leasing", "Avantage en nature et calculateur"],
    ["/metiers-luxembourg", "Métiers les mieux payés", "Salaire par profession et secteur"],
    ["/metiers-qui-recrutent-luxembourg", "Métiers qui recrutent", "Offres 2026 et métiers en pénurie"],
    ["/entreprises-qui-recrutent-luxembourg", "Entreprises qui recrutent", "Les plus gros employeurs et embauches"],
  ]],
];
const NAV_JS = `(function(){var d=document.currentScript.parentNode.querySelector(".dd"),b=d.querySelector("button");function s(o){d.classList.toggle("open",o);b.setAttribute("aria-expanded",o)}b.addEventListener("click",function(){s(!d.classList.contains("open"))});document.addEventListener("click",function(e){if(!d.contains(e.target))s(false)});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&d.classList.contains("open")){s(false);b.focus()}})})()`;
function nav(url) {
  const cur = (u) => (u === url ? ' aria-current="page"' : "");
  const inGuide = GUIDE.some(([, items]) => items.some(([u]) => u === url));
  return `<nav class="nav" aria-label="Navigation principale">
      <a href="/"${cur("/")}>Brut → net</a>
      <div class="dd${inGuide ? " cur" : ""}">
        <button type="button" class="dd-btn" aria-expanded="false" aria-controls="dd-guide">Guide</button>
        <div class="dd-menu" id="dd-guide">
${GUIDE.map(([h, items]) => `          <div class="dd-col"><p class="dd-h">${h}</p>
${items.map(([u, t, s]) => `            <a href="${u}"${cur(u)}><b>${t}</b><span>${s}</span></a>`).join("\n")}
          </div>`).join("\n")}
        </div>
      </div>
      <a href="/diagnostic"${cur("/diagnostic")}>Retraite et crédit</a>
      <a href="/diagnostic#sources">Méthode</a>
      <script>${NAV_JS}</script>
    </nav>`;
}

const FOOT = `
<footer>
  <div class="wrap">
    <span>© 2026 brutnet.lu · Thionville</span>
    <div class="links"><a href="/">Salaire brut net Luxembourg</a><a href="/tableau-salaire-brut-net-luxembourg">Tableau brut net 2026</a><a href="/salaire-minimum-luxembourg">Salaire minimum 2026</a><a href="/impot-frontalier">Déclaration d'impôts frontalier</a><a href="/remboursement-impot-luxembourg">Remboursement d'impôt</a><a href="/classe-impot-luxembourg">Classes d'impôt</a><a href="/credit-impot-luxembourg">Crédits d'impôt 2026</a><a href="/teletravail-frontalier-luxembourg">Télétravail 34 jours</a><a href="/voiture-de-societe-luxembourg">Voiture de société et leasing</a><a href="/metiers-luxembourg">Métiers les mieux payés</a><a href="/metiers-qui-recrutent-luxembourg">Métiers qui recrutent</a><a href="/entreprises-qui-recrutent-luxembourg">Entreprises qui recrutent</a><a href="/diagnostic">Retraite et crédit frontalier</a><a href="/diagnostic#sources">Méthode et sources</a><a href="/mentions-legales">Mentions légales</a><a href="/mentions-legales#confidentialite">Confidentialité</a></div>
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
      <p class="note">Classe 1a avec le <a href="/credit-impot-luxembourg#cim">crédit d'impôt monoparental</a> (${f2(r.c1a.cim)} € par mois), versé sur la fiche d'un résident ; un frontalier assimilé le récupère par sa déclaration. Le 13ᵉ mois de ${G} € est imposé à part : il rapporte ${f2(r.b1.net)} € net en classe 1 et ${f2(r.b2.net)} € en classe 2.</p>
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
      <p class="note">Montants, conditions et rappel de décembre : <a href="/credit-impot-luxembourg">les crédits d'impôt 2026</a>.</p>
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
      <p class="intro">Classe 1 : célibataire, ou frontalier marié sans taux global. Classe 2 : résident marié. Classe 1a : parent isolé, <a href="/credit-impot-luxembourg#cim">crédit d'impôt monoparental</a> compris (sur la fiche d'un résident ; par la déclaration pour un frontalier).</p>
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
      <h2 style="margin-top:12px">Les quatre cas où un frontalier récupère de l'impôt</h2>
    </div>
    <div class="txt">
      <h3>1. Vous êtes marié et votre conjoint gagne peu</h3>
      <p>Sans démarche, un frontalier marié est imposé en <strong>classe 1</strong>, comme un célibataire. S'il demande l'assimilation (au moins 90 % des revenus de chaque conjoint imposables au Luxembourg, ou moins de 13 000 € de revenus nets non imposables au Luxembourg), le couple est imposé au <strong>taux global</strong> : l'impôt de classe 2 sur le revenu mondial du ménage, appliqué aux seuls revenus luxembourgeois.</p>
      <h3>2. Vous avez des assurances, un crédit, de l'épargne</h3>
      <p>Une fois assimilé, vous déduisez comme un résident : primes d'assurance et intérêts débiteurs, épargne-logement, prévoyance-vieillesse, intérêts d'emprunt de votre résidence principale, frais de garde. Le détail des plafonds est dans le <a href="/impot-frontalier#deductions">guide de la déclaration</a>.</p>
      <h3>3. Votre fiche ne tient pas compte de votre trajet réel</h3>
      <p>Le décompte annuel (163 NR) prend en compte les frais de déplacement selon la distance réelle domicile-travail, les frais d'obtention et les dépenses listées sur le formulaire.</p>
      <h3>4. Vous élevez seul votre enfant</h3>
      <p>Le <a href="/credit-impot-luxembourg#cim">crédit d'impôt monoparental</a> vaut jusqu'à ${f0(D.P.lu.cim.full)} € par an. Il n'est jamais versé sur la fiche de paie d'un frontalier : il faut être assimilé et le demander par la déclaration (modèle 100), celle de 2025 jusqu'au 31 décembre 2026.</p>
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
      <p class="intro">Net mensuel de novembre 2026, sans frais de déplacement. Classe 1a avec le <a href="/credit-impot-luxembourg#cim">crédit d'impôt monoparental</a>, versé sur la fiche d'un résident et par la déclaration pour un frontalier.</p>
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

/* ------------------------------------------------------------------ crédits d'impôt 2026 */
/* cellule vérifiée par calc.test.js : data-cr = cis | co2 | cissm | cic | tot, data-g = brut mensuel */
const crOf = (g) => {
  const cis = D.cisAnnual(g * 12) / 12, co2 = D.cico2Annual(g * 12) / 12, cissm = D.cissmMonthly(g), cic = D.cicMonthly(g);
  return { cis, co2, cissm, cic, tot: cis + co2 + cissm + cic };
};
const crCell = (g, k, v) => `<td data-cr="${k}" data-g="${g}">${v > 0 ? f2(v) + " €" : "—"}</td>`;

function creditPage() {
  const url = "/credit-impot-luxembourg";
  const a = crOf(3000), b = crOf(5000), top = crOf(15000);
  const ssmq = SSMQ, cimFull = D.P.lu.cim.full;
  const rows = [[1800], [2500], [SSM, "salaire minimum"], [3000], [ssmq, "minimum qualifié"], [3600], [4000], [4600], [5000], [6000], [6667], [8000], [10000], [15000]];
  const title = "Crédit d'impôt Luxembourg 2026 : CIS, CO2, CISSM, conjoncture, monoparental";
  const desc = `Les crédits d'impôt 2026 au Luxembourg : CIS jusqu'à 600 € par an, CI-CO2 216 €, CISSM 81 € par mois, crédit d'impôt conjoncture de juin à décembre 2026 (rappel en décembre), CIM jusqu'à ${f0(cimFull)} €. Calculateur et règles pour les frontaliers.`;
  const q = [
    ["Quels sont les crédits d'impôt au Luxembourg en 2026 ?", `Pour un salarié : le crédit d'impôt salarié (CIS, jusqu'à 600 € par an), le crédit d'impôt CO2 (216 € par an), le crédit d'impôt salaire social minimum (CISSM, 81 € par mois entre 1 800 et 3 000 € brut) et, de juin à décembre 2026, le crédit d'impôt conjoncture (jusqu'à 27,13 € par mois). Un parent isolé en classe 1a peut obtenir le crédit d'impôt monoparental, jusqu'à ${f0(cimFull)} € par an. Les retraités ont le CIP et le CI-CO2 pensionné.`],
    ["Un frontalier a-t-il droit au crédit d'impôt salarié ?", "Oui. Le CIS, le CI-CO2, le CISSM et le crédit d'impôt conjoncture sont accordés à tout salarié dont le salaire est imposable au Luxembourg et qui est affilié à la sécurité sociale luxembourgeoise ou à celle d'un autre État lié par un accord, la France comprise. L'employeur les verse avec le salaire."],
    ["Quand sera versé le crédit d'impôt conjoncture 2026 ?", "La loi a été votée le 28 octobre 2026, avec effet au 1er juin. D'après l'administration fiscale, les montants dus pour juin à octobre 2026 seront versés en une seule fois, au plus tard fin décembre 2026 ; ceux de novembre et décembre, chaque mois avec le salaire."],
    ["Combien rapporte le crédit d'impôt conjoncture 2026 ?", `Il dépend du salaire brut mensuel : rien sous 1 125 €, ${f2(a.cic)} € par mois à 3 000 €, 22 € entre 4 600 et 9 500 €, 24 € entre 9 925 et 14 175 €, 27,13 € au-delà de 14 916 €. Sur les sept mois de juin à décembre, cela fait jusqu'à 189,91 €.`],
    ["Un frontalier parent isolé peut-il avoir le crédit d'impôt monoparental ?", `Oui, s'il est assimilé à un résident (au moins 90 % des revenus du foyer imposables au Luxembourg, en règle générale), mais uniquement par une déclaration d'impôt (modèle 100) : le CIM n'est jamais versé sur la fiche de paie d'un non-résident. La déclaration de l'année 2025 peut être déposée jusqu'au 31 décembre 2026, pour jusqu'à ${f0(cimFull)} €.`],
    ["Le CISSM augmente-t-il en 2027 ?", "Oui. La loi votée le 28 octobre 2026 le porte de 81 € à 179 € par mois de janvier à juin 2027, puis à 200 € à partir de juillet 2027, toujours entre 1 800 et 3 000 € brut et dégressif jusqu'à 3 600 €."],
  ];
  const r1 = (lab, cis, co2) => `<tr><td>${lab}</td><td>${cis}</td><td>${co2}</td></tr>`;
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Les crédits d'impôt au Luxembourg en 2026", url), crumbs([["brutnet.lu", "/"], ["Crédits d'impôt 2026", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Crédits d'impôt · Luxembourg · année 2026 · mis à jour le 11 novembre 2026</p>
    <h1 style="margin-top:18px">Crédits d'impôt au Luxembourg en 2026 : <mark>ce qu'ils ajoutent à votre net</mark>.</h1>
    <p class="lede">Au Luxembourg, un crédit d'impôt ne fait pas que réduire l'impôt : il est <strong>versé avec le salaire</strong>, même si vous n'en payez pas. Frontalier ou résident, à 3 000 € brut ils ajoutent <strong>${f2(a.tot)} € par mois</strong> au net ; à 5 000 € brut, ${f2(b.tot)} €.</p>
    <div class="callout" style="max-width:68ch;margin-top:26px">
      <strong>Crédit d'impôt conjoncture :</strong> la loi a été votée le 28 octobre 2026, avec effet au 1<sup>er</sup> juin. Les montants de juin à octobre seront versés <strong>en une fois, au plus tard fin décembre 2026</strong> : 5 × 22 € = 110 € pour un salaire entre 4 600 et 9 500 € brut, jusqu'à 135,65 € au-delà de 14 916 €. <a href="#cic">Le barème</a>.
    </div>
  </div>
</section>

<section class="prose" id="calcul">
  <div class="wrap">
    <div>
      <p class="eyebrow">Calculateur</p>
      <h2 style="margin-top:12px">Vos crédits d'impôt 2026</h2>
      <p class="intro">Barèmes officiels de l'administration des contributions directes et loi votée le 28 octobre 2026. Revenu brut mensuel régulier, sans 13ᵉ mois ni prime.</p>
    </div>
    <div>
      <form class="form ttf" id="cr" onsubmit="return false">
        <label>Vous êtes<select id="kSt"><option value="s" selected>Salarié</option><option value="p">Retraité (pension luxembourgeoise)</option></select></label>
        <label>Revenu brut mensuel (€)<input id="kG" type="number" inputmode="decimal" min="0" step="50" value="3000"></label>
        <label>Résidence<select id="kRes"><option value="NR" selected>Frontalier, non-résident</option><option value="R">Résident du Luxembourg</option></select></label>
        <label>Foyer<select id="kFam"><option value="0" selected>Pas parent isolé</option><option value="1">Parent isolé, enfant à la maison (classe 1a)</option></select></label>
      </form>
      <table class="ptable ex num" style="margin-top:18px" aria-live="polite">
        <thead><tr><th>Crédit</th><th>Par mois</th><th>Sur 2026</th></tr></thead>
        <tbody id="kOut"></tbody>
      </table>
      <p class="note" id="kNote"></p>
    </div>
  </div>
</section>

<section class="prose" id="montants">
  <div class="wrap">
    <div>
      <p class="eyebrow">Barème 2026</p>
      <h2 style="margin-top:12px">Les crédits d'impôt selon le salaire</h2>
      <p class="intro">Par mois, pour un salaire brut mensuel régulier sur toute l'année, en novembre 2026 : CIS et crédit CO2, CISSM, crédit d'impôt conjoncture (CIC). Mêmes montants pour un frontalier et un résident, quelle que soit la classe d'impôt.</p>
    </div>
    <div>
      <div class="tscroll"><table class="ptable ex num">
        <thead><tr><th>Brut / mois</th><th>CIS + CO2</th><th>CISSM</th><th>CIC</th><th>Total</th></tr></thead>
        <tbody>
${rows.map(([g, lab]) => { const c = crOf(g); return `          <tr><td>${gLabel(g)} €${lab ? ` <small>${lab}</small>` : ""}</td><td data-cr="cisco2" data-g="${g}">${c.cis + c.co2 > 0 ? f2(c.cis + c.co2) + " €" : "—"}</td>${crCell(g, "cissm", c.cissm)}${crCell(g, "cic", c.cic)}${crCell(g, "tot", c.tot)}</tr>`; }).join("\n")}
        </tbody>
      </table></div>
      <p class="note">Le CIS et le CI-CO2 se calculent sur le salaire brut annuel : ils disparaissent à partir de 80 000 € par an, soit 6 667 € par mois. Le crédit d'impôt conjoncture ne court que de juin à décembre 2026. Ces crédits sont aussi intégrés aux <a href="/tableau-salaire-brut-net-luxembourg">nets du tableau brut → net</a>.</p>
    </div>
  </div>
</section>

<section class="prose" id="cis">
  <div class="wrap">
    <div>
      <p class="eyebrow">CIS et CI-CO2</p>
      <h2 style="margin-top:12px">Crédit d'impôt salarié et crédit CO2</h2>
      <p class="intro">Pour tout salarié imposable au Luxembourg, frontaliers compris. Calculés sur le salaire brut annuel, versés chaque mois par l'employeur.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Salaire brut annuel</th><th>CIS par an</th><th>CI-CO2 par an</th></tr></thead>
        <tbody>
          ${r1("moins de 936 €", "0", "0")}
          ${r1("936 à 11 265 €", "300 + (brut − 936) × 0,029", "216 €")}
          ${r1("11 266 à 40 000 €", "600 €", "216 €")}
          ${r1("40 001 à 79 999 €", "600 − (brut − 40 000) × 0,015", "216 − (brut − 40 000) × 0,0054")}
          ${r1("80 000 € et plus", "0", "0")}
        </tbody>
      </table>
      <div class="txt" style="margin-top:18px">
        <p>Conditions : un salaire <strong>imposable au Luxembourg</strong> et une affiliation personnelle à la sécurité sociale luxembourgeoise, ou à celle d'un autre État lié par un accord. Un frontalier affilié en France parce qu'il dépasse <a href="/teletravail-frontalier-luxembourg">25 % de télétravail</a> y a donc toujours droit tant que son salaire reste imposé au Luxembourg.</p>
        <p>Un seul CIS et un seul CI-CO2 par personne, même avec plusieurs employeurs : ils figurent sur la fiche de retenue principale. Ils ne se cumulent pas avec les crédits des pensionnés ou des indépendants. Une année incomplète ou un salaire variable sont régularisés par le décompte annuel ou la déclaration.</p>
      </div>
    </div>
  </div>
</section>

<section class="prose" id="cissm">
  <div class="wrap">
    <div>
      <p class="eyebrow">CISSM</p>
      <h2 style="margin-top:12px">Crédit d'impôt salaire social minimum</h2>
      <p class="intro">81 € par mois autour du <a href="/salaire-minimum-luxembourg">salaire minimum</a>, en plus du CIS. Il passe à 179 € en janvier 2027 et à 200 € en juillet 2027.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Salaire brut mensuel</th><th>CISSM 2026 par mois</th></tr></thead>
        <tbody>
          <tr><td>moins de 1 800 €</td><td>0</td></tr>
          <tr><td>1 800 à 3 000 €</td><td>81 €</td></tr>
          <tr><td>3 000 à 3 600 €</td><td>81 / 600 × (3 600 − brut), arrondi au cent supérieur</td></tr>
          <tr><td>3 600 € et plus</td><td>0</td></tr>
        </tbody>
      </table>
      <div class="txt" style="margin-top:18px">
        <p>Au salaire minimum non qualifié (${f2(SSM)} € brut), le CISSM est de ${f2(D.cissmMonthly(SSM))} € ; au salaire minimum qualifié (${f2(ssmq)} €), de ${f2(D.cissmMonthly(ssmq))} €.</p>
        <p>À temps partiel ou pour un mois incomplet, on calcule le salaire qu'on aurait touché à temps plein sur tout le mois, puis le CISSM est réduit au prorata des heures payées. Les revenus non périodiques ne comptent pas tant qu'ils ne dépassent pas 3 000 € sur l'année. Il faut une fiche de retenue d'impôt ; sans fiche, l'administration fiscale le verse sur demande après la fin de l'année.</p>
      </div>
    </div>
  </div>
</section>

<section class="prose" id="cic">
  <div class="wrap">
    <div>
      <p class="eyebrow">Crédit d'impôt conjoncture</p>
      <h2 style="margin-top:12px">CIC 2026 : de juin à décembre 2026</h2>
      <p class="intro">Il remplace, pour sept mois, l'adaptation du barème d'impôt à l'index de juin 2026, qui n'entrera en vigueur qu'en janvier 2027. C'est la moitié du crédit conjoncture de 2023.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Salaire brut mensuel</th><th>CIC 2026 par mois</th></tr></thead>
        <tbody>
          <tr><td>moins de 1 125 €</td><td>0</td></tr>
          <tr><td>1 125 à 1 250 €</td><td>(brut − 1 125) × 4/125 ÷ 2</td></tr>
          <tr><td>1 250 à 2 100 €</td><td>[(brut − 1 250) × 3/850 + 4] ÷ 2</td></tr>
          <tr><td>2 100 à 4 600 €</td><td>[(brut − 2 100) × 37/2 500 + 7] ÷ 2</td></tr>
          <tr><td>4 600 à 9 500 €</td><td>22 €</td></tr>
          <tr><td>9 500 à 9 925 €</td><td>[(brut − 9 500) × 4/425 + 44] ÷ 2</td></tr>
          <tr><td>9 925 à 14 175 €</td><td>24 €</td></tr>
          <tr><td>14 175 à 14 916 €</td><td>[(brut − 14 175) × 3/356 + 48] ÷ 2</td></tr>
          <tr><td>plus de 14 916 €</td><td>27,13 €</td></tr>
        </tbody>
      </table>
      <div class="txt" style="margin-top:18px">
        <p>Montant arrondi au cent supérieur. Le brut mensuel comprend tous les éléments du mois, avantages en nature compris, mais pas les revenus non périodiques comme le 13ᵉ mois ou une prime, sauf s'ils remplacent une partie du salaire.</p>
        <p><strong>Versement.</strong> L'employeur le verse avec le salaire si votre fiche de retenue porte l'inscription CIS, frontaliers compris. Comme la loi est arrivée en cours d'année, l'administration fiscale prévoit que les montants de juin à octobre 2026 soient versés <strong>en une seule fois, au plus tard fin décembre 2026</strong>. Sans fiche de retenue, il se demande à l'administration après la fin de l'année.</p>
        <p><strong>Retraités et indépendants.</strong> Le CIC pensionné suit le même barème, sur la pension brute mensuelle. Les indépendants ont un CIC calculé sur le bénéfice net annuel, accordé uniquement par la déclaration. Les trois ne se cumulent pas.</p>
      </div>
    </div>
  </div>
</section>

<section class="prose" id="cim">
  <div class="wrap">
    <div>
      <p class="eyebrow">CIM</p>
      <h2 style="margin-top:12px">Crédit d'impôt monoparental</h2>
      <p class="intro">Jusqu'à ${f0(cimFull)} € par an pour un parent isolé en classe 1a, quel que soit le nombre d'enfants. C'est le crédit que les frontaliers oublient le plus.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Revenu imposable ajusté</th><th>CIM par an</th></tr></thead>
        <tbody>
          <tr><td>moins de 60 000 €</td><td>${f0(cimFull)} €</td></tr>
          <tr><td>60 000 à 105 000 €</td><td>${f0(cimFull)} − (revenu − 60 000) × 0,0612</td></tr>
          <tr><td>plus de 105 000 €</td><td>750 €</td></tr>
        </tbody>
      </table>
      <div class="txt" style="margin-top:18px">
        <p><strong>Conditions :</strong> être en <a href="/classe-impot-luxembourg">classe 1a</a> et avoir dans son ménage au moins un enfant qui ouvre droit à la modération d'impôt pour enfant. Pas de CIM si les deux parents vivent ensemble avec l'enfant, pour une personne mariée ou qui se marie dans l'année, ni pour des partenaires imposés ensemble. Il est réduit de la moitié des pensions alimentaires et autres allocations reçues pour l'enfant au-delà de 2 712 € par an, les allocations familiales n'étant pas comptées.</p>
        <p><strong>Résident :</strong> il peut être inscrit sur la fiche de retenue et versé chaque mois (${f2(cimFull / 12)} €), ou obtenu par le décompte annuel ou la déclaration.</p>
        <p><strong>Frontalier :</strong> il faut être <strong>assimilé à un résident</strong>, et le CIM ne s'obtient <strong>que par la déclaration d'impôt</strong> (modèle 100), jamais sur la fiche de paie. La déclaration de l'année N se dépose jusqu'au 31 décembre de l'année N + 1 : <strong>pour 2025, jusqu'au 31 décembre 2026</strong>. Voir <a href="/remboursement-impot-luxembourg">le remboursement d'impôt</a>.</p>
      </div>
      ${LEAD}
    </div>
  </div>
</section>

<section class="prose" id="frontalier">
  <div class="wrap">
    <div>
      <p class="eyebrow">Frontalier</p>
      <h2 style="margin-top:12px">Ce qu'un frontalier touche, et comment</h2>
      <p class="intro">Tous les crédits liés au salaire sont versés sur la fiche de paie d'un frontalier. Seul le CIM demande une démarche.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Crédit</th><th>Frontalier</th><th>Résident</th></tr></thead>
        <tbody>
          <tr><td>CIS et CI-CO2</td><td>sur la fiche de paie</td><td>sur la fiche de paie</td></tr>
          <tr><td>CISSM</td><td>sur la fiche de paie</td><td>sur la fiche de paie</td></tr>
          <tr><td>Crédit conjoncture 2026</td><td>sur la fiche de paie, rappel au plus tard en décembre</td><td>sur la fiche de paie, rappel au plus tard en décembre</td></tr>
          <tr><td>CIM (parent isolé)</td><td>par la déclaration seulement, si assimilé</td><td>sur la fiche ou par la déclaration</td></tr>
        </tbody>
      </table>
      <p class="note">Ces crédits ne changent rien à la déclaration française : le montant à reporter en cases 1AF et 8TK est le salaire brut moins les cotisations sociales. Voir <a href="/impot-frontalier">la déclaration d'impôts du frontalier</a>.</p>
    </div>
  </div>
</section>

<section class="prose" id="pensionnes">
  <div class="wrap">
    <div>
      <p class="eyebrow">Retraités</p>
      <h2 style="margin-top:12px">CIP et CI-CO2 pensionné</h2>
      <p class="intro">Pour une pension ou une rente imposable au Luxembourg. Mêmes montants que le crédit salarié, avec un minimum de 300 € dès 300 € de pension annuelle.</p>
    </div>
    <div>
      <table class="ptable">
        <thead><tr><th>Pension brute annuelle</th><th>CIP par an</th><th>CI-CO2 par an</th></tr></thead>
        <tbody>
          ${r1("moins de 300 €", "0", "0")}
          ${r1("300 à 935 €", "300 €", "216 €")}
          ${r1("936 à 11 265 €", "300 + (pension − 936) × 0,029", "216 €")}
          ${r1("11 266 à 40 000 €", "600 €", "216 €")}
          ${r1("40 001 à 79 999 €", "600 − (pension − 40 000) × 0,015", "216 − (pension − 40 000) × 0,0054")}
          ${r1("80 000 € et plus", "0", "0")}
        </tbody>
      </table>
      <p class="note">Le CIP ne se cumule pas avec le CIS : une personne qui touche un salaire et une pension n'a droit qu'à un seul des deux.</p>
    </div>
  </div>
</section>

<section class="prose" id="2027">
  <div class="wrap">
    <div>
      <p class="eyebrow">2027</p>
      <h2 style="margin-top:12px">Ce qui change au 1<sup>er</sup> janvier 2027</h2>
      <p class="intro">Mesures de la loi votée le 28 octobre 2026 (accord tripartite du 8 juin 2026).</p>
    </div>
    <div class="txt">
      <ul>
        <li>Fin du <strong>crédit d'impôt conjoncture</strong> au 31 décembre 2026, remplacé par un <strong>barème d'impôt adapté d'une tranche indiciaire</strong> (tranches de revenu multipliées par 1,025).</li>
        <li><strong>CISSM</strong> porté à 179 € par mois de janvier à juin 2027, puis à 200 € à partir de juillet 2027, avec une hausse structurelle de 3,8 % du salaire minimum en janvier 2027.</li>
        <li><strong>Épargne-logement</strong> : plafond de déduction de 1 344 € par personne pour tous les âges, au lieu de 672 € après 40 ans.</li>
      </ul>
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
    <div class="txt"><p class="note"><a href="https://impotsdirects.public.lu/fr/az/c/credit-impot-salaries/cis2026.html" rel="noopener">ACD, CIS et CI-CO2 salarié 2026</a> · <a href="https://impotsdirects.public.lu/fr/az/c/CIP/cip2026.html" rel="noopener">ACD, CIP et CI-CO2 pensionné 2026</a> · <a href="https://impotsdirects.public.lu/fr/az/c/cim/cim2025.html" rel="noopener">ACD, crédit d'impôt monoparental</a> · <a href="https://impotsdirects.public.lu/fr/archive/newsletter/2026/nl301020261.html" rel="noopener">ACD, newsletter du 30 octobre 2026</a> · <a href="https://www.chd.lu/fr/dossier/8775" rel="noopener">Chambre des députés, projet de loi 8775</a> (CISSM, CIC 2026, épargne-logement) · <a href="https://wdocs-pub.chd.lu/docs/Dossiers_parlementaires/8775/20260622_Depot.pdf" rel="noopener">texte déposé et texte coordonné de l'article 139quater</a></p></div>
  </div>
</section>

<script src="/calc.js"></script>
<script>
(function(){
  var $=function(i){return document.getElementById(i)};
  var f=function(n){return n.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/\\u202f/g,"\\u00a0")+"\\u00a0€"};
  var tr=function(l,m,y,s){return "<tr><td>"+l+(s?"<small>"+s+"</small>":"")+"</td><td>"+m+"</td><td>"+y+"</td></tr>"};
  function upd(){
    var p=$("kSt").value==="p", g=Math.max(0,+$("kG").value||0), res=$("kRes").value, iso=$("kFam").value==="1";
    var y=g*12, base=p?DC.cipAnnual(y):DC.cisAnnual(y), co2=p?DC.cico2PensionAnnual(y):DC.cico2Annual(y);
    var cissm=p?0:DC.cissmMonthly(g), cic=DC.cicMonthly(g), h="", tot=base/12+co2/12+cissm+cic, note="";
    var z=function(v,d){return v>0?f(v):"—"};
    h+=tr(p?"Crédit d'impôt pensionné (CIP)":"Crédit d'impôt salarié (CIS)", z(base/12), z(base));
    h+=tr("Crédit d'impôt CO2", z(co2/12), z(co2));
    if(!p) h+=tr("Salaire social minimum (CISSM)", cissm>0?f(cissm):"—", cissm>0?f(cissm*12):"—", cissm>0?null:"entre 1\\u00a0800 et 3\\u00a0600\\u00a0€ brut");
    h+=tr("Conjoncture (CIC)", cic>0?f(cic):"—", cic>0?f(cic*7):"—", cic>0?"juin à décembre ; juin-octobre versés en une fois : "+f(cic*5):"à partir de 1\\u00a0125\\u00a0€ brut");
    if(iso){
      var R=null, cim=null;
      if(!p) R=DC.payslip(g,"1a",0,{}).annualR; else if(y<=60000) R=y;
      if(R!==null) cim=DC.cimAnnual(R);
      var lab="Monoparental (CIM)";
      if(res==="R"){ if(cim!==null){ h+=tr(lab, f(cim/12), f(cim), "si inscrit sur la fiche, sinon par la déclaration"); tot+=cim/12; } else h+=tr(lab, "—", "750 à ${f0(cimFull)}\\u00a0€", "selon le revenu imposable"); }
      else h+=tr(lab, "pas sur la fiche", cim!==null?f(cim):"750 à ${f0(cimFull)}\\u00a0€", "par la déclaration, si vous êtes assimilé");
    }
    h+='<tr class="total"><td><strong>Total versé chaque mois</strong></td><td><strong>'+f(tot)+'</strong></td><td></td></tr>';
    $("kOut").innerHTML=h;
    note = y>=80000 ? "À partir de 80\\u00a0000\\u00a0€ brut par an, il n'y a plus de "+(p?"CIP":"CIS")+" ni de CI-CO2." : (p ? "Le CISSM est réservé aux salariés." : "Calcul sur un salaire régulier : le CIS et le CI-CO2 sont régularisés sur le brut réel de l'année.");
    $("kNote").textContent=note;
  }
  ["kSt","kG","kRes","kFam"].forEach(function(i){$(i).addEventListener("input",upd);$(i).addEventListener("change",upd)}); upd();
})();
</script>
` + FOOT;
}

/* ------------------------------------------------------------------ métiers : salaires et recrutement */
/* STATEC, Regards n° 09/2024 (enquête sur la structure des salaires 2022), salaire annuel brut moyen ETP */
const ISCO = [
  ["Directeurs, cadres de direction et gérants", "directeur général, financier, RH, commercial, de production", 158242],
  ["Professions intellectuelles et scientifiques", "ingénieur, développeur, analyste financier, juriste, médecin, infirmier, enseignant", 97772],
  ["Professions intermédiaires", "technicien, agent financier, assistant comptable, commercial technique", 77479],
  ["Employés de type administratif", "secrétaire, employé de banque ou de bureau, agent de saisie", 62498],
  ["Services aux particuliers, commerce et vente", "vendeur, cuisinier, serveur, aide-soignant, agent de sécurité", 49570],
  ["Métiers qualifiés de l'industrie et de l'artisanat", "électricien, mécanicien, maçon, couvreur, carrossier", 48924],
  ["Conducteurs de machines, ouvriers de l'assemblage", "chauffeur routier, conducteur de machines, opérateur", 46555],
  ["Professions élémentaires", "manœuvre, nettoyeur, aide de cuisine, aide ménagère, éboueur", 40143],
];
/* même source, par secteur : [secteur, moyenne, médiane] */
const NACE = [
  ["Activités financières et d'assurance", 113018, 93843], ["Enseignement", 111362, 108929],
  ["Activités spécialisées, scientifiques et techniques", 105145, 71118], ["Administration publique", 100458, 92707],
  ["Information et communication", 79881, 72157], ["Santé et action sociale", 77695, 72918],
  ["Autres services", 67831, 56807], ["Transport et entreposage", 66401, 50436], ["Industrie", 60226, 50784],
  ["Commerce", 52468, 40519], ["Construction", 49587, 43178],
  ["Services administratifs et de soutien, immobilier", 48679, 38934], ["Horeca", 40461, 34589],
];
/* ADEM, présentation du 20 octobre 2026 : offres janvier-septembre 2026 et offres sans candidat assigné */
const HIRING = [
  ["M1805", "Études et développement informatique", 480, 219, "développeur, analyste-programmeur, testeur, BI"],
  ["M1203", "Comptabilité", 404, 63, "comptable, aide-comptable"],
  ["K1202", "Éducation de jeunes enfants", 336, 205, "éducateur de jeunes enfants, responsable de crèche"],
  ["J1506", "Soins infirmiers généralistes", 293, 150, "infirmier hospitalier, à domicile, en gériatrie"],
  ["K1207", "Intervention socioéducative", 273, 121, "éducateur spécialisé"],
  ["M1802", "Expertise et support en systèmes d'information", 269, 118, "architecte cloud, sécurité informatique"],
  ["M1402", "Conseil en organisation et management d'entreprise", 240, 64, "consultant en organisation, en management"],
  ["H1206", "Ingénierie études, recherche et développement industriel", 188, 100, "ingénieur R&D, chef de projet industriel"],
  ["K1903", "Défense et conseil juridique", 185, 93, "juriste, fiscaliste, avocat"],
  ["J1501", "Soins d'hygiène et de confort du patient", 149, 94, "aide-soignant"],
  ["K1302", "Assistance auprès d'adultes", 141, 61, "auxiliaire de vie, aide à domicile"],
];
/* ADEM, liste des métiers très en pénurie 2026 (Mémorial B n° 1490 du 27 mars 2026) ; postes vacants : STATEC, moyenne par mois en 2025 */
const SHORT = [
  ["M1202", "Audit et contrôle comptables et financiers", "auditeur interne, expert-comptable, réviseur", 260],
  ["M1805", "Études et développement informatique", "développeur, analyste-programmeur, testeur, BI", 223],
  ["K1903", "Défense et conseil juridique", "juriste, fiscaliste, avocat", 182],
  ["C1202", "Analyse de crédits et risques bancaires", "analyste crédit, analyste KYC", 164],
  ["M1802", "Expertise et support en systèmes d'information", "architecte cloud, sécurité informatique", 154],
  ["M1201", "Analyse et ingénierie financière", "analyste financier, risk manager", 124],
  ["C1301", "Front office marchés financiers", "gestionnaire d'OPCVM, négociateur", 106],
  ["J1506", "Soins infirmiers généralistes", "infirmier hospitalier, à domicile, en gériatrie", 86],
  ["K1202", "Éducation de jeunes enfants", "éducateur de jeunes enfants", 83],
  ["H1206", "Ingénierie études, recherche et développement industriel", "ingénieur R&D, chef de projet industriel", 82],
  ["K1207", "Intervention socioéducative", "éducateur spécialisé", 76],
  ["J1501", "Soins d'hygiène et de confort du patient", "aide-soignant", 69],
  ["C1206", "Gestion de clientèle bancaire", "chargé de clientèle bancaire", 61],
  ["M1801", "Administration de systèmes d'information", "administrateur système, réseau, bases de données", 43],
  ["I1304", "Installation et maintenance d'équipements industriels", "électromécanicien, technicien de maintenance", 39],
  ["F1610", "Pose et restauration de couvertures", "couvreur, zingueur, monteur photovoltaïque", 37],
  ["H1502", "Management et ingénierie qualité industrielle", "responsable qualité, QSE", 24],
  ["I1310", "Maintenance mécanique industrielle", "mécanicien d'entretien industriel", 24],
  ["I1606", "Réparation de carrosserie", "carrossier, peintre en carrosserie", 20],
  ["K1201", "Action sociale", "assistant social", 13],
];

function jobsPage() {
  const url = "/metiers-luxembourg";
  const top = ISCO[0], low = ISCO[ISCO.length - 1];
  const title = "Métiers les mieux payés au Luxembourg en 2026 : salaire par profession et secteur";
  const desc = `Quels métiers paient le plus au Luxembourg ? Salaire moyen brut par profession et par secteur (STATEC), avec le net en 2026 pour un frontalier. Directeurs 158 242 € par an, finance 113 018 €, horeca 40 461 €.`;
  const q = [
    ["Quel est le métier le mieux payé au Luxembourg ?", `Les directeurs, cadres de direction et gérants : ${f0(top[2])} € brut par an en moyenne en équivalent temps plein, primes comprises, selon l'enquête du STATEC sur 2022. Viennent ensuite les professions intellectuelles et scientifiques (ingénieurs, informaticiens, juristes, médecins...) avec ${f0(ISCO[1][2])} €. Par secteur, la finance paie le plus en moyenne (113 018 €), l'enseignement le plus en médiane (108 929 €).`],
    ["Les métiers qui recrutent sont-ils bien payés ?", "Souvent, oui. Contrairement à d'autres pays, les métiers déclarés très en pénurie au Luxembourg se situent plutôt en haut de l'échelle des salaires, selon le STATEC : audit, finance, informatique, droit. Les soins et l'éducation figurent aussi dans la liste. Le détail est sur la page des métiers qui recrutent."],
    ["Quel est le salaire moyen au Luxembourg ?", "75 919 € brut par an pour un temps plein en 2022, primes, heures supplémentaires et 13ᵉ mois compris, selon le STATEC. Le salaire médian est de 58 126 € : la moitié des salariés gagne moins. Les salaires ont depuis été relevés par l'indexation."],
    ["Un frontalier gagne-t-il moins qu'un résident au Luxembourg ?", "En moyenne oui : 65 487 € brut par an pour un frontalier en 2022, contre 92 093 € pour un résident de nationalité luxembourgeoise et 78 747 € pour un résident étranger (STATEC). À poste et salaire égaux, les cotisations sont les mêmes ; seule la classe d'impôt peut changer le net."],
  ];
  const netCell = (yr) => { const g = Math.round(yr / 12 * 100) / 100; return cell(g, 1, 0, D.payslip(g, 1, 0, {}).net); };
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Les métiers les mieux payés au Luxembourg", url), crumbs([["brutnet.lu", "/"], ["Métiers les mieux payés", url]]), faq(q)] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Métiers · salaires · Luxembourg · mis à jour le 11 novembre 2026</p>
    <h1 style="margin-top:18px">Les métiers qui paient le plus <mark>au Luxembourg</mark>.</h1>
    <p class="lede">Un directeur gagne en moyenne <strong>${f0(top[2])} € brut par an</strong>, près de quatre fois plus qu'un salarié d'une profession élémentaire (${f0(low[2])} €). Et au Luxembourg, les métiers qui manquent de candidats sont plutôt en haut de l'échelle : finance, audit, informatique, droit, mais aussi soins et éducation.</p>
  </div>
</section>

<section class="prose" id="professions">
  <div class="wrap">
    <div>
      <p class="eyebrow">Salaires par profession</p>
      <h2 style="margin-top:12px">Les professions les mieux payées</h2>
      <p class="intro">Salaire annuel brut moyen d'un temps plein, primes, heures supplémentaires et 13ᵉ mois compris. Enquête du STATEC sur l'année 2022, la plus récente ; les salaires ont depuis été indexés. Le net est celui que donnerait en 2026 un brut mensuel égal au douzième, en classe 1.</p>
    </div>
    <div>
      <div class="tscroll"><table class="ptable ex num">
        <thead><tr><th>Profession</th><th>Brut / an</th><th>Brut / mois</th><th>Net classe 1</th></tr></thead>
        <tbody>
${ISCO.map(([n, ex, yr]) => `          <tr><td>${n}<small>${ex}</small></td><td>${f0(yr)} €</td><td>${f2(Math.round(yr / 12 * 100) / 100)} €</td>${netCell(yr)}</tr>`).join("\n")}
          <tr class="total"><td>Ensemble des salariés<small>médiane : 58 126 € brut par an</small></td><td>75 919 €</td><td>${f2(Math.round(75919 / 12 * 100) / 100)} €</td>${netCell(75919)}</tr>
        </tbody>
      </table></div>
      <p class="note">Brut mensuel = brut annuel ÷ 12 : il inclut donc les primes et le 13ᵉ mois répartis sur l'année. Net 2026 en classe 1 (célibataire, ou frontalier marié sans taux global), sans frais de déplacement. Pour votre propre salaire : <a href="/">le simulateur brut → net</a>.</p>
    </div>
  </div>
</section>

<section class="prose" id="secteurs">
  <div class="wrap">
    <div>
      <p class="eyebrow">Salaires par secteur</p>
      <h2 style="margin-top:12px">La finance en tête, l'horeca en bas</h2>
      <p class="intro">Moyenne et médiane du salaire annuel brut d'un temps plein en 2022. La médiane, que la moitié des salariés n'atteint pas, est moins tirée vers le haut par les très hauts salaires.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Secteur</th><th>Moyenne / an</th><th>Médiane / an</th></tr></thead>
        <tbody>
${NACE.map(([n, m, md]) => `          <tr><td>${n}</td><td>${f0(m)} €</td><td>${f0(md)} €</td></tr>`).join("\n")}
          <tr class="total"><td>Ensemble de l'économie</td><td>75 919 €</td><td>58 126 €</td></tr>
        </tbody>
      </table>
      <p class="note">En finance, 81 % des salariés ont un diplôme universitaire, contre 11 % dans l'horeca : une grande partie de l'écart vient des profils. Les grandes entreprises paient aussi davantage, même à type de profession égal : 92 286 € en moyenne au-delà de 1 000 salariés, 66 120 € entre 10 et 49.</p>
    </div>
  </div>
</section>

<section class="prose" id="recrutent">
  <div class="wrap">
    <div>
      <p class="eyebrow">Recrutement</p>
      <h2 style="margin-top:12px">Les métiers qui recrutent sont souvent bien payés</h2>
      <p class="intro">Au Luxembourg, les métiers qui manquent de candidats se situent plutôt en haut de l'échelle des salaires, selon le STATEC.</p>
    </div>
    <div class="txt">
      <p>De janvier à septembre 2026, l'ADEM a recensé le plus d'offres en développement informatique (480), en comptabilité (404), en éducation de jeunes enfants (336) et en soins infirmiers (293). Vingt métiers sont officiellement « très en pénurie » en 2026, de l'audit aux aides-soignants.</p>
      <p><a href="/metiers-qui-recrutent-luxembourg"><strong>Voir les métiers qui recrutent le plus et la liste des métiers en pénurie →</strong></a></p>
    </div>
  </div>
</section>

<section class="prose" id="frontaliers">
  <div class="wrap">
    <div>
      <p class="eyebrow">Frontaliers</p>
      <h2 style="margin-top:12px">Frontalier ou résident : les salaires moyens</h2>
      <p class="intro">Salaire annuel brut moyen d'un temps plein en 2022, selon la résidence.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <tbody>
          <tr><td>Frontaliers</td><td>65 487 €</td></tr>
          <tr><td>Résidents de nationalité étrangère</td><td>78 747 €</td></tr>
          <tr><td>Résidents de nationalité luxembourgeoise</td><td>92 093 €</td></tr>
        </tbody>
      </table>
      <p class="note">À salaire égal, un frontalier paie les mêmes cotisations qu'un résident ; seule la <a href="/classe-impot-luxembourg">classe d'impôt</a> peut changer le net. Pour un salaire précis, voir le <a href="/tableau-salaire-brut-net-luxembourg">tableau brut → net 2026</a>.</p>
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
    <div class="txt"><p class="note"><a href="https://statistiques.public.lu/dam-assets/catalogue-publications/regards/2024/regards-09-24.pdf" rel="noopener">STATEC, Regards n° 09/2024, salaires 2022</a> · <a href="https://statistiques.public.lu/dam-assets/catalogue-publications/note-conjoncture/2026/ndc-1-26/ndc-1-26-7-2-etude.pdf" rel="noopener">STATEC, Note de conjoncture 1-2026, emploi et salaires dans les métiers en pénurie</a> · <a href="https://adem.public.lu/dam-assets/fr/publications/adem/metiers-penurie.pdf" rel="noopener">ADEM, liste des métiers très en pénurie 2026</a> (Mémorial B n° 1490 du 27 mars 2026) · <a href="https://adem.public.lu/dam-assets/fr/publications/adem/2026/cp-cc-2026-09/cp-cc-2026-09-fr.pdf" rel="noopener">ADEM, chiffres de septembre 2026</a> · <a href="https://gouvernement.lu/dam-assets/images-documents/actualites/2026/10-octobre/20-reunion-tripartite/docs/20261020-runion-comit-de-suivi-tripartite-adem-vf.pdf" rel="noopener">ADEM, présentation du 20 octobre 2026</a></p></div>
  </div>
</section>
` + FOOT;
}

/* STATEC, Note de conjoncture 1-2026 (étude 7.2), graphique B : demandeurs d'emploi par offre en 2025 (familles ROME) */
const RATIO = [
  ["J15", "Soins paramédicaux (infirmiers, aides-soignants)", 0.5], ["H29", "Mécanique, travail des métaux et outillage", 0.7],
  ["N44", "Personnel sédentaire du transport ferroviaire", 0.8], ["I13", "Équipements de production et équipements collectifs", 0.8],
  ["K12", "Action sociale et socio-éducative", 1.1], ["H12", "Conception, recherche, études et développement", 1.2],
  ["K19", "Droit", 1.3], ["M12", "Comptabilité et gestion", 1.3], ["C12", "Banque", 1.4], ["C13", "Finance", 1.4],
  ["M18", "Systèmes d'information et télécommunication", 1.5], ["I16", "Véhicules, engins, aéronefs", 1.5],
  ["H15", "Qualité et analyses industrielles", 1.7], ["F16", "Second œuvre du bâtiment", 2.8],
];
/* même étude, tableau B : part des sous-branches dans les offres de métiers très en pénurie, 2022-2025 */
const BRANCH = [
  ["Activités comptables (audit, expertise comptable)", 37.0], ["Banques (intermédiation monétaire)", 7.7],
  ["Programmation, conseil et activités informatiques", 6.2], ["Gestion de fonds", 4.2], ["Conseil de gestion", 3.1],
  ["Agences de travail temporaire", 2.3], ["Sièges sociaux", 2.2], ["Action sociale sans hébergement", 2.2],
];

function recruitPage() {
  const url = "/metiers-qui-recrutent-luxembourg";
  const title = "Quels métiers recrutent le plus au Luxembourg en 2026 ? Offres et pénuries";
  const desc = "Les métiers qui recrutent le plus au Luxembourg en 2026 d'après l'ADEM : informatique, comptabilité, éducation, soins infirmiers. Les 20 métiers en pénurie, les secteurs qui embauchent et où postuler quand on est frontalier.";
  const q = [
    ["Quels métiers recrutent le plus au Luxembourg en 2026 ?", "D'après l'ADEM, de janvier à septembre 2026 : le développement informatique (480 offres), la comptabilité (404), l'éducation de jeunes enfants (336), les soins infirmiers (293), l'intervention socioéducative (273) et l'expertise en systèmes d'information (269). Le secteur public, premier employeur du pays, recrute à part sur govjobs.public.lu."],
    ["Quels sont les métiers en pénurie au Luxembourg en 2026 ?", "La liste officielle de l'ADEM compte 20 métiers : audit et expertise comptable, développement et systèmes informatiques, juristes et fiscalistes, banque (crédit, KYC, clientèle, marchés), analyse financière, infirmiers et aides-soignants, éducateurs, assistants sociaux, ingénieurs R&D et qualité, maintenance industrielle, couvreurs et carrossiers."],
    ["Quel secteur recrute le plus au Luxembourg ?", "Les services aux entreprises, et d'abord l'audit et l'expertise comptable : entre 2022 et 2025, les activités comptables ont concentré 37 % des offres des métiers très en pénurie, alors qu'elles ne pèsent que 3,7 % de l'emploi salarié. Suivent les banques, l'informatique, la gestion de fonds, la santé et l'action sociale."],
    ["Dans quels métiers trouve-t-on le plus facilement un emploi au Luxembourg ?", "Là où il y a le moins de candidats par offre. En 2025, les soins paramédicaux comptaient un demandeur d'emploi pour deux offres, la mécanique et le travail des métaux 0,7 demandeur par offre, la maintenance d'équipements industriels 0,8, l'action sociale 1,1."],
    ["Un frontalier peut-il s'inscrire à l'ADEM pour chercher un emploi ?", "Oui. Un non-résident peut s'inscrire comme demandeur d'emploi à l'ADEM, même s'il n'y touche pas d'indemnités : fin septembre 2026, 1 917 non-résidents y étaient inscrits de leur propre initiative. En règle générale, le chômage d'un frontalier est versé par son pays de résidence."],
    ["Combien gagne-t-on dans les métiers qui recrutent au Luxembourg ?", "Les métiers en pénurie se situent plutôt en haut de l'échelle des salaires, selon le STATEC. En 2022, une profession intellectuelle et scientifique (informaticien, juriste, ingénieur, infirmier...) gagnait en moyenne 97 772 € brut par an, primes comprises."],
  ];
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Quels métiers recrutent le plus au Luxembourg en 2026", url), crumbs([["brutnet.lu", "/"], ["Métiers qui recrutent", url]]), faq(q),
    { "@type": "ItemList", name: "Métiers avec le plus d'offres d'emploi à l'ADEM, janvier-septembre 2026", itemListElement: HIRING.map(([c, n], i) => ({ "@type": "ListItem", position: i + 1, name: n })) }] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Emploi · Luxembourg · chiffres de l'ADEM et du STATEC · mis à jour le 11 novembre 2026</p>
    <h1 style="margin-top:18px">Quels métiers recrutent le plus <mark>au Luxembourg en 2026</mark> ?</h1>
    <p class="lede">De janvier à septembre 2026, le <strong>développement informatique</strong> arrive en tête des offres d'emploi de l'ADEM (480), devant la <strong>comptabilité</strong> (404), l'<strong>éducation de jeunes enfants</strong> (336) et les <strong>soins infirmiers</strong> (293). Vingt métiers sont officiellement en pénurie, et la plupart paient bien.</p>
    <div class="callout" style="max-width:68ch;margin-top:26px">
      <strong>Septembre 2026 :</strong> les employeurs ont déclaré <strong>3 300 postes</strong> à l'ADEM et <strong>6 632 offres</strong> étaient ouvertes en fin de mois. Ces chiffres ne comptent pas l'État et les communes, qui recrutent sur govjobs.public.lu.
    </div>
  </div>
</section>

<section class="prose" id="top">
  <div class="wrap">
    <div>
      <p class="eyebrow">Classement 2026</p>
      <h2 style="margin-top:12px">Les métiers avec le plus d'offres d'emploi</h2>
      <p class="intro">Offres de l'ADEM sur janvier-septembre 2026 et, parmi les offres non publiées, celles pour lesquelles l'ADEM n'a envoyé aucun candidat à l'employeur.</p>
    </div>
    <div>
      <div class="tscroll"><table class="ptable ex num">
        <thead><tr><th>Métier</th><th>Offres</th><th>Sans candidat</th></tr></thead>
        <tbody>
${HIRING.map(([c, n, o, s, ex], i) => `          <tr><td>${i + 1}. ${n}<small>${ex}</small></td><td>${o}</td><td>${s}</td></tr>`).join("\n")}
        </tbody>
      </table></div>
      <p class="note">Intitulés de l'ADEM, qui classe les métiers selon le répertoire ROME, le même que France Travail. En septembre 2026, l'informatique (262 postes) et la comptabilité-gestion (254) restaient les deux familles où les employeurs déclaraient le plus de postes. D'autres métiers ont beaucoup d'offres sans être en pénurie, car les candidats y sont nombreux : cuisine, secrétariat, service en restauration.</p>
    </div>
  </div>
</section>

<section class="prose" id="hausse">
  <div class="wrap">
    <div>
      <p class="eyebrow">Tendance</p>
      <h2 style="margin-top:12px">Les métiers où les offres augmentent</h2>
      <p class="intro">Hausse du nombre d'offres ouvertes fin septembre 2026 par rapport à fin septembre 2025, selon l'ADEM.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Famille de métiers</th><th>Offres en plus</th><th>Hausse</th></tr></thead>
        <tbody>
          <tr><td>Soins paramédicaux<small>infirmiers, aides-soignants</small></td><td>+ 121</td><td>+ 65 %</td></tr>
          <tr><td>Action sociale, socio-éducative et socio-culturelle<small>éducateurs, assistants sociaux</small></td><td>+ 104</td><td>+ 62 %</td></tr>
          <tr><td>Informatique<small>systèmes d'information et télécommunication</small></td><td>+ 69</td><td>+ 16 %</td></tr>
          <tr><td>Commerce alimentaire et métiers de bouche<small>boulangers, bouchers, vendeurs en alimentation</small></td><td>+ 58</td><td>+ 100 %</td></tr>
        </tbody>
      </table>
      <p class="note">L'informatique attire aussi plus de candidats : +108 demandeurs d'emploi résidents en un an (+18 %). La banque en compte 82 de plus (+27 %). Au total, l'ADEM comptait 20 269 demandeurs d'emploi résidents fin septembre 2026, pour un taux de chômage de 6,5 %.</p>
    </div>
  </div>
</section>

<section class="prose" id="candidats">
  <div class="wrap">
    <div>
      <p class="eyebrow">Peu de concurrence</p>
      <h2 style="margin-top:12px">Les métiers où il y a le moins de candidats</h2>
      <p class="intro">Nombre de demandeurs d'emploi inscrits à l'ADEM pour une offre, en moyenne en 2025. Sous 1, il y a plus d'offres que de candidats.</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Famille de métiers</th><th>Demandeurs par offre</th></tr></thead>
        <tbody>
${RATIO.map(([c, n, r]) => `          <tr><td>${n}</td><td>${String(r).replace(".", ",")}</td></tr>`).join("\n")}
        </tbody>
      </table>
      <p class="note">Familles qui contiennent au moins un métier en pénurie. La conduite de transport, la maintenance informatique et la conduite d'engins logistiques ont des ratios encore plus bas, mais trop peu d'offres pour être classées en pénurie.</p>
    </div>
  </div>
</section>

<section class="prose" id="penurie">
  <div class="wrap">
    <div>
      <p class="eyebrow">Liste officielle</p>
      <h2 style="margin-top:12px">Les 20 métiers très en pénurie en 2026</h2>
      <p class="intro">Liste de l'ADEM établie sur l'année 2025 : au moins 7 offres par mois en moyenne, trop peu de demandeurs d'emploi et une part élevée d'offres sans candidat. Elle comptait 29 métiers en 2023, 24 en 2024 et 22 en 2025.</p>
    </div>
    <div>
      <div class="tscroll"><table class="ptable ex num">
        <thead><tr><th>Métier</th><th>Postes vacants / mois en 2025</th></tr></thead>
        <tbody>
${SHORT.map(([c, n, ex, v]) => `          <tr><td>${n}<small>${ex}</small></td><td>${v}</td></tr>`).join("\n")}
        </tbody>
      </table></div>
      <div class="txt" style="margin-top:18px">
        <p>Contrairement à d'autres pays, ces métiers paient plutôt bien : selon le STATEC, la grande majorité des branches qui les recherchent dépasse largement le salaire horaire moyen. Voir <a href="/metiers-luxembourg">les salaires par profession</a>.</p>
        <p>Pour l'employeur, la liste simplifie l'embauche de candidats hors Union européenne. Un frontalier citoyen de l'Union européenne n'a, lui, besoin d'aucune autorisation de travail.</p>
      </div>
    </div>
  </div>
</section>

<section class="prose" id="secteurs">
  <div class="wrap">
    <div>
      <p class="eyebrow">Secteurs</p>
      <h2 style="margin-top:12px">Les secteurs qui cherchent ces profils</h2>
      <p class="intro">Part de chaque branche dans les offres des métiers très en pénurie, de 2022 à 2025 (STATEC, d'après les données de l'ADEM).</p>
    </div>
    <div>
      <table class="ptable ex num">
        <thead><tr><th>Branche</th><th>Part des offres</th></tr></thead>
        <tbody>
${BRANCH.map(([n, v]) => `          <tr><td>${n}</td><td>${String(v.toFixed(1)).replace(".", ",")} %</td></tr>`).join("\n")}
        </tbody>
      </table>
      <p class="note">Les activités comptables pèsent 3,7 % de l'emploi salarié mais 37 % de ces offres. Leurs principaux employeurs sont les « Big Four » : en 2025, PwC comptait 3 610 salariés au Luxembourg, Deloitte 2 580, EY 2 110 et KPMG 1 960. Voir aussi <a href="/entreprises-qui-recrutent-luxembourg">les entreprises qui recrutent le plus</a>.</p>
    </div>
  </div>
</section>

<section class="prose" id="postuler">
  <div class="wrap">
    <div>
      <p class="eyebrow">Frontaliers</p>
      <h2 style="margin-top:12px">Où postuler quand on est frontalier</h2>
    </div>
    <div class="txt">
      <ul>
        <li><strong>ADEM</strong> : un non-résident peut s'y inscrire comme demandeur d'emploi, même sans y toucher d'indemnités. Fin septembre 2026, 1 917 non-résidents s'y étaient inscrits de leur propre initiative.</li>
        <li><strong>govjobs.public.lu</strong> : les postes de l'État et des communes, qui ne passent pas par l'ADEM.</li>
        <li><strong>Agences de placement et d'intérim</strong> : selon le STATEC, les entreprises qui cherchent des profils rares y font probablement aussi appel ; l'intérim a progressé dans l'informatique et reste élevé dans la santé.</li>
      </ul>
      <p>Avant de négocier, calculez le net d'une offre : <a href="/">simulateur brut → net</a>, <a href="/tableau-salaire-brut-net-luxembourg">tableau 2026</a>, et pour une voiture de fonction, <a href="/voiture-de-societe-luxembourg">l'avantage en nature</a>.</p>
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
    <div class="txt"><p class="note"><a href="https://gouvernement.lu/dam-assets/images-documents/actualites/2026/10-octobre/20-reunion-tripartite/docs/20261020-runion-comit-de-suivi-tripartite-adem-vf.pdf" rel="noopener">ADEM, présentation du 20 octobre 2026</a> · <a href="https://adem.public.lu/dam-assets/fr/publications/adem/2026/cp-cc-2026-09/cp-cc-2026-09-fr.pdf" rel="noopener">ADEM, chiffres de septembre 2026</a> · <a href="https://adem.public.lu/dam-assets/fr/publications/adem/metiers-penurie.pdf" rel="noopener">ADEM, liste des métiers très en pénurie 2026</a> (Mémorial B n° 1490 du 27 mars 2026) · <a href="https://statistiques.public.lu/dam-assets/catalogue-publications/note-conjoncture/2026/ndc-1-26/ndc-1-26-7-2-etude.pdf" rel="noopener">STATEC, Note de conjoncture 1-2026, emploi et salaires dans les métiers en pénurie</a> · <a href="https://statistiques.public.lu/dam-assets/catalogue-publications/regards/2024/regards-09-24.pdf" rel="noopener">STATEC, salaires 2022</a></p></div>
  </div>
</section>
` + FOOT;
}

/* STATEC, Les principaux employeurs au Luxembourg (situation au 1er janvier 2026, édition juillet 2026, et 1er janvier 2025).
   Effectifs arrondis à la dizaine, déclarés par les entreprises ; chaque ligne a été relue dans les deux PDF. */
const EMPLOYERS = [
  ["Groupe Dussmann Luxembourg", "Nettoyage et services aux bâtiments", 5340], ["Groupe CFL", "Transport ferroviaire", 5320],
  ["Amazon", "Siège européen et services", 4550], ["Groupe POST Luxembourg", "Poste et télécommunications", 4480],
  ["Groupe Cactus", "Commerce de détail (supermarchés)", 4340], ["Groupe BNP Paribas au Luxembourg", "Banque", 3880],
  ["Groupe ArcelorMittal", "Sidérurgie", 3570], ["Goodyear Dunlop Tires Operations", "Fabrication de pneumatiques", 3460],
  ["Groupe PwC Luxembourg", "Audit et conseil", 3330], ["Groupe Cargolux", "Fret aérien", 3310],
  ["Université du Luxembourg", "Enseignement supérieur et recherche", 3080], ["Groupe Crédit Agricole", "Banque", 3030],
  ["Centre Hospitalier de Luxembourg", "Hôpital", 3020], ["Servior", "Maisons de soins et de retraite", 2590],
  ["elisabeth", "Hébergement social et soins", 2580], ["Fondation Hôpitaux Robert Schuman", "Hôpitaux", 2520],
  ["Compass Group Luxembourg", "Restauration collective", 2510], ["Voyages Emile Weber", "Transport en bus et voyages", 2460],
  ["Groupe Deloitte Luxembourg", "Audit et conseil", 2450], ["Sodexo Luxembourg", "Restauration collective", 2440],
  ["Centre Hospitalier Emile Mayrisch", "Hôpital", 2180], ["Groupe EY Luxembourg", "Audit et conseil", 2170],
  ["Stëftung Hëllef Doheem", "Soins à domicile", 2130], ["Luxair", "Transport aérien de passagers", 2010],
  ["Spuerkeess (BCEE)", "Banque", 1980],
];
const GAINERS = [
  ["Groupe Dussmann Luxembourg", "Nettoyage et services aux bâtiments", 4880, 5340], ["State Street Bank International (succursale)", "Banque", 540, 930],
  ["Arcus", "Aide à l'enfance et à la famille", 1510, 1750], ["elisabeth", "Hébergement social et soins", 2360, 2580],
  ["Compass Group Luxembourg", "Restauration collective", 2290, 2510], ["Groupe CFL", "Transport ferroviaire", 5110, 5320],
  ["Université du Luxembourg", "Enseignement supérieur et recherche", 2870, 3080], ["ISS Facility Services", "Nettoyage et services aux bâtiments", 540, 740],
  ["Amazon", "Siège européen et services", 4370, 4550], ["Arhs Developments", "Informatique", 360, 540],
  ["Voyages Emile Weber", "Transport en bus et voyages", 2310, 2460], ["Servior", "Maisons de soins et de retraite", 2460, 2590],
  ["Luxair", "Transport aérien de passagers", 1880, 2010], ["A.B.S.C.", "Nettoyage", 670, 800],
  ["Centre Hospitalier de Luxembourg", "Hôpital", 2900, 3020], ["Groupe Cargolux", "Fret aérien", 3200, 3310],
];

function companiesPage() {
  const url = "/entreprises-qui-recrutent-luxembourg";
  const title = "Entreprises qui recrutent le plus au Luxembourg en 2026 : les plus gros employeurs";
  const desc = "Les entreprises qui embauchent le plus au Luxembourg : les 25 plus gros employeurs privés au 1er janvier 2026 et celles dont l'effectif a le plus augmenté en un an (STATEC). Nettoyage, soins, transport, banque, audit.";
  const q = [
    ["Quelle entreprise recrute le plus au Luxembourg ?", "Sur un an, c'est le groupe Dussmann (nettoyage et services aux bâtiments) dont l'effectif a le plus augmenté : 460 personnes de plus entre le 1er janvier 2025 et le 1er janvier 2026, à 5 340 salariés. Suivent State Street (+390), Arcus (+240), elisabeth et Compass Group (+220 chacun), les CFL et l'Université du Luxembourg (+210 chacun), d'après la liste des principaux employeurs du STATEC."],
    ["Quel est le plus gros employeur du Luxembourg ?", "L'État et les communes, qui ne figurent pas dans la liste du STATEC. Parmi les entreprises, le groupe Dussmann (5 340 salariés au 1er janvier 2026) devance de peu les CFL (5 320), puis Amazon (4 550), le groupe POST (4 480) et le groupe Cactus (4 340)."],
    ["Quelles banques emploient le plus au Luxembourg ?", "Au 1er janvier 2026 : le groupe BNP Paribas (3 880 salariés), le groupe Crédit Agricole (3 030) et la Spuerkeess (1 980). Parmi les banques présentes dans les deux éditions de la liste, State Street a le plus augmenté son effectif en 2025, de 540 à 930 salariés."],
    ["Les Big Four recrutent-ils au Luxembourg ?", "Ils restent parmi les plus gros employeurs (PwC 3 330, Deloitte 2 450, EY 2 170, KPMG 1 770 au 1er janvier 2026), mais PwC, Deloitte et KPMG ont réduit leurs effectifs en 2025, alors que l'audit est le métier le plus en pénurie selon l'ADEM. EY a progressé de 60 personnes."],
    ["Où trouver les offres d'emploi du secteur public au Luxembourg ?", "Sur govjobs.public.lu : l'État et les communes recrutent sur cette plateforme et ne déclarent pas leurs postes à l'ADEM."],
  ];
  const rows = (list) => list.map(([n, a, v], i) => `          <tr><td>${i + 1}. ${n}<small>${a}</small></td><td>${f0(v)}</td></tr>`).join("\n");
  return head({ title, desc, url, jsonld: { "@context": "https://schema.org", "@graph": [article("Les entreprises qui recrutent le plus au Luxembourg en 2026", url), crumbs([["brutnet.lu", "/"], ["Entreprises qui recrutent", url]]), faq(q),
    { "@type": "ItemList", name: "Entreprises dont l'effectif a le plus augmenté au Luxembourg entre 2025 et 2026", itemListElement: GAINERS.map(([n], i) => ({ "@type": "ListItem", position: i + 1, name: n })) }] } }) + `
<section class="hero sm">
  <div class="wrap">
    <p class="eyebrow">Employeurs · Luxembourg · liste officielle du STATEC · mis à jour le 11 novembre 2026</p>
    <h1 style="margin-top:18px">Les entreprises qui recrutent le plus <mark>au Luxembourg</mark>.</h1>
    <p class="lede">Entre le 1<sup>er</sup> janvier 2025 et le 1<sup>er</sup> janvier 2026, le groupe <strong>Dussmann</strong> a gagné 460 salariés, la banque <strong>State Street</strong> 390, <strong>Arcus</strong> 240, <strong>elisabeth</strong> et <strong>Compass Group</strong> 220 chacun. Ceux qui embauchent le plus sont dans le nettoyage, les soins, le transport, la restauration collective et la banque.</p>
  </div>
</section>

<section class="prose" id="hausses">
  <div class="wrap">
    <div>
      <p class="eyebrow">Embauches nettes</p>
      <h2 style="margin-top:12px">Les entreprises dont l'effectif a le plus augmenté</h2>
      <p class="intro">Effectif au 1<sup>er</sup> janvier 2025 et au 1<sup>er</sup> janvier 2026, entreprises présentes dans les deux éditions de la liste du STATEC. La hausse est nette : embauches moins départs.</p>
    </div>
    <div>
      <div class="tscroll"><table class="ptable ex num">
        <thead><tr><th>Entreprise</th><th>2025</th><th>2026</th><th>Hausse</th></tr></thead>
        <tbody>
${GAINERS.map(([n, a, x, y], i) => `          <tr><td>${i + 1}. ${n}<small>${a}</small></td><td>${f0(x)}</td><td>${f0(y)}</td><td>+ ${f0(y - x)}</td></tr>`).join("\n")}
        </tbody>
      </table></div>
      <p class="note">Le périmètre d'un groupe peut changer d'une année à l'autre, ce qui peut jouer sur l'écart. Les entreprises absentes d'une des deux éditions, comme le groupe Crédit Agricole (3 030 salariés en 2026), ne peuvent pas être comparées.</p>
    </div>
  </div>
</section>

<section class="prose" id="employeurs">
  <div class="wrap">
    <div>
      <p class="eyebrow">Classement 2026</p>
      <h2 style="margin-top:12px">Les 25 plus gros employeurs du Luxembourg</h2>
      <p class="intro">Entreprises et groupes classés par effectif au 1<sup>er</sup> janvier 2026, hors État, communes et écoles publiques. Ces grands employeurs recrutent régulièrement, ne serait-ce que pour remplacer les départs.</p>
    </div>
    <div>
      <div class="tscroll"><table class="ptable ex num">
        <thead><tr><th>Employeur</th><th>Salariés</th></tr></thead>
        <tbody>
${rows(EMPLOYERS)}
        </tbody>
      </table></div>
      <p class="note">L'État et les communes, premier employeur du pays, recrutent sur govjobs.public.lu. La liste ne compte pas non plus les agences d'intérim.</p>
    </div>
  </div>
</section>

<section class="prose" id="secteurs">
  <div class="wrap">
    <div>
      <p class="eyebrow">Secteurs</p>
      <h2 style="margin-top:12px">Qui embauche, et pour quels métiers</h2>
    </div>
    <div class="txt">
      <h3>Nettoyage et services aux bâtiments</h3>
      <p>Dussmann (+460), ISS Facility Services (+200) et A.B.S.C. (+130) ont le plus grossi. Une part importante de leurs salariés travaille à temps partiel.</p>
      <h3>Soins et action sociale</h3>
      <p>elisabeth, Arcus, Servior, le Centre Hospitalier de Luxembourg, les Hôpitaux Robert Schuman : infirmiers, aides-soignants et éducateurs sont dans la <a href="/metiers-qui-recrutent-luxembourg#penurie">liste officielle des métiers en pénurie</a>.</p>
      <h3>Transport</h3>
      <p>Les CFL (+210), Voyages Emile Weber (+150), Luxair (+130) et Cargolux (+110) ont tous augmenté leurs effectifs en 2025.</p>
      <h3>Banque, audit et informatique</h3>
      <p>State Street est passée de 540 à 930 salariés et Arhs Developments, société informatique, de 360 à 540. À l'inverse, les Big Four ont réduit leurs effectifs, sauf EY (+60) : PwC −280, KPMG −190, Deloitte −130. Selon le STATEC, certains de ces cabinets ont ouvert des centres à l'étranger qui travaillent pour le Luxembourg, comme PwC au Portugal fin 2024. L'audit reste pourtant le métier où les offres en pénurie sont les plus nombreuses.</p>
    </div>
  </div>
</section>

<section class="prose" id="postuler">
  <div class="wrap">
    <div>
      <p class="eyebrow">Frontaliers</p>
      <h2 style="margin-top:12px">Avant d'accepter une offre</h2>
    </div>
    <div class="txt">
      <p>Comparez le net, pas le brut : <a href="/">simulateur brut → net</a>, <a href="/tableau-salaire-brut-net-luxembourg">tableau 2026</a>, <a href="/metiers-luxembourg">salaires moyens par profession</a>. Une voiture de fonction se paie en <a href="/voiture-de-societe-luxembourg">avantage en nature</a>, et au-delà de 34 jours de <a href="/teletravail-frontalier-luxembourg">télétravail</a>, une partie du salaire devient imposable en France.</p>
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
    <div><p class="eyebrow">Sources et méthode</p></div>
    <div class="txt"><p class="note"><a href="https://statistiques.public.lu/dam-assets/catalogue-publications/principaux-employeurs/2026/liste-des-pe-branche-2026.pdf" rel="noopener">STATEC, principaux employeurs au 1er janvier 2026</a> · <a href="https://statistiques.public.lu/dam-assets/catalogue-publications/principaux-employeurs/2025/liste-des-pe-branche-2025.pdf" rel="noopener">au 1er janvier 2025</a> · <a href="https://statistiques.public.lu/dam-assets/catalogue-publications/note-conjoncture/2026/ndc-1-26/ndc-1-26-7-2-etude.pdf" rel="noopener">STATEC, emploi et salaires dans les métiers en pénurie</a>. La liste repose sur une enquête facultative (taux de couverture de 66 %) auprès des entreprises d'au moins 90 personnes ; effectifs arrondis à la dizaine, temps partiel compris, intérimaires exclus.</p></div>
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
fs.writeFileSync(path.join(ROOT, "classe-impot-luxembourg.html"), nb(classPage()));
fs.writeFileSync(path.join(ROOT, "teletravail-frontalier-luxembourg.html"), nb(teleworkPage()));
fs.writeFileSync(path.join(ROOT, "voiture-de-societe-luxembourg.html"), nb(carPage()));
fs.writeFileSync(path.join(ROOT, "credit-impot-luxembourg.html"), nb(creditPage()));
fs.writeFileSync(path.join(ROOT, "metiers-luxembourg.html"), nb(jobsPage()));
fs.writeFileSync(path.join(ROOT, "metiers-qui-recrutent-luxembourg.html"), nb(recruitPage()));
fs.writeFileSync(path.join(ROOT, "entreprises-qui-recrutent-luxembourg.html"), nb(companiesPage()));

/* accueil : section « Guides » générée depuis la liste du menu (maillage interne) */
{
  const p = path.join(ROOT, "index.html"), src = fs.readFileSync(p, "utf8");
  const block = `<!-- guides -->
<section class="prose" id="guides">
  <div class="wrap">
    <div>
      <p class="eyebrow">Guides</p>
      <h2 style="margin-top:12px">Les guides du frontalier au Luxembourg</h2>
      <p class="intro">Impôts, crédits d'impôt, télétravail, voiture de société, salaires par métier et entreprises qui recrutent : chiffres officiels 2026.</p>
    </div>
    <div class="guides">
${GUIDE.map(([, items]) => items.map(([u, t, s]) => `      <a href="${u}"><b>${t}</b><span>${s}</span></a>`).join("\n")).join("\n")}
    </div>
  </div>
</section>
<!-- /guides -->`;
  const out = src.replace(/<!-- guides -->[\s\S]*?<!-- \/guides -->/, () => block);
  if (out === src && !src.includes('id="guides"')) throw new Error("bloc guides introuvable dans index.html");
  fs.writeFileSync(p, out);
}

/* pages écrites à la main : on remplace seulement leur bloc <nav> par le menu commun */
for (const [file, url] of [["index.html", "/"], ["impot-frontalier.html", "/impot-frontalier"], ["diagnostic.html", "/diagnostic"], ["mentions-legales.html", "/mentions-legales"]]) {
  const p = path.join(ROOT, file), src = fs.readFileSync(p, "utf8");
  const out = src.replace(/<nav class="nav"[\s\S]*?<\/nav>/, () => nav(url));
  if (out === src && !src.includes('class="dd-menu"')) throw new Error(`menu introuvable dans ${file}`);
  fs.writeFileSync(p, out);
}

const core = ["/", "/tableau-salaire-brut-net-luxembourg", "/salaire-minimum-luxembourg", "/impot-frontalier", "/remboursement-impot-luxembourg", "/classe-impot-luxembourg", "/teletravail-frontalier-luxembourg", "/voiture-de-societe-luxembourg", "/credit-impot-luxembourg", "/metiers-luxembourg", "/metiers-qui-recrutent-luxembourg", "/entreprises-qui-recrutent-luxembourg", "/diagnostic"];
const urls = [...core, ...AMOUNTS.map(slugOf)];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}
</urlset>
`);
console.log(`${AMOUNTS.length} pages salaire + tableau + salaire minimum + sitemap (${urls.length} URL)`);

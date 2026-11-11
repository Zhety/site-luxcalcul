/**
 * brutnet.lu : réception d'une demande de rappel (diagnostic).
 * Envoie deux e-mails depuis la boîte OVH info@brutnet.lu :
 *   1. le lead complet à MAIL_TO (info@brutnet.lu), « Répondre » écrit au prospect ;
 *   2. une confirmation au prospect.
 *
 * Variables d'environnement (Vercel, projet brutnet-api) :
 *   SMTP_HOST=ssl0.ovh.net  SMTP_PORT=465  SMTP_USER=info@brutnet.lu  SMTP_PASS=…
 *   MAIL_TO=info@brutnet.lu (facultatif, plusieurs adresses séparées par des virgules)
 */
const nodemailer = require("nodemailer");

const ORIGINS = ["https://brutnet.lu", "https://www.brutnet.lu"];
const SITE = "https://brutnet.lu";
const FROM_ADDR = () => process.env.SMTP_USER || "info@brutnet.lu";

const L = {
  FR: "France", BE: "Belgique", LU: "Luxembourg", SOON: "pas encore frontalier",
  couple: "en couple", single: "seul(e)",
  rent: "locataire", buy: "projet d'achat sous 24 mois", owner: "propriétaire, crédit en cours", paid: "propriétaire, crédit remboursé",
};
const lab = (v) => (v in L ? L[v] : String(v ?? ""));
const eur = (n) => (Number.isFinite(+n) ? Math.round(+n).toLocaleString("fr-FR").replace(/ | /g, " ") + " €" : "—");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clean = (s, max) => String(s ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

/* Limite simple par adresse IP (par instance) : 5 envois / 10 min. */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 600000);
  list.push(now); hits.set(ip, list);
  return list.length > 5;
}

let transport;
function mailer() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "ssl0.ovh.net", port, secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    });
  }
  return transport;
}

function layout(title, rowsHtml, introHtml, footHtml) {
  return `<!doctype html><html><body style="margin:0;background:#F1F3F7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#141821">
<div style="max-width:580px;margin:24px auto;background:#fff;border:1px solid #E1E5EE;border-radius:12px;overflow:hidden">
<div style="padding:16px 22px;font-weight:800;font-size:18px;border-bottom:1px solid #E1E5EE"><span style="display:inline-block;width:4px;height:16px;background:#6F88FF;margin-right:3px;vertical-align:-2px"></span><span style="display:inline-block;width:4px;height:16px;background:#F07A6E;margin-right:8px;vertical-align:-2px"></span>brutnet.lu</div>
<div style="padding:22px;font-size:15px;line-height:1.55">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${introHtml}
${rowsHtml ? `<table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:14px">${rowsHtml}</table>` : ""}
</div>
<div style="padding:12px 22px;border-top:1px solid #E1E5EE;font-size:12px;color:#5B6475">${footHtml}</div>
</div></body></html>`;
}
const row = (k, v) => `<tr><td style="padding:7px 10px 7px 0;color:#5B6475;border-bottom:1px solid #EEF1F6;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #EEF1F6;font-weight:600">${esc(v)}</td></tr>`;

module.exports = async (req, res) => {
  const origin = req.headers.origin || "";
  if (ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Méthode non autorisée." });
  if (!ORIGINS.includes(origin) && !/^http:\/\/localhost(:\d+)?$/.test(origin)) return res.status(403).json({ ok: false, error: "Origine refusée." });

  let d = req.body;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = null; } }
  if (!d || typeof d !== "object") return res.status(400).json({ ok: false, error: "Requête invalide." });
  /* champ piège (ancien nom « website », nouveau « hp ») : le remplissage automatique de Safari peut le remplir.
     On n'écarte donc pas la demande : le lead part quand même, marqué « [Robot ?] », sans e-mail au visiteur. */
  const bot = !!(d.website || d.hp);

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (limited(ip)) return res.status(429).json({ ok: false, error: "Trop de demandes, réessayez dans quelques minutes." });

  const name = clean(d.name, 80).replace(/https?:\/\/\S+|www\.\S+/gi, "");
  const phone = clean(d.phone, 30), email = clean(d.email, 120).toLowerCase();
  const dayLabel = clean(d.dayLabel, 60), slot = clean(d.slot, 10);
  if (!d.consent || name.length < 2 || phone.replace(/\D/g, "").length < 9 || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || !dayLabel || !/^\d{1,2}:\d{2}$/.test(slot)) {
    return res.status(400).json({ ok: false, error: "Il manque le créneau, le nom, le téléphone ou un e-mail valide." });
  }
  if (!process.env.SMTP_PASS) return res.status(503).json({ ok: false, error: "Envoi non configuré." });

  const a = d.answers || {}, r = d.results || {}, s = d.source || {};
  const first = name.split(" ")[0];
  const when = `${dayLabel} à ${slot.replace(":", " h ")}`;
  const camp = [s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).map((x) => clean(x, 60)).join(" / ") || (s.gclid ? "Google Ads" : s.fbclid ? "Facebook" : "");
  const foyer = `${lab(a.family)}, ${+a.kids || 0} enfant(s)` + (a.family === "couple" ? (a.spouseCountry === "none" ? ", conjoint sans revenu" : `, conjoint en ${lab(a.spouseCountry)} (${eur(a.spouseIncome)} net imposable / mois)`) : "");

  const results = [
    ["Net mensuel", `${eur(r.netMonthly)} (classe ${clean(r.classNow, 4)})`],
    ["Impôt récupérable", `${eur(r.taxGainYear)} / an, ${eur(r.taxGainWithSavings)} avec l'épargne`],
    ["Retraite estimée à 65 ans", `${eur(r.pensionAt65)} / mois`],
    ["Capacité d'emprunt", `${eur(r.loanCapacity)} (mensualité ${eur(r.loanMonthly)})`],
  ];
  const leadRows = [
    ["Nom", name], ["Téléphone", phone], ["E-mail", email], ["Rappel souhaité", when],
    ["Résidence", lab(a.residence) + (a.km ? ` (${+a.km} km)` : "")],
    ["Salaire brut", `${eur(a.salary)} × ${+a.months || 12} mois`], ["Âge", `${+a.age} ans`],
    ["Carrière", `${+a.yearsFR} ans en France, ${+a.yearsLU} ans au Luxembourg`],
    ["Foyer", foyer], ["Logement", lab(a.home)],
    ...results,
    ["Provenance", camp || clean(s.referrer, 200) || "accès direct"], ["Page d'arrivée", clean(s.landing || s.page, 200)],
  ];
  const from = `brutnet.lu <${FROM_ADDR()}>`;
  const to = process.env.MAIL_TO || FROM_ADDR();
  const foot = `brutnet.lu · MALAUTO SAS · 5 rue de la Tour, 57100 Thionville · <a href="${SITE}/mentions-legales#confidentialite" style="color:#5B6475">Confidentialité</a>`;

  try {
    const sent = await mailer().sendMail({
      from, to, replyTo: `${name} <${email}>`,
      subject: `${bot ? "[Robot ?] " : ""}Nouveau lead brutnet.lu : ${name}, ${when}`,
      text: leadRows.map(([k, v]) => `${k} : ${v}`).join("\n"),
      html: layout(`Nouveau lead : ${esc(name)}`, leadRows.map(([k, v]) => row(k, v)).join(""),
        `<p style="margin:0">À rappeler le <b>${esc(when)}</b> au <a href="tel:${esc(phone.replace(/[^\d+]/g, ""))}">${esc(phone)}</a>. « Répondre » écrit directement à ${esc(first)}.</p>`, "Reçu depuis le formulaire du diagnostic brutnet.lu."),
    });
    console.log(JSON.stringify({ evt: "lead", bot, smtp: String(sent && sent.response || "").slice(0, 80) }));   // sans données personnelles
  } catch (e) {
    console.error("lead", e && e.message);
    return res.status(502).json({ ok: false, error: "L'envoi n'a pas abouti. Réessayez dans un instant." });
  }
  if (bot) return res.status(200).json({ ok: true });

  try {
    await mailer().sendMail({
      from, to: `${name} <${email}>`, replyTo: FROM_ADDR(),
      subject: `Votre demande de rappel est bien reçue : ${when}`,
      text: [
        `Bonjour ${first},`, "",
        `Nous avons bien reçu votre demande. Nous vous appelons le ${when} au ${phone}, pour 20 minutes, gratuitement et sans engagement.`,
        "Si ce créneau n'est plus libre, nous vous proposons le plus proche par e-mail ou par téléphone.", "",
        "Le résumé de votre pré-diagnostic :", ...results.map(([k, v]) => `- ${k} : ${v}`), "",
        "Ce sont des estimations établies avec les barèmes officiels 2026. Pour l'appel, gardez sous la main votre dernière fiche de paie et, si vous l'avez, votre relevé de carrière.", "",
        "Pour changer d'horaire ou annuler, répondez simplement à cet e-mail.", "",
        "À bientôt,", "L'équipe brutnet.lu", SITE,
      ].join("\n"),
      html: layout(`C'est noté, ${esc(first)}.`, results.map(([k, v]) => row(k, v)).join(""),
        `<p style="margin:0 0 10px">Nous avons bien reçu votre demande. Nous vous appelons le <b>${esc(when)}</b> au <b>${esc(phone)}</b>, pour 20 minutes, gratuitement et sans engagement.</p>
<p style="margin:0 0 10px">Si ce créneau n'est plus libre, nous vous proposons le plus proche par e-mail ou par téléphone.</p>
<p style="margin:16px 0 0;font-weight:700">Le résumé de votre pré-diagnostic</p>`,
        `Estimations établies avec les barèmes officiels 2026. Pour l'appel, gardez votre dernière fiche de paie et, si vous l'avez, votre relevé de carrière. Pour changer d'horaire ou annuler, répondez à cet e-mail.<br><br>${foot}`),
    });
    console.log(JSON.stringify({ evt: "confirmation", ok: true }));
  } catch (e) {
    console.error("confirmation", e && e.message);           // le lead est parti : on ne bloque pas le visiteur
  }
  return res.status(200).json({ ok: true });
};

/**
 * brutnet.lu : réception des demandes de rappel (leads).
 *
 * Installation (une fois) :
 *  1. Créer une feuille Google Sheets, par exemple « brutnet.lu leads ».
 *  2. Extensions > Apps Script, remplacer le contenu par ce fichier, enregistrer.
 *  3. Déployer > Nouveau déploiement > type « Application Web » :
 *       Exécuter en tant que : Moi ; Qui a accès : Tout le monde.
 *     Autoriser l'accès demandé (feuille + envoi d'e-mail).
 *  4. Copier l'URL qui se termine par /exec dans LEADS_URL (diagnostic.html).
 *
 * Après une modification de ce script : Déployer > Gérer les déploiements > modifier > Nouvelle version
 * (l'URL reste la même).
 */

var SHEET = 'Leads';
var HEADERS = ['Reçu le', 'Nom', 'Téléphone', 'E-mail', 'Jour souhaité', 'Heure', 'Statut',
  'Résidence', 'Km', 'Brut mensuel', 'Mois', 'Âge', 'Années FR', 'Années LU', 'Foyer', 'Enfants',
  'Conjoint', 'Revenu conjoint', 'Logement',
  'Net mensuel', 'Classe', 'Retraite à 65 ans', 'Impôt récupérable / an', 'Avec épargne / an',
  'Capacité d\'emprunt', 'Mensualité max', 'Page', 'Provenance', 'Campagne', 'Données brutes'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.website) return json({ ok: true });                       // champ piège rempli : robot
    var email = String(d.email || '').trim(), phone = String(d.phone || '').trim(), name = String(d.name || '').trim();
    if (!d.consent || name.length < 2 || phone.replace(/\D/g, '').length < 9 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'champs invalides' });
    }
    var a = d.answers || {}, r = d.results || {}, s = d.source || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
    var campaign = [s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).join(' / ') || (s.gclid ? 'Google Ads' : (s.fbclid ? 'Facebook' : ''));
    var row = [new Date(), name, phone, email, d.day, d.slot, 'Nouveau',
      a.residence, a.km, a.salary, a.months, a.age, a.yearsFR, a.yearsLU, a.family, a.kids,
      a.spouseCountry, a.spouseIncome, a.home,
      r.netMonthly, r.classNow, r.pensionAt65, r.taxGainYear, r.taxGainWithSavings, r.loanCapacity, r.loanMonthly,
      s.page, s.referrer, campaign, JSON.stringify(d).slice(0, 45000)];
    sh.appendRow(row.map(safe));

    var owner = Session.getEffectiveUser().getEmail();
    if (owner) {
      MailApp.sendEmail({
        to: owner,
        replyTo: email,
        subject: 'Nouveau lead brutnet.lu : ' + name + ', ' + d.day + ' à ' + d.slot,
        body: [
          name + ' souhaite être rappelé le ' + d.day + ' à ' + d.slot + '.',
          'Téléphone : ' + phone, 'E-mail : ' + email, '',
          'Profil : résidence ' + a.residence + ', ' + a.salary + ' € brut × ' + a.months + ', ' + a.age + ' ans, ' + a.family + ', ' + a.kids + ' enfant(s), logement ' + a.home,
          'Carrière : ' + a.yearsFR + ' ans FR, ' + a.yearsLU + ' ans LU',
          'Net mensuel ' + r.netMonthly + ' € (classe ' + r.classNow + ')',
          'Retraite estimée à 65 ans : ' + r.pensionAt65 + ' € / mois',
          'Impôt récupérable : ' + r.taxGainYear + ' € / an (' + r.taxGainWithSavings + ' € avec épargne)',
          'Capacité d\'emprunt : ' + r.loanCapacity + ' € (mensualité ' + r.loanMonthly + ' €)', '',
          'Provenance : ' + (campaign || s.referrer || 'direct'),
          'Feuille : ' + ss.getUrl()
        ].join('\n')
      });
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* Empêche une valeur saisie d'être interprétée comme une formule (ex. « +352… », « =… »). */
function safe(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v === undefined ? '' : v;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Contrôles du moteur contre les exemples officiels. Lancer : node calc.test.js */
const DC = require('./calc.js');
const P = DC.P;
let fails = 0;
function near(label, got, exp, tol) {
  const ok = Math.abs(got - exp) <= tol; if (!ok) fails++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + label + ': ' + (+got).toFixed(2) + ' (attendu ' + exp + ')');
}

console.log('--- Barème ACD (tarif 2025 reconduit en 2026)');
near('T1(50 000) classe 1 = 7 341 (exemple financialservices.lu)', DC.T1(50000), 7341.3, 0.5);
near('T2(100 000) classe 2 = 14 682', DC.T2(100000), 14682.6, 1);
near('T1(13 230) = 0', DC.T1(13230), 0, 0.001);
near('T1a(26 460) = 0 (tranche exonérée classe 1a)', DC.T1a(26460), 0, 0.001);
near('T1a continue au point de plafonnement', DC.T1a(44442), DC.T1(1.5 * 44442 - 26460), 0.01);
near('fonds pour l\'emploi 7 %', DC.taxFull(50000, 1), 7341.3 * 1.07, 0.5);
near('fonds pour l\'emploi 9 % au-delà de 150 000', DC.taxFull(200000, 1), DC.T1(150000) * 1.07 + (DC.T1(200000) - DC.T1(150000)) * 1.09, 0.01);

console.log('--- Crédits d\'impôt 2026 (ACD)');
near('CIS 42 000 € = 570', DC.cisAnnual(42000), 570, 0.01);
near('CIS 11 265 € = 599,54', DC.cisAnnual(11265), 599.54, 0.01);
near('CIS 60 000 € = 300', DC.cisAnnual(60000), 300, 0.01);
near('CIS 80 000 € = 0', DC.cisAnnual(80000), 0, 0.01);
near('CI-CO2 50 000 € = 162', DC.cico2Annual(50000), 162, 0.01);
near('CISSM 3 500 € = 13,50 (exemple ACD)', DC.cissmMonthly(3500), 13.5, 0.01);
near('CISSM au SSM = 81', DC.cissmMonthly(2771.33), 81, 0.01);
near('CIM 100 000 € = 1 056', DC.cimAnnual(100000), 1056, 1);
near('FD 30 km = 26 unités × 99', DC.fdAnnual(30), 2574, 0.01);
near('FD 45 km plafonné à 2 574', DC.fdAnnual(45), 2574, 0.01);

console.log('--- Fiche de paie : exemple ACD du 13.02.2025, paramètres 2025 injectés');
const save = { pension: P.lu.rates.pension, cap: P.lu.capMonthly, dep: P.lu.depAllowance, cico2: P.lu.cico2 };
P.lu.rates.pension = 0.08; P.lu.capMonthly = 5 * 2637.79; P.lu.depAllowance = 659.45;
P.lu.cico2 = { flat: 192, flatTo: 40000, slope: 0.0048, zero: 80000 };
const ex = DC.payslip(3500, 2, 16, { extraDS: 16, date: '2025-01-15' });
near('cotisations pension + maladie = 386,75', ex.contribs.deductible, 386.75, 0.01);
near('base arrondie au multiple de 5 = 2 995', ex.base, 2995, 0.01);
near('retenue classe 2 = 63,80 (±0,10 : pas des tables)', ex.tax, 63.8, 0.15);
near('dépendance = 39,77', ex.contribs.dependency, 39.77, 0.01);
near('CIS mensuel = 47,50', ex.credits.cis, 47.5, 0.01);
near('CI-CO2 mensuel 2025 = 15,20', ex.credits.cico2, 15.2, 0.01);
near('CISSM = 13,50', ex.credits.cissm, 13.5, 0.01);
near('net = 3 085,88', ex.net, 3085.88, 0.15);
P.lu.rates.pension = save.pension; P.lu.capMonthly = save.cap; P.lu.depAllowance = save.dep; P.lu.cico2 = save.cico2;

console.log('--- CNAP : exemples de la brochure de janvier 2025, paramètres 2025 injectés');
const pp = P.lu.pension, saveRef = pp.refMonthly, saveRow = pp.table[2026];
pp.refMonthly = 2085 * 9.4443 * 1.553 / 12; pp.table[2026] = [24.963, 1.769, 95, 0.015];
const k = 9.4443 * 1.553;
const e2 = DC.luPension({ startYear: 2026, ageAtStart: 60, yearsLU: 40, yearsFR: 0, avgAnnual: 160000 * k / 40 });
near('ex. 2 majorations forfaitaires = 636,15', e2.autonomous.forfait, 636.15, 0.02);
near('ex. 2 taux majoré = 1,844 %', e2.autonomous.rate * 100, 1.844, 0.0001);
near('ex. 2 majorations proportionnelles = 3 606,13', e2.autonomous.prop, 3606.13, 0.05);
near('ex. 2 pension = 4 242,28', e2.monthly, 4242.28, 0.05);
const e5 = DC.luPension({ startYear: 2026, ageAtStart: 65, yearsLU: 22, yearsFR: 0, avgAnnual: 32000 * k / 22 });
near('ex. 5 forfaitaires = 349,89', e5.autonomous.forfait, 349.89, 0.02);
near('ex. 5 proportionnelles = 691,89', e5.autonomous.prop, 691.89, 0.02);
near('ex. 5 pension minimum = 1 261,45', e5.monthly, 1261.45, 0.05);
pp.refMonthly = saveRef; pp.table[2026] = saveRow;

console.log('--- CNAP, paramètres au 01.06.2026');
const f40 = DC.luPension({ startYear: 2026, ageAtStart: 65, yearsLU: 40, yearsFR: 0, avgAnnual: 1 });
near('forfaitaires 40 ans = 678,71', f40.autonomous.forfait, 678.71, 0.02);
near('pension minimum 40 ans = 2 436,04', f40.monthly, 2436.04, 0.02);
near('pension maximum = 11 277,94', pp.maxShare * pp.refMonthly, 11277.94, 0.05);
const g10 = DC.luPension({ startYear: 2026, ageAtStart: 65, yearsLU: 10, yearsFR: 0, avgAnnual: 48000 });
near('10 ans à 4 000 € = 874,88 (table Frontaliers Grand Est)', g10.monthly, 874.88, 0.05);

console.log('--- France');
const fr = DC.frPension({ yearsFR: 9, yearsLU: 36, avgMonthlyFR: 3000, birthYear: 1985, ageAtStart: 65, otherPensions: 2000 });
near('base au prorata UE : 36 000 × 50 % × 36/180 / 12 = 300', fr.base, 300, 0.01);
near('points Agirc-Arrco 9 ans à 36 000 €', fr.points, 9 * 36000 * 0.062 / 20.1877, 0.01);
near('Agirc-Arrco mensuel = points × 1,4587 / 12', fr.agirc, fr.points * 1.4587 / 12, 0.01);

console.log('--- Capacité d\'emprunt');
const c = DC.capacity(3648);
near('mensualité = 35 % du net', c.pay, 3648 * 0.35, 0.01);
const r = 0.0345 / 12, ann = r / (1 - Math.pow(1 + r, -300));
near('capital = mensualité / (annuité + assurance)', c.capital, c.pay / (ann + 0.003 / 12), 0.5);

console.log('--- Diagnostic complet : aucune valeur non finie');
const base = { residence: 'FR', salary: 4800, months: 13, km: 30, yearsFR: 9, yearsLU: 12, avgFR: 2500, age: 41, family: 'couple', kids: 1, spouseIncome: 2000, spouseCountry: 'FR', home: 'rent', mortgageInterest: 0, homeYear: 0 };
const variants = {
  'défaut': base,
  'célibataire': Object.assign({}, base, { family: 'single', kids: 0, spouseCountry: 'none' }),
  'parent isolé': Object.assign({}, base, { family: 'single', kids: 1, spouseCountry: 'none' }),
  'conjoint sans revenu': Object.assign({}, base, { spouseCountry: 'none' }),
  'conjoint au Luxembourg': Object.assign({}, base, { spouseCountry: 'LU', spouseIncome: 4000 }),
  'résident luxembourgeois': Object.assign({}, base, { residence: 'LU' }),
  'propriétaire 2021': Object.assign({}, base, { home: 'owner', mortgageInterest: 6000, homeYear: 2021 }),
  'propriétaire 2025': Object.assign({}, base, { home: 'owner', mortgageInterest: 9000, homeYear: 2025 }),
  'haut salaire': Object.assign({}, base, { salary: 12000, months: 12 }),
  'SSM': Object.assign({}, base, { salary: 2771.33, months: 12, yearsFR: 0, avgFR: 0 }),
  'bientôt frontalier': Object.assign({}, base, { residence: 'SOON', yearsLU: 0 }),
  '64 ans': Object.assign({}, base, { age: 64, yearsFR: 20, yearsLU: 20 })
};
for (const tag in variants) {
  const d = DC.diagnostic(variants[tag]);
  const bad = JSON.stringify(Object.assign({}, d, { params: null, input: null }), (k, v) => typeof v === 'number' && !isFinite(v) ? 'BAD' : v).includes('"BAD"');
  if (bad) fails++;
  console.log((bad ? 'FAIL ' : 'OK   ') + tag.padEnd(24) + '| net ' + d.payslip.net.toFixed(0) + ' €/mois | impôt net ' + d.tax.taxYearNow.toFixed(0) + ' €/an | gains ' + d.tax.gainDeclare.toFixed(0) + ' + ' + d.tax.gainMortgage.toFixed(0) + ' + ' + d.tax.gainSavings.toFixed(0) + ' | retraite ' + d.pension.totalNow.toFixed(0) + ' → ' + d.pension.totalAt65.toFixed(0) + ' | capacité ' + d.credit.capital.toFixed(0));
}

console.log('--- Estimateur : avantage en nature, taux global, 13e mois');
{
  const a = DC.payslip(4800, 1, 30, { atn: 500 });
  near('ATN : brut cotisable 5 300', a.gross, 5300, 0.01);
  near('ATN : contributions sur 5 300', a.contribs.deductible, 5300 * 0.1155, 0.01);
  near('ATN : net = brut versé − cotisations − retenue + crédits − ATN', a.net, 4800 - a.contribs.total - a.tax + a.creditTotal, 0.01);
  const ref = DC.payslip(4800, 2, 30, {});
  const rate = DC.tauxGlobal(ref.annualR, 24000);
  near('taux global = impôt classe 2 sur le revenu mondial / revenu mondial', rate, DC.taxFull(ref.annualR + 24000, 2) / (ref.annualR + 24000), 1e-9);
  const g = DC.payslip(4800, 2, 30, { rate: rate });
  near('retenue au taux global = base annuelle × taux / 12, arrondie', g.tax, Math.floor(ref.annualR * rate / 12 * 10) / 10, 0.01);
  const b = DC.bonusTax(4800, 4800, 1, 30, {});
  near('13e mois : cotisations sur le cumul du mois, abattement dépendance une seule fois', b.contribs.total, DC.contribs(9600).total - DC.contribs(4800).total, 0.01);
  near('13e mois : retenue = différence d\'impôt annuel', b.tax, Math.floor((DC.taxFull(DC.payslip(4800,1,30).annualR + b.taxable, 1) - DC.taxFull(DC.payslip(4800,1,30).annualR, 1)) * 10) / 10, 0.01);
  console.log('     net mensuel classe 1 à 4 800 € :', DC.payslip(4800, 1, 30).net.toFixed(2), '| 13e mois net :', b.net.toFixed(2));
}

console.log('--- Fiche additionnelle (résident marié, second salaire)');
{
  const a = DC.payslip(3500, 2, 30, { rate: 0.15, flat: true });
  near('taux fixe 15 % sur le semi-net arrondi', a.tax, Math.floor(a.base * 0.15 * 10) / 10, 0.01);
  near('semi-net = brut − cotisations déductibles − FD, arrondi à 5 €', a.base, Math.floor((3500 - DC.contribs(3500).deductible - 2574 / 12) / 5) * 5, 0.01);
  const b = DC.bonusTax(3500, 3500, 2, 30, { rate: 0.15, flat: true });
  near('13e mois sur fiche additionnelle : 15 % de la partie imposable', b.tax, Math.floor(b.taxable * 0.15 * 10) / 10, 0.01);
}

console.log('--- Coût employeur (CCSS, avis du 16.01.2026)');
{
  const m = DC.employerCost(4800, { accidentFactor: 1, mutualityClass: 2, stm: true });
  near('cotisations patronales 4 800 € : 2,80 + 0,25 + 8,50 + 0,65 + 0,95 + 0,14 = 13,29 %', m.contributions, 4800 * 0.1329, 0.01);
  near('coût du mois = brut + cotisations', m.cost, 4800 * 1.1329, 0.01);
  const h = DC.employerCost(20000, { accidentFactor: 1.5, mutualityClass: 4, stm: false });
  near('plafond 5 × SSM sur la part employeur', h.contributions, 13856.65 * (0.028 + 0.0025 + 0.085 + 0.0065 * 1.5 + 0.0266), 0.01);
  const b = DC.bonusTax(9000, 9000, 1, 30, {});
  near('13e mois à 9 000 € : cotisations limitées au plafond mensuel', b.contribs.deductible, (13856.65 - 9000) * 0.1155, 0.01);
}
console.log(fails ? ('\n' + fails + ' ÉCHEC(S)') : '\nTous les contrôles passent.');
process.exit(fails ? 1 : 0);

/* Deux Côtés — moteur de calcul frontalier Lorraine ↔ Luxembourg
   Paramètres officiels en vigueur au 4 novembre 2026. Chaque constante porte sa source.
   Fonctionne dans le navigateur (window.DC) et sous Node (module.exports). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DC = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* PARAMÈTRES                                                          */
  /* ------------------------------------------------------------------ */
  var P = {
    asOf: "2026-11-04",
    year: 2026,
    lu: {
      /* ITM : salaire social minimum non qualifié depuis le 1er juin 2026, indice 992,24 */
      index: 992.24,
      ssm: 2771.33,
      /* CCSS, avis du 16.01.2026 : taux de cotisation salarié au 01.01.2026 */
      rates: { pension: 0.085, healthCare: 0.028, healthCash: 0.0025, dependency: 0.014 },
      capMonthly: 5 * 2771.33,         /* maximum cotisable pension + maladie = 5 × SSM */
      depAllowance: 2771.33 / 4,       /* abattement assurance dépendance = ¼ SSM */
      /* CCSS, avis du 16.01.2026 : part employeur, même plafond cotisable */
      employer: {
        healthCare: 0.028, healthCash: 0.0025, pension: 0.085,
        family: 0.017,               /* prestations familiales : secteur public uniquement (note 3 de l'avis) */
        occupationalHealth: 0.0014,  /* santé au travail : employeurs privés affiliés au STM (note 4) */
        accidentBase: 0.0065,        /* assurance accident : taux de base 0,650 % × facteur bonus-malus fixé par l'AAA (note 5) */
        accidentFactors: [0.85, 1, 1.1, 1.3, 1.5],
        mutuality: { 1: 0.0023, 2: 0.0095, 3: 0.0156, 4: 0.0266 } /* Mutualité des employeurs, classe selon le taux d'absentéisme financier */
      },
      /* ACD, tarif de base art. 118 LIR, année d'imposition 2025, reconduit en 2026 (borne basse, taux) */
      tariff: [
        [0, 0], [13230, 0.08], [15435, 0.09], [17640, 0.10], [19845, 0.11], [22050, 0.12],
        [24255, 0.14], [26550, 0.16], [28845, 0.18], [31140, 0.20], [33435, 0.22], [35730, 0.24],
        [38025, 0.26], [40320, 0.28], [42615, 0.30], [44910, 0.32], [47205, 0.34], [49500, 0.36],
        [51795, 0.38], [54090, 0.39], [117450, 0.40], [176160, 0.41], [234870, 0.42]
      ],
      /* Art. 120bis LIR : classe 1a = tarif appliqué à R réduit de la moitié de son complément à 4 × 13 230,
         taux d'accroissement plafonné à 39 % à partir de 37 842 € (base 2017) indexé, puis 40/41/42 % */
      class1a: { K: 52920, exempt: 26460, capFrom: 44442, capRates: [[44442, 0.39], [117450, 0.40], [176160, 0.41], [234870, 0.42]] },
      /* Fonds pour l'emploi : 7 %, 9 % au-delà de 150 000 € (cl. 1/1a) ou 300 000 € (cl. 2) */
      fpe: { base: 0.07, high: 0.09, thr1: 150000, thr2: 300000 },
      /* Forfaits intégrés au barème : frais d'obtention 540 €, dépenses spéciales 480 € */
      forfaits: { fo: 540, ds: 480 },
      /* Frais de déplacement : 99 € par unité (km à vol d'oiseau), 4 premières exclues, max 26 unités = 2 574 € */
      fd: { perUnit: 99, freeUnits: 4, maxUnits: 30 },
      /* ACD : CIS et CI-CO2 salarié, année d'imposition 2026 (sur salaire brut annuel) */
      cis: { min: 936, a: 300, slopeLow: 0.029, flat: 600, flatTo: 40000, slopeHigh: 0.015, zero: 80000 },
      cico2: { flat: 216, flatTo: 40000, slope: 0.0054, zero: 80000 },
      /* CISSM : 81 €/mois (projet de loi 8775, « montant actuel »), 1 800–3 000 € plein, dégressif jusqu'à 3 600 € ;
         vérifié par l'exemple ACD : 3 500 € brut → 13,50 € */
      cissm: { amount: 81, fullFrom: 1800, fullTo: 3000, zero: 3600 },
      /* Crédit d'impôt conjoncture, 1er juin – 31 déc. 2026 : barème indicatif Securex (interpolation linéaire) */
      cic: [[1125, 0], [1250, 2], [2100, 3.5], [4600, 22], [9500, 22], [9925, 24], [14175, 24], [14916, 27.13]],
      cicUntil: "2026-12-31",
      /* Crédit d'impôt monoparental (classe 1a), à partir de 2025 */
      cim: { full: 3504, from: 60000, slope: 0.0612, to: 105000, min: 750 },
      /* Dépenses spéciales et abattements (guichet.lu / ACD / taxx.lu, année 2026) */
      ded: {
        insurance: 672,            /* art. 111 : primes d'assurance + intérêts débiteurs, par personne du ménage */
        pensionSavings: 4500,      /* art. 111bis, depuis le 1er janvier 2026, par contribuable */
        homeSavingsYoung: 1344,    /* épargne-logement, souscripteur de 18 à 40 ans, par personne du ménage */
        homeSavingsOld: 672,
        homeSavingsYoungMaxAge: 40,
        aep: 4500,                 /* abattement extra-professionnel, imposition collective, deux revenus */
        mortgage: [                /* intérêts hypothécaires habitation principale, par personne, selon mise à disposition */
          { from: 2024, cap: Infinity }, { from: 2020, cap: 4000 }, { from: 2015, cap: 3000 }, { from: 0, cap: 2000 }
        ]
      },
      /* Assimilation art. 157ter : ≥ 90 % des revenus mondiaux du contribuable imposables au Luxembourg,
         ou revenus non luxembourgeois < 13 000 € ; Belgique : 50 % des revenus professionnels du ménage */
      assimilation: { share: 0.90, foreignMax: 13000, beShare: 0.50 },
      /* CNAP : pension de vieillesse, paramètres au 01.06.2026 */
      pension: {
        refMonthly: 2706.71,       /* montant de référence mensuel (= pension minimale 2 436,04 € / 0,9) */
        minShare: 0.9,
        maxShare: 5 * 5 / 6,       /* 5/6 du quintuple du montant de référence = 11 277,96 € */
        stageMonths: 120,
        legalAge: 65,
        /* Annexe 3 de la brochure CNAP : année de début du droit → forfaitaire %, proportionnel %, seuil, augmentation % */
        table: {
          2026: [25.075, 1.763, 95, 0.016], 2027: [25.188, 1.757, 95, 0.016], 2028: [25.300, 1.750, 95, 0.016],
          2029: [25.413, 1.744, 95, 0.017], 2030: [25.525, 1.738, 96, 0.017], 2031: [25.638, 1.732, 96, 0.018],
          2032: [25.750, 1.725, 96, 0.018], 2033: [25.863, 1.719, 96, 0.018], 2034: [25.975, 1.713, 96, 0.019],
          2035: [26.088, 1.707, 97, 0.019], 2036: [26.200, 1.700, 97, 0.019], 2037: [26.313, 1.694, 97, 0.020],
          2038: [26.425, 1.688, 97, 0.020], 2039: [26.538, 1.682, 97, 0.021], 2040: [26.650, 1.675, 97, 0.021],
          2041: [26.763, 1.669, 98, 0.021], 2042: [26.875, 1.663, 98, 0.022], 2043: [26.988, 1.657, 98, 0.022],
          2044: [27.100, 1.650, 98, 0.022], 2045: [27.213, 1.644, 98, 0.023], 2046: [27.325, 1.638, 98, 0.023],
          2047: [27.438, 1.632, 99, 0.024], 2048: [27.550, 1.625, 99, 0.024], 2049: [27.663, 1.619, 99, 0.024],
          2050: [27.775, 1.613, 99, 0.025], 2051: [27.888, 1.607, 99, 0.025], 2052: [28.000, 1.600, 100, 0.025]
        },
        maxPropRate: 2.05
      }
    },
    fr: {
      pass: 48060, pmss: 4005,     /* arrêté du 22.12.2025 */
      rateFull: 0.50,
      decotePerQuarter: 0.0125,    /* 1,25 % du taux par trimestre manquant, max 20 */
      decoteMaxQuarters: 20,
      fullRateAge: 67,
      /* Minimum contributif au 01.01.2026 */
      mico: { base: 756.29, majore: 903.93, majoreQuarters: 120, ceiling: 1410.89 },
      /* Agirc-Arrco : prix d'achat 2026, valeur de service au 1er novembre 2026 (+1,4 %, CA du 14.10.2026) */
      agirc: { buy: 20.1877, value: 1.4587, t1: 0.062, t2: 0.17, t2CapPass: 8, minorationPerQuarter: 0.0125 },
      /* Durée requise par génération (réforme 2023, suspension LFSS 2026 jusqu'au 01.01.2028) */
      quarters: function (birthYear) {
        if (birthYear <= 1960) return 167;
        if (birthYear === 1961) return 168;
        if (birthYear === 1962) return 169;
        if (birthYear === 1963) return 170;
        if (birthYear === 1964) return 170;
        if (birthYear === 1965) return 171;
        return 172;
      }
    },
    credit: {
      rate25: 0.0345,              /* Observatoire Crédit Logement / CSA, septembre 2026, prêts à 25 ans */
      months: 300,                 /* HCSF : 25 ans maximum (27 ans en VEFA / construction) */
      dsti: 0.35,                  /* HCSF : 35 % assurance comprise */
      insurance: 0.003             /* hypothèse : assurance emprunteur 0,30 % du capital initial par an */
    }
  };

  /* ------------------------------------------------------------------ */
  /* OUTILS                                                              */
  /* ------------------------------------------------------------------ */
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function floorTo(x, step) { return Math.floor(x / step + 1e-9) * step; }
  function interp(table, x) {
    if (x <= table[0][0]) return table[0][1];
    for (var i = 1; i < table.length; i++) {
      if (x <= table[i][0]) {
        var a = table[i - 1], b = table[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return table[table.length - 1][1];
  }

  /* ------------------------------------------------------------------ */
  /* IMPÔT LUXEMBOURGEOIS                                                */
  /* ------------------------------------------------------------------ */
  /* Tarif de base (art. 118) sur le revenu imposable ajusté annuel R, hors fonds pour l'emploi. */
  function T1(R) {
    if (R <= 0) return 0;
    var t = P.lu.tariff, tax = 0;
    for (var i = 1; i < t.length; i++) {
      var lo = t[i][0], hi = (i + 1 < t.length) ? t[i + 1][0] : Infinity;
      if (R > lo) tax += (Math.min(R, hi) - lo) * t[i][1];
    }
    return tax;
  }
  /* Classe 1a (art. 120bis). */
  function T1a(R) {
    var c = P.lu.class1a;
    if (R <= c.exempt) return 0;
    if (R <= c.capFrom) return T1(1.5 * R - c.K / 2);
    var tax = T1(1.5 * c.capFrom - c.K / 2);
    for (var i = 0; i < c.capRates.length; i++) {
      var lo = c.capRates[i][0], hi = (i + 1 < c.capRates.length) ? c.capRates[i + 1][0] : Infinity;
      if (R > lo) tax += (Math.min(R, hi) - lo) * c.capRates[i][1];
    }
    return tax;
  }
  /* Classe 2 (art. 121) : double de la cote correspondant à la moitié du revenu. */
  function T2(R) { return 2 * T1(R / 2); }
  function taxBase(R, cls) { return cls === 2 ? T2(R) : cls === "1a" ? T1a(R) : T1(R); }
  /* Impôt annuel fonds pour l'emploi compris (7 %, 9 % sur la partie au-delà du seuil). */
  function taxFull(R, cls) {
    var thr = cls === 2 ? P.lu.fpe.thr2 : P.lu.fpe.thr1;
    var low = taxBase(Math.min(R, thr), cls), all = taxBase(R, cls);
    return low * (1 + P.lu.fpe.base) + (all - low) * (1 + P.lu.fpe.high);
  }

  /* Crédits d'impôt annuels sur le salaire brut annuel. */
  function cisAnnual(g) {
    var c = P.lu.cis;
    if (g < c.min || g >= c.zero) return 0;
    if (g <= 11265) return c.a + (g - c.min) * c.slopeLow;
    if (g <= c.flatTo) return c.flat;
    return c.flat - (g - c.flatTo) * c.slopeHigh;
  }
  function cico2Annual(g) {
    var c = P.lu.cico2;
    if (g < P.lu.cis.min || g >= c.zero) return 0;
    if (g <= c.flatTo) return c.flat;
    return c.flat - (g - c.flatTo) * c.slope;
  }
  function cissmMonthly(gm) {
    var c = P.lu.cissm;
    if (gm < c.fullFrom || gm >= c.zero) return 0;
    if (gm <= c.fullTo) return c.amount;
    return c.amount * (c.zero - gm) / (c.zero - c.fullTo);
  }
  function cicMonthly(gm, date) {
    var d = date || P.asOf;
    if (d < "2026-06-01" || d > P.lu.cicUntil) return 0;
    if (gm < P.lu.cic[0][0]) return 0;
    return interp(P.lu.cic, gm);
  }
  function cimAnnual(R) {
    var c = P.lu.cim;
    if (R <= c.from) return c.full;
    if (R > c.to) return c.min;
    return c.full - (R - c.from) * c.slope;
  }

  /* Unités d'éloignement déductibles → FD annuel. */
  function fdAnnual(km) {
    var u = clamp(Math.round(km || 0), 0, P.lu.fd.maxUnits);
    return Math.max(0, u - P.lu.fd.freeUnits) * P.lu.fd.perUnit;
  }

  /* Cotisations salarié sur un brut mensuel. */
  function contribs(gm) {
    var r = P.lu.rates, base = Math.min(gm, P.lu.capMonthly);
    var pension = base * r.pension, health = base * (r.healthCare + r.healthCash);
    var dep = Math.max(0, gm - P.lu.depAllowance) * r.dependency;
    return { pension: pension, health: health, dependency: dep, deductible: pension + health, total: pension + health + dep };
  }

  /* Fiche de paie d'un mois ordinaire (méthode ACD : base arrondie au multiple de 5 € inférieur,
     impôt arrondi aux 10 centimes inférieurs, forfaits 540 + 480 intégrés au barème).
     opts.atn = avantage en nature mensuel (cotisable et imposable, non versé) ;
     opts.rate = taux global inscrit sur la fiche (fraction), à la place du barème ;
     opts.extraDS = déductions supplémentaires inscrites sur la fiche, par mois. */
  function payslip(gm, cls, km, opts) {
    opts = opts || {};
    var atn = Math.max(0, opts.atn || 0);
    var gross = gm + atn;
    var c = contribs(gross);
    var fdM = fdAnnual(km) / 12;
    var semi = gross - c.deductible - fdM - (opts.extraDS || 0);
    var base = floorTo(Math.max(0, semi), 5);
    var annualR = Math.max(0, 12 * base - P.lu.forfaits.fo - P.lu.forfaits.ds);
    /* fiche principale : barème (forfaits intégrés) ou taux global sur la base après forfaits ;
       fiche additionnelle (opts.flat) : taux fixe appliqué au semi-net, sans forfaits */
    var tax = opts.flat ? floorTo(base * opts.rate, 0.1)
            : opts.rate ? floorTo(annualR * opts.rate / 12, 0.1)
            : floorTo(taxFull(annualR, cls) / 12, 0.1);
    var ga = gross * 12;
    var credits = { cis: cisAnnual(ga) / 12, cico2: cico2Annual(ga) / 12, cissm: cissmMonthly(gross), cic: cicMonthly(gross, opts.date) };
    var cim = (cls === "1a" && opts.cim) ? cimAnnual(annualR) / 12 : 0;
    var creditTotal = credits.cis + credits.cico2 + credits.cissm + credits.cic + cim;
    var net = gross - c.total - tax + creditTotal - atn;
    return { gross: gross, cash: gm, atn: atn, contribs: c, fd: fdM, extraDS: opts.extraDS || 0, base: base, annualR: annualR,
             tax: tax, rate: opts.rate || 0, credits: credits, cim: cim, creditTotal: creditTotal, net: net };
  }

  /* Retenue sur une rémunération non périodique (13e mois, prime) : différence d'impôt annuel,
     ou taux global sur la partie imposable si la fiche en porte un. */
  function bonusTax(gm, bonus, cls, km, opts) {
    opts = opts || {};
    var gross = gm + Math.max(0, opts.atn || 0);
    var c = contribs(gross);
    /* la prime s'ajoute au salaire du mois : le plafond cotisable mensuel s'applique à l'ensemble */
    var cAll = contribs(gross + bonus);
    var cb = { pension: cAll.pension - c.pension, health: cAll.health - c.health, dependency: cAll.dependency - c.dependency };
    cb.deductible = cb.pension + cb.health; cb.total = cb.deductible + cb.dependency;
    var fdM = fdAnnual(km) / 12;
    var base = floorTo(Math.max(0, gross - c.deductible - fdM - (opts.extraDS || 0)), 5);
    var annualR = Math.max(0, 12 * base - P.lu.forfaits.fo - P.lu.forfaits.ds);
    var taxable = Math.max(0, bonus - cb.deductible);
    var tax = (opts.rate || opts.flat) ? floorTo(taxable * opts.rate, 0.1) : floorTo(taxFull(annualR + taxable, cls) - taxFull(annualR, cls), 0.1);
    return { tax: tax, contribs: cb, taxable: taxable, net: bonus - cb.total - tax };
  }

  /* Coût employeur d'un mois, secteur privé : cotisations patronales sur la base cotisable plafonnée.
     opts.accidentFactor (0,85 à 1,50), opts.mutualityClass (1 à 4), opts.stm (false = pas de santé au travail),
     opts.publicSector (true = prestations familiales 1,70 %), opts.atn (avantage en nature, cotisable). */
  function employerCost(gm, opts) {
    opts = opts || {};
    var e = P.lu.employer, atn = Math.max(0, opts.atn || 0), gross = gm + atn;
    var base = Math.min(gross, P.lu.capMonthly);
    var factor = opts.accidentFactor || 1, cls = opts.mutualityClass || 2;
    var lines = {
      healthCare: base * e.healthCare, healthCash: base * e.healthCash, pension: base * e.pension,
      accident: base * e.accidentBase * factor, mutuality: base * (e.mutuality[cls] || e.mutuality[2]),
      occupationalHealth: opts.stm === false ? 0 : base * e.occupationalHealth,
      family: opts.publicSector ? base * e.family : 0
    };
    var total = 0; for (var k in lines) total += lines[k];
    return { gross: gross, cash: gm, base: base, lines: lines, contributions: total, cost: gm + total, rate: total / gross, factor: factor, mutualityClass: cls };
  }

  /* Taux global (art. 157ter) : impôt de classe 2 sur le revenu mondial du ménage rapporté à ce revenu. */
  function tauxGlobal(Rlu, other) {
    var total = Math.max(0, Rlu) + Math.max(0, other);
    return total > 0 ? taxFull(total, 2) / total : 0;
  }

  /* Impôt annuel par voie d'assiette (déclaration). other = revenu net mondial du conjoint (taux global). */
  function assessment(a) {
    var contribsY = contribs(a.grossMonthly).deductible * 12 + (a.bonus ? contribs(a.bonus).deductible : 0);
    var grossY = a.grossMonthly * 12 + (a.bonus || 0);
    var R = grossY - contribsY - P.lu.forfaits.fo - fdAnnual(a.km)
          - Math.max(P.lu.forfaits.ds, a.specialExpenses || 0)
          - (a.mortgageInterest || 0) - (a.aep || 0);
    R = Math.max(0, R);
    var tax;
    if (a.other && a.other > 0) {
      var total = R + a.other;
      tax = taxFull(total, a.cls) * R / total;        /* taux global art. 157ter */
    } else {
      tax = taxFull(R, a.cls);
    }
    var credits = cisAnnual(grossY) + cico2Annual(grossY) + cissmMonthly(a.grossMonthly) * 12
                + (a.cls === "1a" && a.cim ? cimAnnual(R) : 0);
    return { R: R, grossY: grossY, tax: tax, credits: credits, due: tax - credits };
  }

  /* ------------------------------------------------------------------ */
  /* PENSION LUXEMBOURGEOISE (CNAP)                                      */
  /* ------------------------------------------------------------------ */
  function pensionParams(startYear) {
    var y = clamp(Math.round(startYear), 2026, 2052);
    return P.lu.pension.table[y];
  }
  /* Une « formule » CNAP sur n années LU, avec yFR années étrangères (règlement 883/2004 : calcul autonome
     et calcul au prorata, le plus élevé est servi). avgAnnual = revenu cotisable annuel (euros d'aujourd'hui). */
  function luPension(a) {
    var pp = P.lu.pension, prm = pensionParams(a.startYear);
    var rateF = prm[0] / 100, rateP = prm[1] / 100, seuil = prm[2], aug = prm[3] / 100;
    var yLU = Math.max(0, a.yearsLU), yFR = Math.max(0, a.yearsFR || 0), age = a.ageAtStart;
    var cotis = Math.min(a.avgAnnual, 60 * P.lu.ssm);
    function formula(nYears, incomeSum) {
      var forfait = pp.refMonthly * rateF * Math.min(40, nYears) / 40;
      var over = Math.max(0, age + Math.floor(nYears) - seuil);
      var r = Math.min(pp.maxPropRate / 100, rateP + aug * over);
      var prop = r * incomeSum / 12;
      var min = nYears >= 20 ? pp.minShare * pp.refMonthly * Math.min(40, nYears) / 40 : 0;
      return { forfait: forfait, prop: prop, rate: r, min: min, total: Math.max(forfait + prop, min) };
    }
    if (yLU + yFR < pp.stageMonths / 12 || yLU <= 0) {
      return { eligible: false, monthly: 0, autonomous: null, prorata: null, params: prm };
    }
    var auto = formula(yLU, cotis * yLU);
    var total = yLU + yFR;
    var th = formula(total, cotis * total);
    var pro = { forfait: th.forfait * yLU / total, prop: th.prop * yLU / total, rate: th.rate, min: th.min * yLU / total, total: th.total * yLU / total };
    var best = pro.total > auto.total ? pro : auto;
    var cap = pp.maxShare * pp.refMonthly;
    return { eligible: true, monthly: Math.min(cap, best.total), autonomous: auto, prorata: pro, usedProrata: pro.total > auto.total, params: prm, cotisAnnual: cotis };
  }

  /* ------------------------------------------------------------------ */
  /* PENSION FRANÇAISE (régime général + Agirc-Arrco)                    */
  /* ------------------------------------------------------------------ */
  function frPension(a) {
    var f = P.fr, qFR = 4 * Math.max(0, a.yearsFR), qLU = 4 * Math.max(0, a.yearsLU);
    var req = f.quarters(a.birthYear);
    var annual = Math.max(0, a.avgMonthlyFR || 0) * 12;
    var sam = Math.min(annual, f.pass);
    var quartersTo67 = Math.max(0, (f.fullRateAge - a.ageAtStart) * 4);
    function rate(q) {
      var missing = Math.min(Math.max(0, req - q), quartersTo67, f.decoteMaxQuarters);
      return { taux: f.rateFull * (1 - f.decotePerQuarter * missing), missing: missing };
    }
    if (qFR <= 0) return { base: 0, agirc: 0, total: 0, req: req, qFR: 0, qLU: qLU };
    var rn = rate(qFR), rc = rate(qFR + qLU);
    var national = sam * rn.taux * Math.min(1, qFR / req) / 12;
    var theoretical = sam * rc.taux * Math.min(1, (qFR + qLU) / req);
    var prorata = theoretical * qFR / (qFR + qLU) / 12;
    var base = Math.max(national, prorata), usedProrata = prorata > national;
    var missing = usedProrata ? rc.missing : rn.missing;
    /* Agirc-Arrco : points sur T1 (6,20 %) et T2 (17 %), valeur de service, minoration si taux plein non atteint */
    var ag = f.agirc, t1 = Math.min(annual, f.pass), t2 = clamp(annual - f.pass, 0, (ag.t2CapPass - 1) * f.pass);
    var pointsPerYear = (t1 * ag.t1 + t2 * ag.t2) / ag.buy;
    var points = pointsPerYear * a.yearsFR;
    var coef = 1 - ag.minorationPerQuarter * rc.missing;
    var agirc = points * ag.value * coef / 12;
    /* Minimum contributif : taux plein, pension de base inférieure au minimum proratisé, total des pensions sous le plafond */
    var mico = 0;
    if (missing === 0) {
      var m = (qFR >= f.mico.majoreQuarters ? f.mico.majore : f.mico.base) * Math.min(1, qFR / req);
      if (base < m && base + agirc + (a.otherPensions || 0) <= f.mico.ceiling) mico = m - base;
    }
    return { base: base + mico, baseRaw: base, mico: mico, agirc: agirc, points: points, total: base + mico + agirc,
             req: req, qFR: qFR, qLU: qLU, missing: missing, usedProrata: usedProrata, sam: sam };
  }

  /* ------------------------------------------------------------------ */
  /* CAPACITÉ D'EMPRUNT (HCSF)                                           */
  /* ------------------------------------------------------------------ */
  function capacity(netMonthly, opts) {
    opts = opts || {};
    var c = P.credit, r = (opts.rate || c.rate25) / 12, n = opts.months || c.months;
    var pay = netMonthly * c.dsti - (opts.charges || 0);
    if (pay <= 0) return { pay: 0, capital: 0, rate: opts.rate || c.rate25, months: n, insuranceMonthly: 0 };
    var annuity = r / (1 - Math.pow(1 + r, -n));          /* mensualité par euro emprunté */
    var capital = pay / (annuity + c.insurance / 12);
    return { pay: pay, capital: capital, rate: opts.rate || c.rate25, months: n, insuranceMonthly: capital * c.insurance / 12 };
  }

  /* ------------------------------------------------------------------ */
  /* DIAGNOSTIC COMPLET                                                  */
  /* ------------------------------------------------------------------ */
  /* input : { residence: FR|BE|LU|SOON, salary (brut mensuel), months (12|13), km, yearsFR, yearsLU, avgFR,
              age, family: single|couple, kids, spouseIncome (net imposable mensuel), spouseCountry: FR|LU|none,
              home: rent|buy|owner|paid, mortgageInterest (annuel), homeYear } */
  function diagnostic(S) {
    var out = { params: P, input: S, notes: [] };
    var gm = +S.salary, bonus = S.months === 13 ? gm : 0, km = +S.km || 0;
    var adults = S.family === "couple" ? 2 : 1, kids = +S.kids || 0, n = adults + kids;
    var resident = S.residence === "LU";
    var couple = S.family === "couple";
    var spouseIncome = couple && S.spouseCountry !== "none" ? Math.max(0, +S.spouseIncome || 0) * 12 : 0;

    /* ---- 1. Classe sur la fiche aujourd'hui, et classe accessible ---- */
    var clsNow, clsOpt;
    if (couple) { clsNow = resident ? 2 : 1; clsOpt = 2; }
    else if (kids > 0) { clsNow = "1a"; clsOpt = "1a"; }
    else { clsNow = 1; clsOpt = 1; }
    var cimNow = !couple && kids > 0;

    /* ---- 2. Fiche de paie actuelle ---- */
    var slip = payslip(gm, clsNow, km, { cim: cimNow });
    var bt = bonus ? bonusTax(gm, bonus, clsNow, km) : { tax: 0, contribs: { total: 0 } };
    var netYearNow = slip.net * 12 + (bonus ? bonus - bt.contribs.total - bt.tax : 0);
    var taxYearNow = (slip.tax - slip.creditTotal) * 12 + bt.tax;   /* impôt net des crédits, sur l'année */
    out.payslip = slip; out.bonus = bt; out.netYearNow = netYearNow;

    /* ---- 3. Déclaration avec assimilation (ou résident) ---- */
    var spouseLU = couple && S.spouseCountry === "LU" && spouseIncome > 0;
    var spouseFR = couple && S.spouseCountry === "FR" && spouseIncome > 0;
    var spouseR = 0, spouseTaxNow = 0;
    if (spouseLU) {
      /* le conjoint travaille aussi au Luxembourg : brut mensuel = revenu saisi */
      var sgm = spouseIncome / 12, sslip = payslip(sgm, resident ? 2 : 1, km, {});
      spouseTaxNow = (sslip.tax - sslip.creditTotal) * 12;
      spouseR = Math.max(0, sgm * 12 - contribs(sgm).deductible * 12 - P.lu.forfaits.fo - fdAnnual(km) - P.lu.forfaits.ds);
      taxYearNow += spouseTaxNow;
    }
    var aep = couple && (spouseLU || spouseFR) ? P.lu.ded.aep : 0;
    /* déductions sans changer son épargne : primes d'assurance déjà payées (RC auto, mutuelle, vie) */
    var insurance = P.lu.ded.insurance * n;
    /* déductions qui demandent de placer : épargne-pension, épargne-logement */
    var homeSavings = (S.age <= P.lu.ded.homeSavingsYoungMaxAge ? P.lu.ded.homeSavingsYoung : P.lu.ded.homeSavingsOld) * n;
    var savingsPlaced = P.lu.ded.pensionSavings * adults + homeSavings;
    /* intérêts hypothécaires (propriétaire avec crédit) */
    var mortgage = 0, mortgageCap = 0;
    if (S.home === "owner" && +S.mortgageInterest > 0) {
      var cap = P.lu.ded.mortgage[P.lu.ded.mortgage.length - 1].cap;
      for (var i = 0; i < P.lu.ded.mortgage.length; i++) if ((+S.homeYear || 0) >= P.lu.ded.mortgage[i].from) { cap = P.lu.ded.mortgage[i].cap; break; }
      mortgageCap = isFinite(cap) ? cap * n : null;   /* null = sans plafond (mise à disposition après 2023) */
      mortgage = mortgageCap === null ? +S.mortgageInterest : Math.min(+S.mortgageInterest, mortgageCap);
    }
    function declare(extraSpecial, withMortgage) {
      var a = { grossMonthly: gm, bonus: bonus, km: km, cls: clsOpt, cim: cimNow,
                specialExpenses: insurance + extraSpecial, mortgageInterest: withMortgage ? mortgage : 0, aep: aep };
      if (spouseFR) a.other = spouseIncome;                /* taux global sur le revenu mondial du ménage */
      if (spouseLU) {
        /* imposition collective des deux salaires luxembourgeois */
        var selfR = assessment(Object.assign({}, a, { aep: 0, mortgageInterest: 0, specialExpenses: 0 })).R;
        var R = Math.max(0, selfR + spouseR - Math.max(0, (insurance + extraSpecial) - P.lu.forfaits.ds) - (withMortgage ? mortgage : 0) - aep);
        var tax = taxFull(R, 2);
        var credits = cisAnnual(a.grossMonthly * 12 + bonus) + cico2Annual(a.grossMonthly * 12 + bonus) + cissmMonthly(gm) * 12
                    + cisAnnual(spouseIncome) + cico2Annual(spouseIncome) + cissmMonthly(spouseIncome / 12) * 12;
        return { R: R, tax: tax, credits: credits, due: tax - credits };
      }
      return assessment(a);
    }
    var decl0 = declare(0, false);            /* déclaration seule (classe 2 / taux global, assurances, AEP) */
    var declM = declare(0, true);             /* + intérêts hypothécaires */
    var declS = declare(savingsPlaced, true); /* + épargne-pension et épargne-logement */
    var gainDeclare = Math.max(0, taxYearNow - decl0.due);
    var gainMortgage = Math.max(0, decl0.due - declM.due);
    var gainSavings = Math.max(0, declM.due - declS.due);
    var worthDeclaring = taxYearNow - declS.due > 0;
    out.tax = {
      clsNow: clsNow, clsOpt: clsOpt, taxYearNow: taxYearNow, declareOnly: decl0, withMortgage: declM, withSavings: declS,
      gainDeclare: gainDeclare, gainMortgage: gainMortgage, gainSavings: gainSavings, gainTotal: Math.max(0, taxYearNow - declS.due),
      worthDeclaring: worthDeclaring, savingsPlaced: savingsPlaced, insurance: insurance, aep: aep, mortgage: mortgage, mortgageCap: mortgageCap,
      netYearOptimised: netYearNow + Math.max(0, taxYearNow - declS.due)
    };

    /* ---- 4. Retraite ---- */
    var age = clamp(+S.age || 0, 16, 80), startYear = P.year + Math.max(0, P.lu.pension.legalAge - age);
    var birthYear = P.year - age;
    var yearsLeft = Math.max(0, P.lu.pension.legalAge - age);
    var cotisAnnual = gm * (S.months === 13 ? 13 : 12);
    var luNow = luPension({ startYear: startYear, ageAtStart: P.lu.pension.legalAge, yearsLU: +S.yearsLU, yearsFR: +S.yearsFR, avgAnnual: cotisAnnual });
    var luAt65 = luPension({ startYear: startYear, ageAtStart: P.lu.pension.legalAge, yearsLU: +S.yearsLU + yearsLeft, yearsFR: +S.yearsFR, avgAnnual: cotisAnnual });
    var frNow = frPension({ yearsFR: +S.yearsFR, yearsLU: +S.yearsLU, avgMonthlyFR: +S.avgFR, birthYear: birthYear, ageAtStart: P.lu.pension.legalAge, otherPensions: luNow.monthly });
    var frAt65 = frPension({ yearsFR: +S.yearsFR, yearsLU: +S.yearsLU + yearsLeft, avgMonthlyFR: +S.avgFR, birthYear: birthYear, ageAtStart: P.lu.pension.legalAge, otherPensions: luAt65.monthly });
    out.pension = { startYear: startYear, yearsLeft: yearsLeft, luNow: luNow, luAt65: luAt65, frNow: frNow, frAt65: frAt65,
                    totalNow: luNow.monthly + frNow.total, totalAt65: luAt65.monthly + frAt65.total };

    /* ---- 5. Logement : règle HCSF, 35 % des revenus nets avant impôt du foyer (13e mois compris),
            conjoint inclus, moins la mensualité d'un crédit en cours ---- */
    var selfIncome = (gm - contribs(gm).total) + (bonus ? (bonus - contribs(bonus).total) / 12 : 0);
    var spouseHcsf = spouseFR ? spouseIncome / 12 : (spouseLU ? spouseIncome / 12 - contribs(spouseIncome / 12).total : 0);
    var charges = S.home === "owner" ? Math.max(0, +S.loanPayment || 0) : 0;
    out.credit = capacity(selfIncome + spouseHcsf, { charges: charges });
    out.credit.income = { self: selfIncome, spouse: spouseHcsf, total: selfIncome + spouseHcsf, charges: charges };
    return out;
  }

  return {
    P: P, T1: T1, T1a: T1a, T2: T2, taxFull: taxFull, cisAnnual: cisAnnual, cico2Annual: cico2Annual,
    cissmMonthly: cissmMonthly, cicMonthly: cicMonthly, cimAnnual: cimAnnual, fdAnnual: fdAnnual, contribs: contribs,
    payslip: payslip, bonusTax: bonusTax, tauxGlobal: tauxGlobal, employerCost: employerCost, assessment: assessment, luPension: luPension, frPension: frPension,
    capacity: capacity, diagnostic: diagnostic
  };
});

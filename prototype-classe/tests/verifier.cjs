/*
 * Vérifications automatiques du prototype « La classe ».
 *
 * Prérequis : Playwright (npm i -D playwright) et un serveur local :
 *   python3 -m http.server 8765   (depuis prototype-classe/)
 * Puis :
 *   node tests/verifier.cjs [url] [dossier-captures]
 */
const { chromium } = require("playwright");
const fs = require("fs");

const URL = process.argv[2] || "http://localhost:8765/";
const SHOTS = process.argv[3] || null;
const INED =
  "https://www.ined.fr/fr/publications/editions/population-et-societes/violences-sexuelles-durant-enfance-et-adolescence";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || "" });
  console.log((ok ? "✔" : "✘") + " " + name + (detail ? " — " + detail : ""));
}

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts || {});
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
  return { ctx, page, errors, failed };
}

const wait = (p, ms) => p.waitForTimeout(ms);
const state = (p) => p.$eval("#scene", (s) => s.getAttribute("data-state"));
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: SHOTS + "/" + name + ".png" }); };

(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();

  /* ---------------- Ordinateur ---------------- */
  {
    const { ctx, page, errors, failed } = await newPage(browser, { viewport: { width: 1440, height: 900 } });
    await page.goto(URL);

    // Apparition progressive : juste après le chargement, les rangées du
    // fond sont plus avancées que celles de l'avant.
    await wait(page, 350);
    const early = await page.$$eval(".table", (ts) => ts.map((t) => Number(getComputedStyle(t).opacity)));
    check(
      "Apparition progressive (rangées décalées)",
      early[0] > early[early.length - 1] && early[early.length - 1] < 1,
      "opacité 1re table = " + early[0].toFixed(2) + ", dernière = " + early[early.length - 1].toFixed(2)
    );
    const delays = await page.$$eval(".table", (ts) => ts.map((t) => getComputedStyle(t).transitionDelay.split(",")[0]));
    check("Décalage d'animation croissant", new Set(delays).size === delays.length, delays.join(" "));
    await wait(page, 1800);
    const late = await page.$$eval(".table", (ts) => ts.map((t) => Number(getComputedStyle(t).opacity)));
    check("Scène entièrement visible après ~2 s", late.every((o) => o === 1));
    await shot(page, "1-ordinateur-etape1");

    // Comptage
    const count = await page.evaluate(() => {
      const seats = new Set([...document.querySelectorAll(".student[data-seat]")].map((g) => g.dataset.seat));
      return {
        seats: seats.size,
        bodies: document.querySelectorAll(".s-body").length,
        heads: document.querySelectorAll("circle.s-head").length,
        tables: document.querySelectorAll(".table").length,
        rows: document.querySelectorAll(".row").length,
        legend: document.getElementById("legend-total").textContent
      };
    });
    check(
      "Comptage : 22 silhouettes, 11 tables doubles, 4 rangées",
      count.seats === 22 && count.bodies === 22 && count.heads === 22 && count.tables === 11 && count.rows === 4,
      JSON.stringify(count)
    );
    check("Légende « 22 places »", count.legend === "22 places");

    // Étape 1 : pas encore de mise en évidence
    check("Étape 1 : aucune place mise en évidence", (await state(page)) === "1" && (await page.$eval("#seat-target", (b) => b.hidden)));

    // Défilement natif → étape 2 (IntersectionObserver)
    await page.mouse.move(300, 450);
    for (let i = 0; i < 12 && (await state(page)) === "1"; i++) {
      await page.mouse.wheel(0, 250);
      await wait(page, 120);
    }
    check("Défilement à la molette → étape 2", (await state(page)) === "2");
    await wait(page, 2200);

    const hl = await page.evaluate(() => {
      const groups = [...document.querySelectorAll(".student.is-highlighted")];
      const body = document.querySelector(".student.is-highlighted .s-body");
      const other = document.querySelector('.student:not(.is-highlighted) .s-body');
      const outline = document.querySelector(".student.is-highlighted .s-outline");
      return {
        n: groups.length,
        seats: [...new Set(groups.map((g) => g.dataset.seat))],
        expected: String(window.STOP_INCESTE_DATA.scenes.classe.placeMiseEnEvidence),
        fill: getComputedStyle(body).fill,
        otherFill: getComputedStyle(other).fill,
        outline: getComputedStyle(outline).strokeOpacity
      };
    });
    check(
      "Mise en évidence d'une seule place, la bonne",
      hl.seats.length === 1 && hl.seats[0] === hl.expected && hl.n === 3,
      "place " + hl.seats.join(",") + " (attendue " + hl.expected + ")"
    );
    check(
      "Couleur d'accent + contour clair, autres places atténuées",
      hl.fill === "rgb(210, 70, 42)" && hl.outline === "1" && hl.otherFill === "rgb(169, 177, 187)",
      "accent " + hl.fill + ", contour " + hl.outline + ", autres " + hl.otherFill
    );
    const texts = await page.evaluate(() => ({
      stat: document.getElementById("stat-phrase").textContent,
      prop: document.getElementById("stat-proportion").textContent,
      href: document.getElementById("source-link").href,
      opacity: getComputedStyle(document.getElementById("stat-proportion")).opacity
    }));
    check("Texte de la statistique (4,6 %)", /4,6 % des femmes interrogées déclarent avoir subi des violences incestueuses avant l’âge de 18 ans/.test(texts.stat));
    check("Texte « environ 1 femme interrogée sur 22 »", texts.prop === "Cela correspond à environ 1 femme interrogée sur 22." && texts.opacity === "1");
    check("Lien source vers l'Ined (étape 2)", texts.href === INED);
    await shot(page, "2-ordinateur-etape2");

    // Boutons
    await page.click("#next-step");
    await wait(page, 1200);
    check("Bouton Suivant → étape 3", (await state(page)) === "3" && (await page.textContent("#step-status")) === "Étape 3 sur 3");
    check("Suivant désactivé à la dernière étape", (await page.getAttribute("#next-step", "aria-disabled")) === "true");
    await page.click("#prev-step");
    await wait(page, 1200);
    check("Bouton Précédent → étape 2", (await state(page)) === "2");
    await page.click("#next-step");
    await wait(page, 1200);
    await shot(page, "3-ordinateur-etape3");

    // Panneau : clic sur la silhouette
    await page.click("#seat-target");
    await wait(page, 400);
    const panel = await page.evaluate(() => {
      const d = document.getElementById("panel");
      return {
        open: d.open,
        modal: d.matches(":modal"),
        focusInside: d.contains(document.activeElement),
        headings: [...d.querySelectorAll("h3")].map((h) => h.textContent),
        link: (d.querySelector("#panel-source-link") || {}).href
      };
    });
    check("Clic sur la silhouette → panneau ouvert (modal, focus dedans)", panel.open && panel.modal && panel.focusInside);
    const needed = ["Ce que mesure ce chiffre", "Population concernée", "Période concernée", "Limites d’interprétation", "Source"];
    check("Panneau : mesure, population, période, limites, source", needed.every((h) => panel.headings.includes(h)), panel.headings.join(" | "));
    check("Panneau : lien vers la publication originale", panel.link === INED);
    await shot(page, "4-ordinateur-panneau");
    await page.keyboard.press("Escape");
    await wait(page, 200);
    const afterEsc = await page.evaluate(() => ({ open: document.getElementById("panel").open, focus: document.activeElement.id }));
    check("Échap ferme le panneau et rend le focus à la silhouette", !afterEsc.open && afterEsc.focus === "seat-target", "focus sur #" + afterEsc.focus);

    // Clavier : bouton de l'étape 3, Entrée, puis « Revenir à la classe »
    await page.focus("#open-panel");
    await page.keyboard.press("Enter");
    await wait(page, 300);
    check("Clavier : Entrée sur « Comprendre ce chiffre » ouvre le panneau", await page.$eval("#panel", (d) => d.open));
    // Le focus reste piégé dans le panneau
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
    check("Focus maintenu dans le panneau (Tab)", await page.evaluate(() => document.getElementById("panel").contains(document.activeElement)));
    await page.click("#panel-close");
    await wait(page, 200);
    const afterClose = await page.evaluate(() => ({ open: document.getElementById("panel").open, focus: document.activeElement.id }));
    check("« Revenir à la classe » ferme et rend le focus au bouton", !afterClose.open && afterClose.focus === "open-panel", "focus sur #" + afterClose.focus);

    // Clavier sur la silhouette
    await page.focus("#seat-target");
    await page.keyboard.press("Space");
    await wait(page, 300);
    check("Clavier : Espace sur la silhouette ouvre le panneau", await page.$eval("#panel", (d) => d.open));
    await page.click("#panel-close-x");
    await wait(page, 200);
    check("Bouton ✕ ferme le panneau", !(await page.$eval("#panel", (d) => d.open)));

    // Retour en arrière par défilement : la mise en évidence disparaît
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(page, 600);
    check("Défilement vers le haut → retour à l'étape 1", (await state(page)) === "1");

    check("Aucune erreur JavaScript (ordinateur)", errors.length === 0, errors.join(" | "));
    check("Aucune ressource manquante (ordinateur)", failed.length === 0, failed.join(" | "));
    await ctx.close();
  }

  /* ---------------- Mobile ---------------- */
  {
    const { ctx, page, errors, failed } = await newPage(browser, {
      viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2
    });
    await page.goto(URL);
    await wait(page, 2000);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
      vb: document.querySelector(".classroom").getAttribute("viewBox"),
      svgW: document.querySelector(".classroom").getBoundingClientRect().width
    }));
    check("Mobile : pas de débordement horizontal", m.sw <= m.iw, "scrollWidth " + m.sw + " / " + m.iw);
    check("Mobile : cadrage resserré sur les pupitres", m.vb === "40 115 920 580" && m.svgW <= 375, "viewBox " + m.vb + ", largeur " + Math.round(m.svgW));
    await shot(page, "5-mobile-etape1");
    await page.tap("#next-step");
    await wait(page, 2400);
    check("Mobile : bouton Suivant → étape 2", (await state(page)) === "2");
    const card = await page.evaluate(() => {
      const r = document.getElementById("stat-phrase").getBoundingClientRect();
      const g = document.querySelector(".story__graphic").getBoundingClientRect();
      return { top: r.top, gBottom: g.bottom, h: innerHeight };
    });
    check("Mobile : texte de l'étape 2 visible sous l'illustration", card.top >= card.gBottom - 1 && card.top < card.h, JSON.stringify(card));
    await shot(page, "6-mobile-etape2");
    const tb = await page.$eval("#seat-target", (b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; });
    check("Mobile : cible tactile ≥ 44 px", tb.w >= 44 && tb.h >= 44, Math.round(tb.w) + "×" + Math.round(tb.h));
    await page.tap("#seat-target");
    await wait(page, 500);
    const sheet = await page.evaluate(() => {
      const r = document.getElementById("panel").getBoundingClientRect();
      return { open: document.getElementById("panel").open, w: r.width, bottom: r.bottom, h: innerHeight };
    });
    check("Mobile : toucher la silhouette ouvre le panneau (feuille en bas)", sheet.open && Math.abs(sheet.bottom - sheet.h) < 2 && sheet.w <= 375, JSON.stringify(sheet));
    await shot(page, "7-mobile-panneau");
    await page.tap("#panel-close");
    await wait(page, 200);
    check("Mobile : fermeture du panneau", !(await page.$eval("#panel", (d) => d.open)));
    check("Aucune erreur JavaScript (mobile)", errors.length === 0, errors.join(" | "));
    check("Aucune ressource manquante (mobile)", failed.length === 0, failed.join(" | "));
    await ctx.close();
  }

  /* ---------------- Mouvement réduit ---------------- */
  {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
    await page.goto(URL);
    await wait(page, 80);
    const r = await page.evaluate(() => ({
      motion: document.documentElement.classList.contains("js-motion"),
      tables: [...document.querySelectorAll(".table")].every((t) => getComputedStyle(t).opacity === "1"),
      reveals: [...document.querySelectorAll(".reveal")].every((t) => getComputedStyle(t).opacity === "1"),
      statText: document.getElementById("stat-phrase").textContent.length > 50
    }));
    check("Mouvement réduit : scène affichée immédiatement, sans animation", !r.motion && r.tables);
    check("Mouvement réduit : tous les textes visibles sans attendre", r.reveals && r.statText);
    await page.click("#next-step");
    await wait(page, 150);
    const hl = await page.$eval(".student.is-highlighted .s-body", (b) => getComputedStyle(b).fill);
    check("Mouvement réduit : mise en évidence immédiate", (await state(page)) === "2" && hl === "rgb(210, 70, 42)", hl);
    check("Aucune erreur JavaScript (mouvement réduit)", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  /* ---------------- Garde-fou statistique ---------------- */
  {
    // On simule l'erreur à éviter : représenter 1,2 % (≈ 1 sur 83) avec 22 places.
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.route("**/js/data.js", async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace('statistiqueId: "femmes"', 'statistiqueId: "hommes"');
      await route.fulfill({ response: res, body });
    });
    await page.goto(URL);
    await wait(page, 300);
    await page.click("#next-step");
    await wait(page, 300);
    const g = await page.evaluate(() => ({
      highlighted: document.querySelectorAll(".student.is-highlighted").length,
      target: !!document.getElementById("seat-target")
    }));
    check(
      "Garde-fou : 1,2 % refusé sur une classe de 22 places",
      g.highlighted === 0 && !g.target && (await state(page)) === "1" && errors.some((e) => /1 sur 83/.test(e)),
      errors[0] || ""
    );
    await ctx.close();
  }

  /* ---------------- Sans JavaScript ---------------- */
  {
    const { ctx, page } = await newPage(browser, { viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
    await page.goto(URL);
    const t = await page.evaluate(() => ({
      h1: document.querySelector("h1").textContent,
      stat: getComputedStyle(document.getElementById("stat-phrase")).opacity,
      link: document.getElementById("source-link").href
    }));
    check("Sans JavaScript : titre, statistique et source restent lisibles", t.h1 === "Imaginez une classe." && t.stat === "1" && t.link === INED);
    await ctx.close();
  }

  await browser.close();
  const failedChecks = results.filter((r) => !r.ok);
  console.log("\n" + (results.length - failedChecks.length) + "/" + results.length + " vérifications réussies.");
  process.exit(failedChecks.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});

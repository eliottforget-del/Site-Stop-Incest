/*
 * Orchestration de la scène « La classe ».
 * ----------------------------------------
 * - lit les données (data.js) et contrôle leur cohérence avec la scène ;
 * - dessine la salle (classroom.js) ;
 * - pilote les trois temps via IntersectionObserver ET des boutons ;
 * - gère le panneau explicatif (<dialog>) et le focus.
 *
 * Tout le texte essentiel est présent dans le HTML : les animations ne sont
 * que décoratives et sont désactivées avec prefers-reduced-motion.
 */
(function () {
  "use strict";

  var DATA = window.STOP_INCESTE_DATA;
  var Classroom = window.StopInceste && window.StopInceste.Classroom;
  if (!DATA || !Classroom) {
    return;
  }

  var root = document.documentElement;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var compactMQ = window.matchMedia("(max-width: 820px)");

  var sceneCfg = DATA.scenes.classe;
  var stat = DATA.statistics[sceneCfg.statistiqueId];
  var source = DATA.sources[stat.sourceId];

  var scene = document.getElementById("scene");
  var canvas = document.getElementById("scene-canvas");
  var graphic = document.querySelector(".story__graphic");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var status = document.getElementById("step-status");
  var prevBtn = document.getElementById("prev-step");
  var nextBtn = document.getElementById("next-step");
  var openBtn = document.getElementById("open-panel");
  var panel = document.getElementById("panel");

  var TOTAL = steps.length;
  var current = 0;
  var lastTrigger = null;

  /* ---------------------------------------------------------------- */
  /* Contrôle de cohérence statistique                                  */
  /* ---------------------------------------------------------------- */

  // Une place sur N n'a de sens que si N ≈ 100 / valeur.
  // Ce garde-fou empêche, par exemple, de représenter 1,2 % (≈ 1 sur 83)
  // avec une classe de 22 places.
  var seatCount = Classroom.countSeats(sceneCfg);
  var expectedN = Math.round(100 / stat.valeur);
  var proportionOk =
    stat.representation.numerateur === 1 &&
    stat.representation.denominateur === seatCount &&
    expectedN === seatCount;

  if (!proportionOk) {
    console.error(
      "[La classe] Proportion incohérente : " + stat.valeur + " % ≈ 1 sur " +
      expectedN + ", mais la scène compte " + seatCount + " places. " +
      "La mise en évidence est désactivée."
    );
  }

  /* ---------------------------------------------------------------- */
  /* Mouvement                                                           */
  /* ---------------------------------------------------------------- */

  function motionAllowed() {
    return !reduceMQ.matches;
  }

  function applyMotionPreference() {
    root.classList.toggle("js-motion", motionAllowed());
  }

  applyMotionPreference();
  onChange(reduceMQ, applyMotionPreference);

  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* ---------------------------------------------------------------- */
  /* Textes issus des données                                            */
  /* ---------------------------------------------------------------- */

  function fillWithEmphasis(node, text, emphasis) {
    if (!node) return;
    node.textContent = "";
    var i = emphasis ? text.indexOf(emphasis) : -1;
    if (i < 0) {
      node.textContent = text;
      return;
    }
    node.appendChild(document.createTextNode(text.slice(0, i)));
    var strong = document.createElement("strong");
    strong.textContent = emphasis;
    node.appendChild(strong);
    node.appendChild(document.createTextNode(text.slice(i + emphasis.length)));
  }

  fillWithEmphasis(document.getElementById("stat-phrase"), stat.phrase, stat.libelleCourt);
  fillWithEmphasis(document.getElementById("stat-proportion"), stat.phraseProportion, stat.proportionMiseEnValeur);
  var sourceLink = document.getElementById("source-link");
  if (sourceLink) sourceLink.href = source.url;
  var legendTotal = document.getElementById("legend-total");
  if (legendTotal) legendTotal.textContent = seatCount + " places";

  /* ---------------------------------------------------------------- */
  /* Dessin                                                              */
  /* ---------------------------------------------------------------- */

  var drawing = Classroom.render(document.getElementById("classroom"), sceneCfg, {
    title: "Une salle de classe de " + seatCount + " places",
    description:
      "Illustration : une salle de classe vue depuis le bureau de l’enseignant·e, avec " +
      seatCount / 2 + " tables doubles réparties en " + sceneCfg.rangees.length +
      " rangées, soit " + seatCount + " places occupées par des silhouettes d’élèves. " +
      "À partir de l’étape 2, une place est colorée pour représenter une proportion d’environ 1 sur " +
      seatCount + ". Elle ne désigne aucune personne réelle."
  });

  var highlighted = proportionOk ? sceneCfg.placeMiseEnEvidence : null;
  if (highlighted !== null) {
    drawing.svg
      .querySelectorAll('.student[data-seat="' + highlighted + '"]')
      .forEach(function (g) { g.classList.add("is-highlighted"); });
  }

  // Commande HTML superposée à la place (plus robuste qu'un élément SVG
  // focalisable pour le clavier, le toucher et les lecteurs d'écran).
  var target = null;
  var seatInfo = drawing.seats.filter(function (s) { return s.index === highlighted; })[0];
  if (seatInfo) {
    target = document.createElement("button");
    target.type = "button";
    target.className = "seat-target";
    target.id = "seat-target";
    target.hidden = true;
    target.setAttribute("aria-haspopup", "dialog");
    target.setAttribute("aria-controls", "panel");
    target.setAttribute(
      "aria-label",
      "Place mise en évidence, 1 place sur " + seatCount + " : ouvrir les explications sur ce chiffre"
    );
    var hint = document.createElement("span");
    hint.className = "seat-target__hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "Comprendre ce chiffre";
    target.appendChild(hint);
    canvas.appendChild(target);
    target.addEventListener("click", openPanel);
  }

  function applyViewBox() {
    var vb = compactMQ.matches ? drawing.viewBoxes.compact : drawing.viewBoxes.large;
    drawing.svg.setAttribute("viewBox", [vb.x, vb.y, vb.w, vb.h].join(" "));
    canvas.style.setProperty("--vb-ratio", String(vb.w / vb.h));
    if (target && seatInfo) {
      var b = seatInfo.box;
      target.style.left = ((b.x + b.w / 2 - vb.x) / vb.w) * 100 + "%";
      target.style.top = ((b.y + b.h / 2 - vb.y) / vb.h) * 100 + "%";
      target.style.width = (b.w / vb.w) * 100 + "%";
      target.style.height = (b.h / vb.h) * 100 + "%";
    }
  }

  applyViewBox();
  onChange(compactMQ, function () {
    applyViewBox();
    setupObserver();
  });

  /* ---------------------------------------------------------------- */
  /* États                                                               */
  /* ---------------------------------------------------------------- */

  function build() {
    if (scene.classList.contains("is-built")) return;
    // Deux images pour que l'état initial soit peint avant la transition.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scene.classList.add("is-built");
      });
    });
  }

  function setStep(n) {
    n = Math.max(1, Math.min(TOTAL, n));
    if (n === current) return;
    current = n;

    scene.setAttribute("data-state", String(proportionOk ? n : 1));
    if (n > 1) scene.classList.add("is-built"); // passer l'animation d'entrée

    steps.forEach(function (step, i) {
      var active = i === n - 1;
      step.classList.toggle("is-active", active);
      if (i <= n - 1) step.classList.add("is-seen");
    });

    if (target) target.hidden = n < 2;
    status.textContent = "Étape " + n + " sur " + TOTAL;
    prevBtn.setAttribute("aria-disabled", String(n === 1));
    nextBtn.setAttribute("aria-disabled", String(n === TOTAL));
  }

  function scrollToStep(n) {
    var step = steps[n - 1];
    var behavior = motionAllowed() ? "smooth" : "auto";
    var rect = step.getBoundingClientRect();
    var top;
    if (compactMQ.matches) {
      // Sur mobile, l'illustration reste collée en haut : on place la
      // carte juste en dessous.
      top = window.pageYOffset + rect.top - graphic.offsetHeight - 8;
    } else {
      var card = step.querySelector(".step__card");
      var cr = card.getBoundingClientRect();
      top = window.pageYOffset + cr.top - (window.innerHeight - cr.height) / 2;
    }
    window.scrollTo({ top: Math.max(0, top), behavior: behavior });
  }

  function goTo(n) {
    n = Math.max(1, Math.min(TOTAL, n));
    ignoreObserverUntil = Date.now() + (motionAllowed() ? 900 : 100);
    setStep(n);
    scrollToStep(n);
    if (n === 2) {
      // Annonce du contenu de l'étape aux technologies d'assistance.
      steps[1].focus({ preventScroll: true });
    }
  }

  prevBtn.addEventListener("click", function () {
    if (current > 1) goTo(current - 1);
  });
  nextBtn.addEventListener("click", function () {
    if (current < TOTAL) goTo(current + 1);
  });

  /* ---------------------------------------------------------------- */
  /* Défilement : IntersectionObserver                                   */
  /* ---------------------------------------------------------------- */

  var observer = null;
  var ignoreObserverUntil = 0;

  function setupObserver() {
    if (!("IntersectionObserver" in window)) {
      // Repli : tout afficher.
      steps.forEach(function (s) { s.classList.add("is-seen"); });
      setStep(TOTAL);
      return;
    }
    if (observer) observer.disconnect();
    var margin = compactMQ.matches ? "-58% 0px -36% 0px" : "-45% 0px -45% 0px";
    observer = new IntersectionObserver(onIntersect, { rootMargin: margin, threshold: 0 });
    steps.forEach(function (s) { observer.observe(s); });
  }

  function onIntersect(entries) {
    if (Date.now() < ignoreObserverUntil) return;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setStep(Number(entry.target.getAttribute("data-step")));
      }
    });
  }

  // Fin d'un défilement programmé : resynchroniser avec la position réelle.
  window.addEventListener("scroll", function () {
    if (Date.now() >= ignoreObserverUntil) return;
    clearTimeout(window.__classeScrollEnd);
    window.__classeScrollEnd = setTimeout(function () {
      ignoreObserverUntil = 0;
    }, 150);
  }, { passive: true });

  /* ---------------------------------------------------------------- */
  /* Panneau explicatif                                                  */
  /* ---------------------------------------------------------------- */

  function h(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function section(body, title) {
    body.appendChild(h("h3", null, title));
  }

  function pending(label) {
    return h("span", { class: "panel__pending" }, label + " : " + DATA.verificationLabels["a-confirmer"].toLowerCase() + ".");
  }

  function buildPanel() {
    var body = document.getElementById("panel-body");
    body.textContent = "";

    var key = h("p", { class: "panel__key" });
    var s1 = h("strong", null, String(stat.valeur).replace(".", ",") + "\u00a0%");
    key.appendChild(s1);
    key.appendChild(document.createTextNode(" des femmes interrogées, soit environ "));
    key.appendChild(h("strong", null, "1 sur " + stat.representation.denominateur));
    key.appendChild(document.createTextNode("."));
    body.appendChild(key);

    body.appendChild(h(
      "p",
      { class: "panel__reminder" },
      "La place colorée n’est pas une personne : c’est une unité de mesure, choisie arbitrairement, pour rendre visible une proportion."
    ));

    section(body, "Ce que mesure ce chiffre");
    body.appendChild(h("p", null, stat.mesure));

    section(body, "Population concernée");
    var pop = h("p", null, stat.population + " " + source.enquete.description);
    body.appendChild(pop);
    var details = h("p");
    details.appendChild(document.createTextNode("Année de collecte : " + source.enquete.anneeCollecte + "."));
    if (!source.enquete.trancheAge) details.appendChild(pending("Tranche d’âge"));
    if (!source.enquete.tailleEchantillon) details.appendChild(pending("Taille de l’échantillon"));
    body.appendChild(details);

    section(body, "Période concernée");
    body.appendChild(h("p", null, stat.periode));

    section(body, "Limites d’interprétation");
    var ul = h("ul");
    DATA.limites.forEach(function (l) { ul.appendChild(h("li", null, l)); });
    body.appendChild(ul);

    section(body, "Source");
    var cite = h("p", { class: "panel__citation" });
    cite.appendChild(document.createTextNode(source.auteurs.join(", ") + ", « " + source.titre + " », "));
    cite.appendChild(h("cite", null, source.revue));
    cite.appendChild(document.createTextNode(" n°\u00a0" + source.numero + ", " + source.editeur + ", " + source.date + ". DOI : " + source.doi + "."));
    body.appendChild(cite);
    var linkP = h("p");
    var a = h("a", { href: source.url, target: "_blank", rel: "noopener", id: "panel-source-link" }, "Lire la publication originale sur le site de l’Ined");
    a.appendChild(h("span", { class: "visually-hidden" }, " (s’ouvre dans un nouvel onglet)"));
    linkP.appendChild(a);
    body.appendChild(linkP);

    section(body, "Statut de ces informations");
    body.appendChild(h(
      "p",
      { class: "panel__reminder" },
      "Prototype. Chiffres : " + DATA.verificationLabels[stat.verification].toLowerCase() +
      ". Les textes explicatifs sont une première rédaction à faire relire avant toute publication."
    ));
  }

  buildPanel();

  function openPanel(e) {
    lastTrigger = (e && e.currentTarget) || document.activeElement;
    if (typeof panel.showModal === "function") {
      panel.showModal();
    } else {
      panel.setAttribute("open", "");
    }
    var title = document.getElementById("panel-title");
    title.setAttribute("tabindex", "-1");
    title.focus();
    panel.querySelector(".panel__body").scrollTop = 0;
  }

  function closePanel() {
    if (typeof panel.close === "function" && panel.open) {
      panel.close();
    } else {
      panel.removeAttribute("open");
      restoreFocus();
    }
  }

  function restoreFocus() {
    var t = lastTrigger;
    if (t && document.contains(t) && !t.hidden && typeof t.focus === "function") {
      t.focus();
    } else if (openBtn) {
      openBtn.focus();
    }
  }

  panel.addEventListener("close", restoreFocus);
  panel.addEventListener("click", function (e) {
    if (e.target === panel) closePanel(); // clic sur le fond
  });
  document.getElementById("panel-close").addEventListener("click", closePanel);
  document.getElementById("panel-close-x").addEventListener("click", closePanel);
  if (openBtn) openBtn.addEventListener("click", openPanel);

  /* ---------------------------------------------------------------- */
  /* Démarrage                                                           */
  /* ---------------------------------------------------------------- */

  setStep(1);
  build();
  setupObserver();

  // Petite interface de test / d'intégration.
  window.StopInceste.scene = {
    getStep: function () { return current; },
    goTo: goTo,
    openPanel: openPanel,
    closePanel: closePanel,
    seatCount: seatCount,
    highlightedSeat: highlighted
  };
})();

/* ============================================================================
   Stop Inceste — comportements. Sans dépendance.
   Rien ici n'est nécessaire à la lecture : sans script, sans animation, ou si
   l'on demande moins de mouvement, la page reste entière et navigable.
   ========================================================================== */
(function () {
  'use strict';
  window.__site = true;   // confirme au garde-fou que le script tourne
  var doc = document, corps = doc.body;
  var sobre = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pointeurFin = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- En-tête et menu ---------- */
  var nav = doc.getElementById('nav');
  if (nav) {
    var bouton = nav.querySelector('.nav__bouton');
    bouton.addEventListener('click', function () {
      var ouvert = nav.toggleAttribute('data-ouvert');
      bouton.setAttribute('aria-expanded', String(ouvert));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.removeAttribute('data-ouvert'); bouton.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- Curseur ---------- */
  if (pointeurFin && !sobre) {
    var rond = doc.querySelector('.curseur'), noyau = doc.querySelector('.curseur__noyau');
    var vx = innerWidth / 2, vy = innerHeight / 2, x = vx, y = vy;
    addEventListener('pointermove', function (e) {
      vx = e.clientX; vy = e.clientY;
      corps.setAttribute('data-pointeur', '');
      corps.toggleAttribute('data-survol', !!e.target.closest('a, button, .defile__carte, .fiche'));
    }, { passive: true });
    addEventListener('pointerleave', function () { corps.removeAttribute('data-pointeur'); });
    (function suit() {
      x += (vx - x) * 0.16; y += (vy - y) * 0.16;
      rond.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      noyau.style.transform = 'translate(' + vx + 'px,' + vy + 'px)';
      requestAnimationFrame(suit);
    })();
  }

  /* ---------- Apparitions ----------
     Le trait sous les titres se dessine ; les schémas des fiches se remplissent. */
  var vus = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('est-vu');
      if (e.target.classList.contains('titre-trait')) e.target.style.setProperty('--avancee', '100%');
      vus.unobserve(e.target);
    });
  }, { threshold: .3 });

  if (!sobre) {
    doc.querySelectorAll('.titre-trait').forEach(function (t) {
      t.style.setProperty('--avancee', '0%');
      t.style.transition = 'none';
      requestAnimationFrame(function () {
        t.style.transition = 'mask-size .9s cubic-bezier(.3,.8,.4,1), -webkit-mask-size .9s cubic-bezier(.3,.8,.4,1)';
      });
      vus.observe(t);
    });
  }

  /* ---------- Sections liées au défilement ----------
     Un seul écouteur, calé sur l'image suivante, et qui ne calcule que pour
     les sections réellement à l'écran. */
  var pistes = [];

  doc.querySelectorAll('.defile').forEach(function (defile) {
    if (sobre) { defile.classList.add('defile--statique'); return; }
    var rail = defile.querySelector('.defile__rail');
    var course = 0;
    var mesure = function () {
      course = Math.max(0, rail.scrollWidth - innerWidth);
      defile.style.height = (innerHeight + course * 1.15) + 'px';
    };
    mesure();
    addEventListener('resize', mesure, { passive: true });
    pistes.push({ el: defile, visible: false, maj: function () {
      var r = defile.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, defile.offsetHeight - innerHeight)));
      rail.style.transform = 'translate3d(' + (-p * course).toFixed(1) + 'px,0,0)';
    }});
  });

  /* L'anatomie : la carte reste calée à gauche et pivote ; à droite, chaque
     note passe du gris au noir quand son tour arrive. */
  var anatomie = doc.querySelector('.anatomie');
  if (anatomie) {
    var carte3d = anatomie.querySelector('.carte3d');
    var plateau = anatomie.querySelector('.anatomie__plateau');
    if (sobre) {
      anatomie.classList.add('anatomie--statique');
      plateau.removeAttribute('data-face');
    } else {
      // La scène est fixée pendant toute la traversée ; la hauteur de la
      // section donne la course de la rotation.
      var mesureAnat = function () { anatomie.style.height = (innerHeight * 2.4) + 'px'; };
      mesureAnat();
      addEventListener('resize', mesureAnat, { passive: true });
      pistes.push({ el: anatomie, visible: false, maj: function () {
        var r = anatomie.getBoundingClientRect();
        var course = Math.max(1, anatomie.offsetHeight - innerHeight);
        var p = Math.min(1, Math.max(0, -r.top / course));
        var tour = p * 180;
        carte3d.style.setProperty('--tour', tour.toFixed(1) + 'deg');
        // Les repères changent au moment où la face bascule.
        plateau.setAttribute('data-face', tour < 90 ? 'recto' : 'verso');
      }});
    }
  }

  if (pistes.length) {
    var garde = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var p = pistes.filter(function (x) { return x.el === e.target; })[0];
        if (p) p.visible = e.isIntersecting;
      });
      demande();
    }, { rootMargin: '140px 0px' });
    pistes.forEach(function (p) { garde.observe(p.el); });

    var enAttente = false;
    function demande() {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(function () {
        enAttente = false;
        pistes.forEach(function (p) { if (p.visible) p.maj(); });
      });
    }
    addEventListener('scroll', demande, { passive: true });
    addEventListener('resize', demande, { passive: true });
    demande();
  }

  /* ---------- Section courante dans le menu ---------- */
  var liens = Array.prototype.slice.call(doc.querySelectorAll('.nav a[href^="#"]'))

  if (liens.length) {
    var courant = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (a) { a.toggleAttribute('aria-current', a.hash === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    liens.forEach(function (a) { var c = doc.querySelector(a.hash); if (c) courant.observe(c); });
  }
})();

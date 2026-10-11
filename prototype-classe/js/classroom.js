/*
 * Dessin SVG de la salle de classe.
 * ---------------------------------
 * Ce module ne connaît aucune statistique : il reçoit une disposition
 * (rangées de tables doubles) et dessine la salle. Il renvoie la position
 * de chaque place pour que main.js puisse y superposer des commandes HTML.
 *
 * Perspective à un point de fuite, vue légèrement plongeante depuis le
 * bureau de l'enseignant·e. Unités « monde » : x latéral, y hauteur,
 * z profondeur (z = 1 au premier rang).
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  // Paramètres de projection et de cadrage.
  var VIEW = { w: 1000, h: 700 };
  var CX = 500; // point de fuite horizontal
  var HORIZON = -180; // ligne d'horizon (hors cadre : vue plongeante)
  var CAM = 860; // hauteur de la caméra (monde)
  var ROOM_HALF = 620; // demi-largeur de la salle (monde)
  var WALL_Z = 1.95; // profondeur du mur du fond
  var ROW_Z = [1.6, 1.4, 1.2, 1.0]; // du fond vers l'avant
  var TABLE_X = [-310, 0, 310]; // centres des trois colonnes de tables
  var SEAT_HALF = 60; // une place = 120 unités de large

  // Cadrages : le mobile resserre sur les pupitres.
  var VIEWBOXES = {
    large: { x: 0, y: 0, w: 1000, h: 700 },
    compact: { x: 40, y: 115, w: 920, h: 580 }
  };

  function P(X, Y, z) {
    var s = 1 / z;
    return [CX + X * s, HORIZON + (CAM - Y) * s];
  }

  function r1(n) {
    return Math.round(n * 10) / 10;
  }

  function pt(p) {
    return r1(p[0]) + "," + r1(p[1]);
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function poly(points, attrs, parent) {
    attrs = attrs || {};
    attrs.points = points.map(pt).join(" ");
    return el("polygon", attrs, parent);
  }

  // Petit générateur pseudo-aléatoire déterministe (variantes stables).
  function variant(index, salt, modulo) {
    var n = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return Math.floor((n - Math.floor(n)) * modulo);
  }

  /* ------------------------------------------------------------------ */
  /* Architecture                                                         */
  /* ------------------------------------------------------------------ */

  function drawRoom(root) {
    var room = el("g", { class: "room", filter: "url(#trait)" }, root);

    var bl = P(-ROOM_HALF, 0, WALL_Z);
    var br = P(ROOM_HALF, 0, WALL_Z);
    var topY = -40;

    // Mur du fond
    el(
      "rect",
      {
        class: "wall-back",
        x: r1(bl[0]),
        y: topY,
        width: r1(br[0] - bl[0]),
        height: r1(bl[1] - topY)
      },
      room
    );

    // Murs latéraux : bord de l'écran au niveau du sol.
    var leftEdgeZ = ROOM_HALF / CX; // z où x = 0 à gauche
    var lf = P(-ROOM_HALF, 0, leftEdgeZ);
    var rf = P(ROOM_HALF, 0, leftEdgeZ);
    poly([[0, topY], [bl[0], topY], bl, lf], { class: "wall-side" }, room);
    poly([[VIEW.w, topY], [br[0], topY], br, rf], { class: "wall-side wall-side--right" }, room);

    // Sol
    poly([bl, br, rf, [VIEW.w, VIEW.h + 20], [0, VIEW.h + 20], lf], { class: "floor" }, room);

    // Lames du parquet (fuyantes)
    var planks = el("g", { class: "floor-lines" }, room);
    for (var X = -ROOM_HALF + 90; X < ROOM_HALF; X += 90) {
      var a = P(X, 0, WALL_Z);
      var b = P(X, 0, 0.88);
      el("line", { x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]) }, planks);
    }

    // Plinthes
    var bTop = P(-ROOM_HALF, 22, WALL_Z);
    el(
      "rect",
      {
        class: "baseboard",
        x: r1(bl[0]),
        y: r1(bTop[1]),
        width: r1(br[0] - bl[0]),
        height: r1(bl[1] - bTop[1])
      },
      room
    );
    poly([P(-ROOM_HALF, 22, WALL_Z), bl, lf, P(-ROOM_HALF, 22, leftEdgeZ)], { class: "baseboard" }, room);
    poly([P(ROOM_HALF, 22, WALL_Z), br, rf, P(ROOM_HALF, 22, leftEdgeZ)], { class: "baseboard" }, room);

    // Arêtes des murs
    el("line", { class: "edge", x1: r1(bl[0]), y1: topY, x2: r1(bl[0]), y2: r1(bl[1]) }, room);
    el("line", { class: "edge", x1: r1(br[0]), y1: topY, x2: r1(br[0]), y2: r1(br[1]) }, room);
    el("line", { class: "edge", x1: r1(bl[0]), y1: r1(bl[1]), x2: r1(br[0]), y2: r1(br[1]) }, room);
    el("line", { class: "edge", x1: r1(bl[0]), y1: r1(bl[1]), x2: r1(lf[0]), y2: r1(lf[1]) }, room);
    el("line", { class: "edge", x1: r1(br[0]), y1: r1(br[1]), x2: r1(rf[0]), y2: r1(rf[1]) }, room);

    // Fenêtre sur le mur de gauche + lumière au sol
    var w0 = 1.32, w1 = 1.8, wy0 = 300, wy1 = 560;
    poly(
      [P(-ROOM_HALF, wy0, w0), P(-ROOM_HALF, wy1, w0), P(-ROOM_HALF, wy1, w1), P(-ROOM_HALF, wy0, w1)],
      { class: "window" },
      room
    );
    var wm = (w0 + w1) / 2;
    el("line", lineAttrs(P(-ROOM_HALF, wy0, wm), P(-ROOM_HALF, wy1, wm), "window-bar"), room);
    var ym = (wy0 + wy1) / 2;
    el("line", lineAttrs(P(-ROOM_HALF, ym, w0), P(-ROOM_HALF, ym, w1), "window-bar"), room);
    poly(
      [P(-ROOM_HALF, wy0 - 14, w0 - 0.02), P(-ROOM_HALF, wy0, w0 - 0.02), P(-ROOM_HALF, wy0, w1 + 0.02), P(-ROOM_HALF, wy0 - 14, w1 + 0.02)],
      { class: "sill" },
      room
    );
    poly(
      [P(-ROOM_HALF, 0, w0), P(-ROOM_HALF, 0, w1), P(-120, 0, w1 - 0.18), P(-40, 0, w0 - 0.2)],
      { class: "light" },
      room
    );

    // Panneau d'affichage avec feuilles
    var bA = P(-230, 470, WALL_Z), bB = P(110, 290, WALL_Z);
    el("rect", rectAttrs(bA, bB, "board"), room);
    var sheets = [
      [-210, 455, -150, 395], [-135, 458, -70, 382], [-50, 452, 10, 400],
      [25, 460, 90, 392], [-200, 372, -125, 305], [-105, 365, -40, 312], [-20, 380, 60, 305]
    ];
    sheets.forEach(function (s, i) {
      el("rect", rectAttrs(P(s[0], s[1], WALL_Z), P(s[2], s[3], WALL_Z), "sheet sheet--" + (i % 3)), room);
      var pin = P((s[0] + s[2]) / 2, s[1] - 6, WALL_Z);
      el("circle", { class: "pin", cx: r1(pin[0]), cy: r1(pin[1]), r: 2.2 }, room);
    });

    // Horloge
    var c = P(300, 440, WALL_Z);
    el("circle", { class: "clock", cx: r1(c[0]), cy: r1(c[1]), r: 15 }, room);
    el("line", { class: "clock-hand", x1: r1(c[0]), y1: r1(c[1]), x2: r1(c[0]), y2: r1(c[1] - 9) }, room);
    el("line", { class: "clock-hand", x1: r1(c[0]), y1: r1(c[1]), x2: r1(c[0] + 6), y2: r1(c[1] + 3) }, room);

    // Étagère avec livres
    var sh = P(200, 300, WALL_Z), sh2 = P(470, 290, WALL_Z);
    el("rect", rectAttrs(sh, sh2, "shelf"), room);
    var bx = 210;
    for (var i = 0; i < 11; i++) {
      var bw = 16 + variant(i, 3, 3) * 5;
      var bh = 50 + variant(i, 5, 4) * 9;
      el("rect", rectAttrs(P(bx, 300 + bh, WALL_Z), P(bx + bw, 300, WALL_Z), "book book--" + (i % 4)), room);
      bx += bw + 3;
      if (bx > 450) break;
    }

    // Patères et sacs sur le mur de droite
    var hooksZ = [1.4, 1.58, 1.76];
    poly(
      [P(ROOM_HALF, 440, 1.32), P(ROOM_HALF, 425, 1.32), P(ROOM_HALF, 425, 1.84), P(ROOM_HALF, 440, 1.84)],
      { class: "shelf" },
      room
    );
    hooksZ.forEach(function (z, i) {
      var top = P(ROOM_HALF, 425, z);
      var bot = P(ROOM_HALF, 315 - i * 15, z);
      var w = 32 / z;
      el(
        "path",
        {
          class: "bag bag--" + i,
          d:
            "M" + r1(top[0]) + "," + r1(top[1]) +
            " q" + r1(-w * 0.6) + "," + r1((bot[1] - top[1]) * 0.25) + " " + r1(-w * 0.55) + "," + r1(bot[1] - top[1]) +
            " h" + r1(w * 1.1) +
            " q" + r1(w * 0.05) + "," + r1(-(bot[1] - top[1]) * 0.75) + " " + r1(-w * 0.55) + "," + r1(-(bot[1] - top[1]))
        },
        room
      );
    });

    return room;
  }

  function lineAttrs(a, b, cls) {
    return { class: cls, x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]) };
  }

  function rectAttrs(a, b, cls) {
    return {
      class: cls,
      x: r1(Math.min(a[0], b[0])),
      y: r1(Math.min(a[1], b[1])),
      width: r1(Math.abs(b[0] - a[0])),
      height: r1(Math.abs(b[1] - a[1]))
    };
  }

  /* ------------------------------------------------------------------ */
  /* Élèves et pupitres                                                   */
  /* ------------------------------------------------------------------ */

  // Jambes, visibles sous le pupitre.
  function drawLegs(g, X, z) {
    [-13, 13].forEach(function (dx) {
      var a = P(X + dx - 7, 80, z), b = P(X + dx + 7, 0, z);
      el("rect", {
        class: "s-leg",
        x: r1(a[0]), y: r1(a[1]), width: r1(b[0] - a[0]), height: r1(b[1] - a[1]), rx: 3
      }, g);
    });
  }

  // Buste, tête et cheveux (silhouette sans traits de visage).
  function drawUpper(g, X, z, index) {
    var s = 1 / z;
    var tone = variant(index, 1, 3);
    var hair = variant(index, 2, 5);
    var dx = (variant(index, 4, 5) - 2) * 3; // légère variation de posture
    var headC = P(X + dx, 260, z);
    var headR = 21 * s;

    // Halo de mise en évidence (invisible par défaut)
    var halo = P(X, 200, z);
    el("ellipse", {
      class: "s-halo",
      cx: r1(halo[0]), cy: r1(halo[1]), rx: r1(62 * s), ry: r1(88 * s)
    }, g);

    // Cheveux arrière (longs / volume)
    if (hair === 1) {
      var h1 = P(X + dx - 24, 266, z), h2 = P(X + dx + 24, 200, z);
      el("rect", {
        class: "s-hair",
        x: r1(h1[0]), y: r1(h1[1]), width: r1(h2[0] - h1[0]), height: r1(h2[1] - h1[1]), rx: r1(14 * s)
      }, g);
    } else if (hair === 3) {
      var hc = P(X + dx, 265, z);
      el("circle", { class: "s-hair", cx: r1(hc[0]), cy: r1(hc[1]), r: r1(26 * s) }, g);
    }

    // Cou
    var n1 = P(X + dx * 0.5 - 7, 245, z), n2 = P(X + dx * 0.5 + 7, 214, z);
    el("rect", {
      class: "s-head",
      x: r1(n1[0]), y: r1(n1[1]), width: r1(n2[0] - n1[0]), height: r1(n2[1] - n1[1])
    }, g);

    // Buste
    var p = function (x, y) { return pt(P(X + x, y, z)); };
    el("path", {
      class: "s-body tone-" + tone,
      d:
        "M" + p(-33, 120) +
        " L" + p(-38, 192) +
        " Q" + p(-40, 219) + " " + p(-19, 224) +
        " L" + p(19, 224) +
        " Q" + p(40, 219) + " " + p(38, 192) +
        " L" + p(33, 120) + " Z"
    }, g);

    // Tête
    el("circle", { class: "s-head", cx: r1(headC[0]), cy: r1(headC[1]), r: r1(headR) }, g);

    // Cheveux avant
    var hx = headC[0], hy = headC[1], R = headR;
    var cap =
      "M" + r1(hx - R * 1.04) + "," + r1(hy + R * 0.05) +
      " A" + r1(R * 1.04) + "," + r1(R * 1.04) + " 0 0 1 " + r1(hx + R * 1.04) + "," + r1(hy + R * 0.05) +
      " Q" + r1(hx + R * 0.2) + "," + r1(hy - R * 0.55) + " " + r1(hx - R * 1.04) + "," + r1(hy + R * 0.05) + " Z";
    if (hair === 0 || hair === 1 || hair === 3) {
      el("path", { class: "s-hair", d: cap }, g);
    } else if (hair === 2) {
      el("path", { class: "s-hair", d: cap }, g);
      el("circle", { class: "s-hair", cx: r1(hx), cy: r1(hy - R * 1.12), r: r1(R * 0.42) }, g);
    } else {
      // très court : simple calotte fine
      el("path", {
        class: "s-hair",
        d:
          "M" + r1(hx - R) + "," + r1(hy - R * 0.15) +
          " A" + r1(R) + "," + r1(R) + " 0 0 1 " + r1(hx + R) + "," + r1(hy - R * 0.15) +
          " Q" + r1(hx) + "," + r1(hy - R * 0.75) + " " + r1(hx - R) + "," + r1(hy - R * 0.15) + " Z"
      }, g);
    }

    // Contour clair (affiché uniquement pour la place mise en évidence)
    el("path", {
      class: "s-outline",
      d:
        "M" + p(-38, 150) +
        " L" + p(-38, 192) +
        " Q" + p(-40, 219) + " " + p(-19, 224) +
        " L" + pt([hx - R * 0.45, hy + R * 0.9]) +
        " A" + r1(R * 1.12) + "," + r1(R * 1.12) + " 0 1 1 " + pt([hx + R * 0.45, hy + R * 0.9]) +
        " L" + p(19, 224) +
        " Q" + p(40, 219) + " " + p(38, 192) +
        " L" + p(38, 150)
    }, g);
  }

  // Bras posés sur la table.
  function drawArms(g, X, z, index) {
    var zt = z + 0.028; // sur le plateau, près de l'élève
    var s = 1 / zt;
    var pose = variant(index, 6, 3);
    var tone = variant(index, 1, 3);

    // Cahier sur certaines places
    if (variant(index, 7, 3) !== 0) {
      var n = [
        P(X - 30, 151, z + 0.006), P(X + 30, 151, z + 0.006),
        P(X + 28, 151, z + 0.042), P(X - 28, 151, z + 0.042)
      ];
      poly(n, { class: "notebook" }, g);
    }

    // Avant-bras croisés ou posés côte à côte
    if (pose === 0) {
      var a = P(X - 38, 160, zt), b = P(X + 38, 146, zt);
      el("rect", {
        class: "s-arm tone-" + tone,
        x: r1(a[0]), y: r1(a[1]), width: r1(b[0] - a[0]), height: r1(b[1] - a[1]), rx: r1(7 * s)
      }, g);
    } else {
      [-1, 1].forEach(function (side) {
        var c = P(X + side * 30, 153, zt);
        var w = 14 * s, h = 18 * s;
        el("rect", {
          class: "s-arm tone-" + tone,
          x: r1(c[0] - w / 2), y: r1(c[1] - h / 2), width: r1(w), height: r1(h), rx: r1(6 * s)
        }, g);
      });
      if (pose === 2) {
        // un crayon
        var c1 = P(X + 8, 151, zt - 0.005), c2 = P(X + 30, 151, zt + 0.02);
        el("line", lineAttrs(c1, c2, "pencil"), g);
      }
    }
  }

  // Pupitre double.
  function drawDesk(g, X, z) {
    var zb = z + 0.05;
    var hw = 120;

    // Pieds
    [-hw + 8, hw - 8].forEach(function (dx) {
      var a = P(X + dx - 4, 142, z), b = P(X + dx + 4, 0, z);
      el("rect", { class: "desk-leg", x: r1(a[0]), y: r1(a[1]), width: r1(b[0] - a[0]), height: r1(b[1] - a[1]) }, g);
    });

    // Panneau avant
    var pa = P(X - hw + 10, 140, z + 0.006), pb = P(X + hw - 10, 72, z + 0.006);
    el("rect", { class: "desk-panel", x: r1(pa[0]), y: r1(pa[1]), width: r1(pb[0] - pa[0]), height: r1(pb[1] - pa[1]) }, g);

    // Plateau
    poly([P(X - hw, 150, z), P(X + hw, 150, z), P(X + hw, 150, zb), P(X - hw, 150, zb)], { class: "desk-top" }, g);
    // Chant du plateau
    var ea = P(X - hw, 150, z), eb = P(X + hw, 140, z);
    el("rect", { class: "desk-edge", x: r1(ea[0]), y: r1(ea[1]), width: r1(eb[0] - ea[0]), height: r1(eb[1] - ea[1]) }, g);
  }

  function drawChairLegs(g, X, z) {
    [-26, 26].forEach(function (dx) {
      var a = P(X + dx, 88, z), b = P(X + dx, 0, z);
      el("line", lineAttrs(a, b, "chair-leg"), g);
    });
    var s1 = P(X - 30, 88, z), s2 = P(X + 30, 80, z);
    el("rect", { class: "chair-seat", x: r1(s1[0]), y: r1(s1[1]), width: r1(s2[0] - s1[0]), height: r1(s2[1] - s1[1]) }, g);
  }

  /* ------------------------------------------------------------------ */
  /* Rendu                                                                */
  /* ------------------------------------------------------------------ */

  function render(container, layout, opts) {
    opts = opts || {};
    container.innerHTML = "";

    var svg = el("svg", {
      xmlns: NS,
      viewBox: "0 0 " + VIEW.w + " " + VIEW.h,
      class: "classroom",
      role: "img",
      "aria-labelledby": "classroom-title classroom-desc",
      focusable: "false"
    });
    var title = el("title", { id: "classroom-title" }, svg);
    title.textContent = opts.title || "Une salle de classe";
    var desc = el("desc", { id: "classroom-desc" }, svg);
    desc.textContent = opts.description || "";

    // Filtre « trait dessiné » léger, appliqué au décor uniquement.
    var defs = el("defs", null, svg);
    var f = el("filter", { id: "trait", x: "-2%", y: "-2%", width: "104%", height: "104%" }, defs);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: "7", result: "n" }, f);
    el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "2.2" }, f);

    drawRoom(svg);

    var seats = [];
    var rows = el("g", { class: "rows" }, svg);
    var seatIndex = 0;

    layout.rangees.forEach(function (row, r) {
      var z = ROW_Z[r];
      var rowG = el("g", { class: "row", "data-row": r }, rows);

      row.tablesDoubles.forEach(function (col, t) {
        var X = TABLE_X[col];
        var table = el("g", {
          class: "table",
          style: "--order:" + (r * 3 + t)
        }, rowG);

        // Ombre au sol
        var sh = P(X, 0, z + 0.03);
        el("ellipse", { class: "shadow", cx: r1(sh[0]), cy: r1(sh[1]), rx: r1(135 / z), ry: r1(10 / z) }, table);

        var seatXs = [X - SEAT_HALF, X + SEAT_HALF];
        var ids = [seatIndex, seatIndex + 1];
        seatIndex += 2;

        var zs = z + 0.09; // élèves assis derrière leur pupitre
        seatXs.forEach(function (sx) { drawChairLegs(table, sx, z + 0.13); });

        var groups = ids.map(function (id) {
          return {
            legs: el("g", { class: "student", "data-seat": id }, table),
            upper: null,
            arms: null
          };
        });
        seatXs.forEach(function (sx, k) { drawLegs(groups[k].legs, sx, z + 0.07); });
        seatXs.forEach(function (sx, k) {
          groups[k].upper = el("g", { class: "student", "data-seat": ids[k] }, table);
          drawUpper(groups[k].upper, sx, zs, ids[k]);
        });

        drawDesk(el("g", { class: "desk" }, table), X, z);

        seatXs.forEach(function (sx, k) {
          groups[k].arms = el("g", { class: "student", "data-seat": ids[k] }, table);
          drawArms(groups[k].arms, sx, z, ids[k]);
        });

        // Emprise de la place (pour les commandes superposées)
        seatXs.forEach(function (sx, k) {
          var top = P(sx - 46, 292, zs);
          var bottom = P(sx + 46, 140, z);
          seats.push({
            index: ids[k],
            row: r,
            box: { x: top[0], y: top[1], w: bottom[0] - top[0], h: bottom[1] - top[1] }
          });
        });
      });
    });

    container.appendChild(svg);
    return { svg: svg, seats: seats, viewBoxes: VIEWBOXES };
  }

  function countSeats(layout) {
    return layout.rangees.reduce(function (sum, row) {
      return sum + row.tablesDoubles.length * 2;
    }, 0);
  }

  window.StopInceste = window.StopInceste || {};
  window.StopInceste.Classroom = { render: render, countSeats: countSeats };
})();

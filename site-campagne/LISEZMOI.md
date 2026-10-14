# Site de campagne — mode d'emploi

Double-cliquez sur `index.html`. Les polices viennent de Google Fonts : une
connexion est nécessaire au premier affichage.

```
site-campagne/
  index.html
  assets/css/traces.css   bords déchirés et traits de feutre (généré)
  assets/css/style.css    jetons, échelle typographique, composants
  assets/css/page.css     mise en page des sections
  assets/js/site.js       défilements et pointeur, sans dépendance
  assets/img/cartes/      les neuf cartes + le dos
  assets/img/perso/       les personnages détourés
  assets/img/signes/      taches, flèches, cadres tirés de vos planches
  assets/img/scenes/      le 119, le mockup, le présentoir
```

## La charte

| | | Contraste sur blanc | Emploi |
|---|---|---|---|
| Encre | `#645f65` | 5,6:1 | texte secondaire, légendes, sources |
| Accent | `#c42e88` | 5,2:1 | chiffres |
| Herbe foncé | `#24763a` | 5,6:1 | réserve (ancien fond du pied de page) |
| Accent 2 | `#db3e5f` | 4,0:1 | fonds pleins et traits, pas de petit texte |
| Ciel | `#0db3da` | 2,2:1 | trait et fond dilué seulement |
| Herbe | `#19a659` | 2,8:1 | trait et fond dilué seulement |
| Soleil | `#f4ec4d` | 1,2:1 | fond dilué seulement |

**Seuls l'encre et l'accent portent du texte courant.** Les trois autres ne
servent qu'au trait, à la tache et aux fonds dilués — c'est pourquoi les bandes
sont des versions très claires de la charte et non la couleur pure.

Une section, un ton : les cartes en ciel, l'anatomie en herbe, l'ampleur en
accent, le 119 en accent 2, le pied sur papier Seyès avec des traits verts.

Le pied de page porte désormais du texte au crayon sur le quadrillage Seyès :
le vert n'y sert plus qu'au trait sous les liens, jamais au texte.

## Ce qui vient de Terre Fragile

Les mécaniques, pas la matière : **les bandes à bords déchirés** entre les
sections, le **bouton tracé à main levée** avec sa rotation, les **angles
irréguliers**, le **soulignement dessiné** sous les titres, l'**en-tête collant
qui rétrécit**, et la **structure du pied de page** en bande pleine avec sa
déchirure haute.

Les déchirures sont générées une fois par `dechirures.py` à partir d'une graine
fixe : la même main maladroite à chaque fois, mais jamais deux bords identiques.

## Ce qui est à vous

Vos sept feutres, Beth Ellen pour les titres, Borel pour le corps, vos neuf
cartes, vos personnages détourés, votre illustration du 119, vos deux
photographies de mise en situation, et les signes dessinés de vos planches —
taches de couleur, flèches, cadres — qui servent de ponctuation.

**Le quadrillage Seyès** — le fond réel des cartes — couvre les deux sections
qui défilent (les neuf cartes, l'ampleur) et le pied de page. Il est **calé
sur la fenêtre** (`background-attachment: fixed`) : les lignes ne bougent
jamais, seuls les cartes, les fiches et le texte passent par-dessus. Sur iOS,
qui ignore ce réglage, la scène collée porte le même fond et garde les lignes
immobiles pendant le défilement des cartes. Ses lignes sont volontairement
pâles (`#e9eef7` et `#cbd8ec`) pour ne pas concurrencer le texte.

**Le Seyès est toujours la couche du dessous.** Il n'a pas de bord déchiré à
lui et ne porte jamais d'ombre : ce sont les feuilles blanches posées dessus
— l'en-tête, l'anatomie, le 119 (classe `feuille`) — qui le recouvrent de leur
bord déchiré et y projettent leur ombre (`--ombre-dechirure`). Seule
exception : sous la photo d'ouverture, c'est le cahier qui mord l'image, sans
ombre. L'ombre est posée par `filter: drop-shadow` sur la section entière,
rendue opaque, et non sur la déchirure : le masque de la déchirure
découperait aussi sa propre ombre.

**Noms de fichiers accentués** : ils sont enregistrés en Unicode composé (NFC).
Une archive faite sur Mac les stocke décomposés (NFD) : sur un serveur Linux,
`Père.jpg` ou `Grand-mère.jpg` répondent alors 404. À vérifier à chaque
nouvel envoi d'images.

## Les trois mécaniques

**L'ouverture.** La photographie du présentoir en médiathèque est montrée
entière, sans recadrage, sans titre et sans voile. La barre de menu, opaque,
mord dessus par un bord déchiré ; en bas, c'est la bande bleue qui vient mordre
l'image avec le sien, sans blanc entre les deux.

Sur un téléphone, montrer l'image entière la réduirait à 212 px de haut : elle
y est donc recadrée en 3/2, ce qui coûte environ un sixième des bords.

**Les neuf cartes qui défilent.** La section se fige et les cartes passent
horizontalement pendant qu'on descend. Impossible d'en regarder une sans voir
arriver les suivantes : la règle éditoriale est tenue par le mouvement. Les
quatre fiches de l'ampleur emploient la même mécanique.

**La carte qui se retourne.** Toute la scène est fixée — titre compris — et
seule la carte tourne, penchée de 10°. Trois repères désignent les zones du
recto, chacun à la hauteur de la sienne ; au passage des 90°, trois autres les
remplacent pour le verso. Il n'y a plus d'apparition au défilement : à chaque
face ses repères.

**Le pointeur.** Un rond de feutre suit la main et grossit sur les éléments
actifs ; les personnages de l'ouverture se soulèvent quand on passe près d'eux.
Uniquement sur pointeur fin — jamais au toucher.

Tout cela se désactive sous `prefers-reduced-motion` : les cartes deviennent une
grille où les neuf sont visibles d'un coup, la carte ne tourne plus, le pointeur
disparaît. Un seul écouteur de défilement, calé sur l'image suivante, et qui ne
calcule que pour les sections réellement à l'écran.

## Les chiffres, et d'où ils viennent

| Chiffre | Source | Réserve |
|---|---|---|
| **Un enfant par classe** — 2,9 % des enfants | Inserm-Ciase 2021, *Population & Sociétés* n° 612, tableau A.1 | Moyenne des deux colonnes du tableau : 4,6 % des femmes et 1,2 % des hommes, soit 2,9 % des enfants, c'est-à-dire **un élève sur trente-quatre**. « Un par classe de trente » est donc un arrondi légèrement généreux, et la fiche donne les deux chiffres d'origine. |
| **4 fois plus de filles** — 4,6 % contre 1,2 % | Même enquête, même tableau | Échantillon aléatoire, périmètre strictement familial. |
| **× 2,9** avec un handicap, **× 4,6** en cas de déficience intellectuelle | OMS 2012, repris par la CIIVISE (mars 2022) | **Donnée internationale et ancienne.** Ce n'est pas une mesure française, et la page l'indique. |
| **Plus de cinq ans pour une victime sur quatre** | CIIVISE, corpus de 30 000 témoignages | Corpus **volontaire, non représentatif**. Valable pour décrire la gravité, jamais une proportion d'auteurs. |
| 160 000 enfants par an, 2 000 condamnations | CIIVISE | Estimation, pas un recensement. |

Je n'ai employé aucun chiffre qui ne soit pas dans votre dossier `Sources/` ou
attribué explicitement. La « durée moyenne de 3,5 ans » qui circulait n'est pas
un chiffre publié : elle n'est pas sur le site.

## Ce qui reste à faire

1. **Deux dessins viennent de Terre Fragile** — le nid et la pousse, pour les
   fiches « handicap » et « durée ». Ils sont au crayon là où tout le reste est
   au feutre. À remplacer par les vôtres si l'écart vous gêne. L'école en vient
   aussi ; la sœur et le frère sont vos détourages.
2. **Le bandeau de maquette a disparu** de cette version. Tant que la page porte
   l'identité d'une association réelle, la mention en pied de page doit rester,
   et il faut décider si un bandeau visible est nécessaire.
3. **Le numéro** : les cartes portent le 119 français, l'association est suisse.
   Le pied de page donne les deux.
4. **WebP et AVIF** : aucun outil de conversion sur cette machine. Les cartes
   sont servies à 560 px et les images lourdes sont différées, mais le gain de
   format reste à prendre ailleurs.

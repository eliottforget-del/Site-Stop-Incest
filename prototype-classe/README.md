# Prototype « La classe » — Stop Inceste

Première scène interactive du projet. Une salle de classe de 22 places apparaît rangée par rangée, puis une place se distingue pour rendre visible une proportion issue d'une enquête de l'Ined : 4,6 % des femmes interrogées, soit environ 1 sur 22. Un panneau explique ensuite ce que mesure ce chiffre.

Le principe, une salle qu'on découvre progressivement en faisant défiler un récit, s'inspire de la mise en scène de The Pudding (*lifeafter*). Le site n'est pas copié.

## Lancer le prototype

Aucune dépendance ni étape de compilation.

- **Le plus simple** : ouvrir `prototype-classe/index.html` dans un navigateur.
- **Avec un serveur local** (recommandé pour les tests) :

  ```sh
  cd prototype-classe
  python3 -m http.server 8765
  # puis ouvrir http://localhost:8765/
  ```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure, textes du récit en 3 temps, navigation, panneau (`<dialog>`). Tout le texte essentiel est dans le HTML. |
| `css/style.css` | Jetons de couleur et de typographie, mise en page défilante (colonne collante), animations, version mobile, `prefers-reduced-motion`. |
| `js/data.js` | **Données seules** : statistiques, source, limites d'interprétation, disposition de la salle, statut de vérification de chaque information. Aucun code de dessin. |
| `js/classroom.js` | **Dessin seul** : salle en SVG (perspective à un point de fuite), pupitres, silhouettes. Ne connaît aucune statistique. |
| `js/main.js` | Orchestration : contrôle de cohérence des données, états de la scène, IntersectionObserver, boutons, panneau et focus. |
| `tests/verifier.cjs` | Vérifications automatiques avec Playwright (42 contrôles). |

## Fonctionnement de la scène

1. **Découvrir la classe** : titre « Imaginez une classe. ». Les 11 tables doubles (4 rangées : 4 + 6 + 6 + 6 places) apparaissent du fond vers l'avant, en 1,5 s environ. Il n'y a pas d'écran de chargement. Le bouton « Suivant » saute l'animation.
2. **Faire apparaître la statistique** : les autres silhouettes s'éclaircissent. Une place passe à la couleur d'accent, avec un halo léger et un contour clair. Elle ne clignote pas et il n'y a pas de son. Le texte de la statistique, la proportion « 1 sur 22 », le lien vers l'Ined et la note « représentation visuelle, pas un comptage » apparaissent ensuite.
3. **Explorer** : la silhouette mise en évidence (ou le bouton « Comprendre ce chiffre ») ouvre un panneau. Il présente :
   - ce que mesure le chiffre ;
   - la population concernée ;
   - la période ;
   - les limites d'interprétation ;
   - la source, avec un lien.

   On le ferme avec « Revenir à la classe », le bouton ✕, la touche Échap ou un clic sur le fond. Le focus revient alors à l'élément qui l'a ouvert.

Navigation :

- **Défilement natif** : l'IntersectionObserver suit l'étape au centre de l'écran. Rien ne bloque ni n'impose le rythme, et l'on peut revenir en arrière.
- **Barre « Précédent / Suivant »** : fixée en bas de l'écran, avec l'étape en cours annoncée aux lecteurs d'écran.
- **Lien d'évitement** : « Aller directement à la statistique ».

## Données et garde-fou statistique

Toutes les informations sont dans `js/data.js`, chacune avec un statut :

- `confirme-resume` : concordant avec le résumé publié par l'Ined (4,6 % et 1,2 %) ;
- `a-confirmer` : tranche d'âge et taille de l'échantillon, non renseignées. Le panneau l'indique explicitement ;
- les textes explicatifs et les limites sont une première rédaction à faire relire.

`main.js` vérifie que `Math.round(100 / valeur)` correspond au nombre de places. Sinon, la mise en évidence est désactivée et une erreur est affichée dans la console. Par exemple, si l'on branche la statistique masculine (1,2 %, environ 1 sur 83) sur cette classe de 22 places, la scène refuse de l'afficher. Ce cas est couvert par un test.

### Ajouter plus tard la comparaison femmes / hommes

La donnée masculine est déjà décrite dans `statistics.hommes` (`denominateur: 83`), mais elle n'est pas affichée. Pour une future vue :

- créer une scène dédiée dans `scenes`, avec sa propre échelle. Par exemple un amphithéâtre de 83 places, ou deux grilles côte à côte de 100 ou 1 000 personnes, avec les dénominateurs écrits en toutes lettres ;
- réutiliser `buildPanel()` pour donner accès aux mêmes informations méthodologiques ;
- ne jamais représenter 1,2 % par une place sur 22.

`classroom.js` accepte n'importe quelle disposition de rangées (`rangees[].tablesDoubles`). Une salle plus grande demandera toutefois d'ajouter des profondeurs dans `ROW_Z`.

## Accessibilité

- Toutes les commandes sont de vrais `<button>` nommés. La place cliquable est un bouton HTML superposé au SVG, d'au moins 44 × 44 px.
- Le panneau est un `<dialog>` modal : le focus y reste piégé, Échap le ferme et le focus est ensuite restitué.
- Le SVG a un titre et une description textuelle (`role="img"`).
- `prefers-reduced-motion` : aucune animation, tout est affiché immédiatement, défilement non animé.
- Sans JavaScript, le titre, la statistique, la source et la note restent lisibles. Seule l'illustration manque.
- Contrastes : le texte d'accent `#a3321a` sur le papier `#f5f0e7` dépasse 4,5:1.

## Vérifications

```sh
cd prototype-classe
python3 -m http.server 8765 &
npm i -D playwright   # ou une installation globale
node tests/verifier.cjs http://localhost:8765/ ./captures
```

Le script contrôle notamment :

- le comptage (22 silhouettes, 11 tables, 4 rangées) ;
- le décalage d'apparition ;
- la place mise en évidence et ses couleurs ;
- le défilement à la molette et les boutons ;
- le panneau (souris, clavier, Échap, focus) ;
- le lien source ;
- l'affichage mobile (375 px : pas de débordement, feuille en bas, cible tactile) ;
- le mouvement réduit ;
- le garde-fou statistique ;
- l'affichage sans JavaScript ;
- l'absence d'erreurs JavaScript et de ressources manquantes.

## Limites connues

- **Identité graphique** : le dépôt ne contenait aucun fichier. Il n'y avait donc pas de charte, d'illustrations ni de polices à reprendre. Les couleurs (papier chaud, encre bleu nuit, accent corail) et les polices système sont des choix provisoires, à aligner sur l'identité définitive de Stop Inceste.
- **Source** : le site de l'Ined n'était pas accessible depuis l'environnement de développement. Les chiffres et la référence (Marsicano, Bajos, Pousson, *Population & Sociétés* n° 612, juin 2023, DOI 10.3917/popsoc.612.0001) ont été recoupés via le résumé publié par l'Ined. L'enquête est décrite comme l'enquête nationale de l'Inserm de 2021. La tranche d'âge, la taille de l'échantillon et la définition exacte des liens familiaux retenus doivent être relues dans le texte intégral.
- Le lien source n'a pas pu être testé en ligne. Seule son adresse est vérifiée.
- Le dessin est volontairement simple : pas de visages ni de 3D. Sur les petits écrans, les rangées du fond restent petites.
- Testé dans Chromium (ordinateur, mobile émulé). Safari et Firefox ne sont pas testés.
- La place mise en évidence (index 11) est fixe et documentée comme arbitraire.

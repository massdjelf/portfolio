# Ma Salle — app de gestion pour salle de sport

Application web installable (PWA), en français, sans Play Store. Gère des offres
tarifaires personnalisables et un carnet de clients, tout en local sur l'appareil.

## Déploiement

C'est un site statique : 5 fichiers + un dossier `icons/`. Aucun serveur applicatif,
aucune base de données.

1. Copiez tout le dossier `gym-app/` sur un hébergement en **HTTPS** (obligatoire pour
   l'installation PWA et le service worker). Deux options simples avec ce que vous
   utilisez déjà :
   - Sur votre serveur Linux (même principe que MonRDV) : servez le dossier avec
     nginx derrière votre tunnel Cloudflare, sur un sous-domaine dédié
     (ex. `salle.votredomaine.tech`).
   - Sur GitHub Pages, comme `massyl.uk` : nouveau repo (ou sous-dossier), Cloudflare
     DNS pointé dessus.
2. Donnez le lien au gérant de la salle. Il ouvre le lien dans Chrome/Safari, puis
   « Ajouter à l'écran d'accueil ». L'icône apparaît comme une vraie app.

## Premier lancement

Au premier chargement, l'app demande de créer un code à 4 chiffres (saisi deux fois).
Ce code protège l'accès ; il est propre à cet appareil (stocké en local, jamais
envoyé nulle part).

## Ce que « impossible à partager » veut dire concrètement

- **Impossible via ShareIt / Bluetooth / etc.** : il n'y a pas de fichier `.apk`
  installé sur le téléphone, donc rien à transférer par ces outils-là. C'est la
  vraie protection, et elle est solide.
- **Le lien reste copiable** (WhatsApp, SMS...) — ça, aucune app 100% locale sans
  serveur ne peut l'empêcher techniquement. Le code PIN limite les dégâts : quelqu'un
  qui récupère juste le lien ne peut pas voir les données ni utiliser l'app sans le
  code. Ce n'est pas une sécurité militaire, mais ça couvre le cas réel (le lien qui
  traîne, envoyé par erreur).
- Si vous voulez un vrai lien à usage unique qui expire après la première ouverture,
  il faut un petit serveur qui valide un jeton avant de servir l'app — techniquement
  faisable avec Flask sur votre serveur existant (même logique que MonRDV), mais
  c'est un ajout, pas ce qui est livré ici.

## Code PIN oublié

Sur l'écran de verrouillage, un bouton discret « Oublié » (à côté du 0) permet de
réinitialiser le code PIN — **uniquement le code**, les clients enregistrés ne sont
pas touchés puisqu'ils sont stockés séparément. Il faut appuyer deux fois pour
confirmer, pour éviter une réinitialisation accidentelle.

## Sauvegarde des données

Tout est stocké dans le `localStorage` du navigateur, sur cet appareil uniquement.
Si le gérant change de téléphone, réinstalle le navigateur, ou vide les données du
site, l'historique clients est perdu. Dans Réglages (icône ⚙), le bouton
« Exporter (CSV) » télécharge la liste complète des clients — à faire régulièrement
comme sauvegarde, surtout avant de changer d'appareil.

## Modifier les offres et les prix

Réglages (⚙) → les 6 offres par défaut (1 séance, 1x/2x/3x/5x par semaine, illimité)
ont chacune un prix éditable. Pour ajouter/retirer une offre ou changer les noms,
éditez le tableau `DEFAULT_OFFERS` en haut de `app.js`, ou modifiez directement
`localStorage.gym_offers` (format JSON) une fois l'app ouverte dans un navigateur.

## Structure des fichiers

```
gym-app/
  index.html      écran de verrouillage + app principale (onglets Offres / Clients)
  styles.css       thème (charbon / laiton), mobile-first
  app.js           toute la logique (PIN, offres, clients, export CSV)
  manifest.json    métadonnées PWA (nom, icônes, couleurs)
  sw.js            service worker (mise en cache pour usage hors-ligne)
  icons/           icônes 192px et 512px
```

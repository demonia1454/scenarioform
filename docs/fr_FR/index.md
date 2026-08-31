# ScenarioForm — guide d'utilisation

ScenarioForm permet de lancer des scénarios Jeedom depuis des formulaires
personnalisés, puis de suivre leur résultat métier et de retrouver les saisies
dans un historique.

## Comprendre l'organisation

- une **requête** regroupe un ou plusieurs formulaires liés à un même usage ;
- un **formulaire** présente les valeurs à saisir ;
- un **champ** transmet sa valeur au scénario sous forme de tag Jeedom ;
- un ou plusieurs **scénarios** traitent la saisie ;
- une **réponse** mémorise les valeurs, les lancements et les résultats métier.

Exemple : la requête « Présence » peut contenir le formulaire « Je rentre »,
avec une date et un commentaire, puis lancer un scénario qui prépare le
logement.

## Créer rapidement un premier exemple

Avec un compte administrateur :

1. ouvrir **Accueil → ScenarioForm** ;
2. choisir **Assistant premier formulaire** ;
3. conserver ou adapter les noms proposés ;
4. choisir **Créer l'exemple** ;
5. sélectionner **Saisir les valeurs**, indiquer une date puis choisir
   **Valider et exécuter** ;
6. consulter le résultat et l'historique.

L'assistant crée une nouvelle requête, un nouveau formulaire, deux champs et un
nouveau scénario prêt à tester. Il ne modifie aucun élément existant.

Le parcours manuel détaillé est disponible dans
[`EXEMPLE_PRET_A_EMPLOI.md`](../../EXEMPLE_PRET_A_EMPLOI.md).

## Créer son propre formulaire

### 1. Créer une requête

Choisir **Nouvelle requête**, renseigner un nom et une description, puis
sélectionner **Créer la requête**.

### 2. Créer un formulaire

Ouvrir la requête, choisir **Créer un formulaire**, renseigner son nom et sa
description puis valider.

Les actions **Créer**, **Modifier** et **Supprimer le formulaire** sont
regroupées dans l'en-tête. La suppression conserve les scénarios Jeedom mais
supprime les champs, associations, réponses et valeurs du formulaire après
confirmation.

### 3. Ajouter les champs

Choisir **Ajouter des champs**. Chaque champ possède au minimum :

- un tag technique sans `#`, par exemple `date_depart` ;
- un libellé affiché, par exemple « Date de départ » ;
- un type ;
- un caractère obligatoire ou facultatif ;
- un ordre d'affichage.

Les types disponibles couvrent notamment le texte, le texte long, la date,
l'heure, la date et l'heure, les nombres, l'adresse électronique, la case à
cocher et la liste de choix. Des bornes, longueurs et comparaisons entre champs
temporels peuvent être ajoutées selon le type.

### 4. Associer un scénario

Deux possibilités existent :

- associer un scénario Jeedom existant dans **Modifier le formulaire** ;
- choisir **Créer un scénario modèle** après avoir ajouté les champs.

Le scénario modèle contient déjà la lecture des tags, la protection du contexte
ScenarioForm, la gestion des erreurs et l'envoi du résultat. Seules les zones
explicitement balisées « TRAITEMENT À PERSONNALISER » et « MESSAGE DE RETOUR »
doivent être adaptées.

Le bouton **Ouvrir le scénario** permet d'accéder directement à l'éditeur
Jeedom. Un lancement manuel du scénario modèle est volontairement ignoré.

## Utiliser un formulaire au quotidien

1. choisir une requête puis un formulaire ;
2. sélectionner **Saisir les valeurs** ;
3. compléter les champs ;
4. choisir **Valider et exécuter** ;
5. suivre les résultats attendus ;
6. utiliser **Nouvelle saisie** ou **Voir l'historique**.

Lorsqu'un scénario est configuré sans retour métier attendu, il est présenté
comme lancé immédiatement. Lorsqu'un retour est attendu, ScenarioForm suit les
états `accepted`, `rejected`, `warning`, `error` ou `timeout`.

## Consulter et reprendre l'historique

Le bouton **Historique** affiche les réponses du formulaire. Une saisie peut
être reprise pour préremplir un nouveau formulaire.

- un administrateur voit l'ensemble de l'historique ;
- un utilisateur non administrateur voit uniquement ses propres réponses ;
- les anciennes réponses sans propriétaire restent visibles uniquement des
  administrateurs.

La suppression d'une réponse ou le vidage de l'historique supprime également
ses valeurs et résultats associés après confirmation.

## Donner accès à un utilisateur limité

Dans **Réglages → Système → Utilisateurs → Droits** :

1. choisir l'onglet **Scénarios** ;
2. repérer chaque scénario associé au formulaire ;
3. sélectionner **Visualisation et exécution** ;
4. enregistrer puis reconnecter l'utilisateur.

Les équipements techniques « ScenarioForm — ... » peuvent rester sur
**Aucun** dans l'onglet Équipements.

Le bandeau « Mode utilisateur » confirme qu'un compte non administrateur peut
saisir, exécuter les scénarios autorisés et consulter son historique. Les
fonctions de configuration restent masquées et protégées côté serveur.

Consulter également [`ACCES_UTILISATEUR.md`](../../ACCES_UTILISATEUR.md).

## Accès distant et sécurité

ScenarioForm utilise la session Jeedom. Pour un accès depuis Internet, utiliser
l'accès distant officiel ou le reverse proxy sécurisé de Jeedom avec HTTPS et
un certificat valide.

Le retour métier s'effectue localement de Jeedom vers lui-même. Il ne nécessite
aucun port supplémentaire ni exposition directe de l'API du plugin.

Les détails sont regroupés dans
[`SECURITE_ET_ACCES.md`](../../SECURITE_ET_ACCES.md).

## Diagnostic

| Situation | Action recommandée |
| --- | --- |
| ScenarioForm n'apparaît pas | Vérifier que le plugin est installé, activé et accessible sous **Accueil → ScenarioForm**. |
| Aucun scénario actif associé | Modifier le formulaire et activer au moins une association. |
| Droit d'exécution refusé | Accorder **Visualisation et exécution** dans l'onglet **Scénarios**, sur l'identifiant exact indiqué. |
| En attente | Patienter pendant le délai configuré ; le scénario n'a pas encore renvoyé son résultat. |
| Aucun retour reçu | Consulter le journal du scénario Jeedom et vérifier le bloc Code. |
| Lancement manuel ignoré | Comportement normal du scénario modèle ; lancer le formulaire depuis ScenarioForm. |
| Erreur métier | Lire le message retourné, corriger le traitement puis effectuer une nouvelle saisie. |

Le délai d'attente par défaut est de 120 secondes et peut être modifié dans la
configuration du plugin.

## Mettre à jour sans perdre ses données

Une mise à jour ScenarioForm conserve les requêtes, formulaires, champs,
associations, réponses et droits Jeedom portant sur des scénarios existants.
Effectuer néanmoins une sauvegarde Jeedom avant toute mise à jour.

Un droit doit être réattribué si un scénario est supprimé puis recréé, car son
identifiant change. Il n'est pas nécessaire de désactiver le plugin avant une
mise à jour.

Consulter [`INSTALLATION_V2.md`](../../INSTALLATION_V2.md) pour la procédure de
test et de retour arrière.

## Périmètre de la version 2.2

La version 2.2 couvre la création, la saisie, l'exécution, les retours métier,
les droits et l'historique opérationnel. Les fonctions avancées d'analyse, de
statistiques et de tableaux de bord historiques sont volontairement reportées
à une future version 2.3.


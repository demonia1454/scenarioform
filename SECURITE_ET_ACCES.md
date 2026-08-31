# ScenarioForm — sécurité et accès

Le guide général est disponible dans
[`docs/fr_FR/index.md`](docs/fr_FR/index.md).

## Rôles Jeedom

ScenarioForm s'appuie sur la session et les profils Jeedom.

- un administrateur peut créer, modifier, réorganiser et supprimer la
  configuration ScenarioForm ;
- un utilisateur authentifié peut consulter les éléments actifs, saisir un
  formulaire et consulter son propre historique ;
- un utilisateur limité doit disposer de **Visualisation et exécution** sur
  chaque scénario Jeedom associé au formulaire.

Le bandeau « Mode utilisateur » apparaît uniquement lorsque le compte connecté
n'est pas administrateur. Il rappelle les fonctions disponibles et ne signale
pas une erreur.

Les équipements techniques « ScenarioForm — ... » peuvent rester sur **Aucun**
dans les droits Équipements. Le droit indispensable se règle dans l'onglet
**Scénarios**.

## Accès distant et HTTPS

L'interface ScenarioForm suit exactement le mode d'accès de Jeedom. Pour une
utilisation depuis Internet, exposer uniquement l'accès distant officiel ou le
reverse proxy déjà sécurisé de Jeedom et utiliser HTTPS avec un certificat
valide. Il ne faut pas publier directement le dossier du plugin ni son point
d'API.

Le retour métier d'un scénario est un appel de Jeedom vers lui-même. Il utilise
l'adresse **interne** configurée dans Jeedom ; aucun accès distant ni ouverture
de port supplémentaire n'est nécessaire. Cette adresse interne peut être en
HTTP sur un réseau local de confiance ou en HTTPS si l'installation interne le
prévoit.

## Protection du retour métier

Pour chaque réponse, ScenarioForm génère :

- un secret aléatoire de callback, conservé en base uniquement sous forme de
  condensat SHA-256 ;
- un ticket de lancement aléatoire, valable deux minutes et consommé lors de
  son premier usage.

Le point de retour :

- accepte uniquement les requêtes POST ;
- limite la fréquence des appels ;
- compare les secrets en temps constant ;
- vérifie la réponse, le scénario associé et son état encore en attente ;
- limite le message métier à 500 caractères ;
- renvoie des réponses non mises en cache.

La destination du callback est reconstruite depuis l'adresse interne de
Jeedom. Une URL modifiée dans les tags ne peut donc pas provoquer une requête
vers un serveur arbitraire.

## Journaux

Les journaux peuvent contenir des identifiants techniques, des statuts et des
messages d'erreur nécessaires au diagnostic. Ils ne doivent contenir ni secret
de callback, ni ticket de lancement, ni configuration complète d'une réponse.

Avant de transmettre un journal à un tiers, vérifier malgré tout que les noms
de scénarios et les messages métier ne contiennent pas d'information
personnelle.

# Proposition — retour métier des scénarios

## Objectif

Distinguer le résultat technique du lancement d'un scénario de son résultat
métier différé. Un scénario correctement démarré peut ensuite accepter,
refuser ou accepter avec avertissement la demande.

## Contrat proposé

ScenarioForm crée la réponse avant le lancement et transmet à chaque scénario :

- `scenarioform_response_id` : identifiant de la réponse ;
- `scenarioform_callback_token` : secret aléatoire propre à la réponse ;
- `scenarioform_callback_url` : point de retour HTTPS ;
- `scenarioform_scenario_id` : scénario destinataire du résultat ;
- les tags métier déjà fournis par le formulaire.

Le retour accepte une charge minimale :

```json
{
  "response_id": 123,
  "scenario_id": 45,
  "token": "secret-aleatoire",
  "status": "accepted",
  "message": "Réservation acceptée"
}
```

États prévus : `pending`, `accepted`, `rejected`, `warning`, `error` et
`timeout`. Le message est facultatif et sa taille doit être limitée.

## Sécurité

- jeton généré avec une source cryptographique et conservé sous forme de
  condensat ;
- comparaison en temps constant ;
- réponse obligatoirement rattachée au formulaire et au scénario lancés ;
- transition d'état contrôlée et retour journalisé ;
- point de retour interne HTTP ou HTTPS, sans dépendre de l'authentification de
  la WebView et sans nécessiter d'accès distant ;
- limitation de fréquence et expiration du jeton.

## Persistance

Le premier palier peut utiliser `scenarioform_response.configuration` pour
stocker l'état global et les retours par scénario sans migration. Une table
dédiée `scenarioform_scenario_result` deviendra préférable si plusieurs
scénarios doivent répondre indépendamment, conserver plusieurs événements ou
être audités durablement.

## Actualisation de l'interface

Après l'exécution, l'historique affiche immédiatement `pending`. Tant qu'une
réponse visible contient cet état, le navigateur interroge `getHistory` toutes
les trois à cinq secondes, avec arrêt lorsque tous les scénarios sont terminés,
à la fermeture de la vue ou après expiration. Aucun rechargement complet du
formulaire n'est nécessaire.

## Découpage conseillé

1. Modèle d'état et stockage côté serveur.
2. Transmission de l'identifiant et du jeton aux scénarios.
3. Point de retour authentifié et idempotent.
4. Affichage de l'état dans l'historique.
5. Actualisation périodique et gestion du délai d'expiration.

Cette évolution ne remplace pas les contrôles métier du scénario. Elle fournit
uniquement un canal sécurisé pour restituer leur résultat à ScenarioForm.

## Palier r15

La r15 active ce contrat. Les quatre valeurs sont transmises comme tags Jeedom :

- `#scenarioform_response_id#` ;
- `#scenarioform_scenario_id#` ;
- `#scenarioform_callback_token#` ;
- `#scenarioform_callback_url#`.

Le scénario envoie une requête HTTP `POST` vers le tag URL avec les paramètres
`response_id`, `scenario_id`, `token`, `status` et `message`. Les statuts
terminaux acceptés sont `accepted`, `rejected`, `warning` et `error`.

## Palier r16

Un bloc Code Jeedom peut désormais transmettre un résultat en une seule ligne :

```php
scenarioform::sendResult($scenario, 'accepted', 'Export généré avec succès');
```

Les statuts utilisables restent `accepted`, `rejected`, `warning` et `error`.
La méthode récupère automatiquement les quatre tags, effectue le POST et
journalise le résultat sans exposer le jeton. Si le scénario est exécuté hors
de ScenarioForm, l'appel est ignoré proprement.

L'absence de cet appel ne maintient plus indéfiniment l'historique en attente.
Après le délai configuré dans la page de configuration du plugin (120 secondes
par défaut), chaque résultat encore `pending` passe à `timeout`, affiché comme
« Aucun retour reçu ». Le navigateur cesse alors son actualisation périodique.

## Palier r17 — actions graphiques Jeedom

L'installation ou la mise à jour crée un équipement technique invisible nommé
« ScenarioForm — Résultat métier ». Ses quatre commandes restent disponibles
dans le sélecteur de commandes de l'éditeur de scénarios :

- `Accepter` ;
- `Refuser` ;
- `Terminer avec avertissement` ;
- `Signaler une erreur`.

Chaque commande est de type `action/message`. Dans un bloc Action, l'utilisateur
sélectionne la commande et saisit uniquement le message à restituer. Les tags
ScenarioForm sont retrouvés automatiquement depuis le contexte d'exécution.
Les tags métier peuvent être employés dans le message et sont résolus par le
moteur de scénarios Jeedom.

La méthode PHP `scenarioform::sendResult()` reste disponible pour les usages
avancés, mais n'est plus nécessaire dans le parcours normal.

## Correctif r18

Les tags techniques utilisés par une commande native sont récupérés directement
depuis le contexte `scenarioExpression` actif. Ce repli est nécessaire lorsque
le cœur Jeedom ne les conserve pas sur l'objet scénario rechargé depuis son
identifiant. Aucun identifiant ni jeton ne doit être saisi dans l'action.

## Correctif r19 — commandes liées aux scénarios

Jeedom 4.6 ne transmet pas systématiquement l'identifiant du scénario appelant
à une commande `action/message`. ScenarioForm crée donc un équipement technique
distinct pour chaque scénario actif, par exemple « ScenarioForm — Génération
Export ». Chaque commande conserve l'identifiant de son scénario cible.

Si les tags de callback sont accessibles, le retour HTTP sécurisé reste
prioritaire. Sinon, la commande locale met à jour la réponse `pending` la plus
récente contenant ce scénario. Une commande exécutée manuellement sans réponse
en attente est ignorée proprement.

L'ancien équipement générique est supprimé pendant la mise à jour. Les actions
r17/r18 doivent être remplacées une fois par les commandes de l'équipement
propre au scénario.

## Correctif r20 — migration historique non répétée

La recopie des anciennes associations de scénarios portées par la requête vers
les associations propres aux formulaires n'est plus exécutée lors de chaque
mise à jour. Elle recréait indûment un scénario supprimé volontairement d'un
formulaire. La r20 respecte désormais strictement la configuration courante de
chaque formulaire.

## Correctif r21 — équipements ciblés et renommage

Les équipements de retour métier ne sont activés que pour les scénarios
présents dans `scenarioform_form_scenario`. Un équipement sans association est
désactivé et disparaît du sélecteur, tout en conservant ses commandes pour une
éventuelle réassociation.

Le nom visible est recalé sur le nom actuel du scénario à chaque synchronisation
des associations et lors du chargement de la liste des scénarios dans
ScenarioForm. Les actions déjà enregistrées restent liées à leur identifiant
interne et ne sont pas affectées par un renommage.

## Palier r23 — scénario modèle

Le bouton « Créer un scénario modèle » du formulaire actif demande un nom, crée
un scénario Jeedom actif dans le groupe `ScenarioForm`, lui ajoute un bloc Code
et l’associe automatiquement au formulaire.

Le code généré contient une variable PHP préfixée par `$sf_` pour chaque champ,
la détection d’un lancement depuis ScenarioForm, des valeurs vides pour un
lancement manuel et un squelette `try/catch`. Le retour positif utilise
`accepted`; une exception produit un retour `error` avant d’être relancée.

Le scénario nouvellement créé reste un patron : son bloc Code doit être ouvert
dans Jeedom et la section « TRAITEMENT À PERSONNALISER » doit être complétée.
Les scénarios déjà existants ne sont jamais modifiés automatiquement.

## Ajustement r26 — intégration au parcours de création

L’écran « Nouveau formulaire » propose désormais directement de créer et
d’associer un scénario modèle. Son nom est prérempli depuis celui du formulaire.
La validation crée l’ensemble en une seule opération et revient en arrière si
une étape échoue.

À ce stade, un nouveau formulaire ne possède généralement encore aucun champ :
le bloc Code contient alors le contexte, les valeurs par défaut et les retours
métier, mais aucune variable de champ. Le bouton conservé sur un formulaire
existant reste utile pour générer ultérieurement un autre modèle intégrant tous
les champs déjà configurés.

## Ajustement r27 — proposition au moment utile

La création anticipée de la r26 est retirée. Le parcours retenu devient :

1. créer le formulaire sans scénario ;
2. ajouter ses champs ;
3. revenir au formulaire et créer le scénario modèle proposé ;
4. personnaliser son bloc Code dans Jeedom.

Le bouton n’est visible que si le formulaire possède au moins un champ et aucun
scénario associé. Dès que le modèle est créé et associé, il disparaît. Un
scénario existant peut toujours être associé manuellement depuis l’éditeur du
formulaire ; dans ce cas, le bouton de création du modèle n’est pas proposé.

## Correctif r30 — contexte actif plutôt que tags présents

Jeedom peut conserver les tags d’une exécution précédente sur l’objet scénario.
Le test de présence de `#scenarioform_response_id#` ne suffit donc pas à
distinguer un lancement manuel.

Les nouveaux patrons utilisent désormais :

```php
$sf_lancement_scenarioform = scenarioform::isScenarioFormContext($scenario);
```

La méthode vérifie le jeton, le scénario destinataire, l’échéance et la présence
d’un résultat encore `pending`. Les tags d’une réponse terminée ou expirée sont
considérés comme résiduels. `sendResult()` applique aussi ce contrôle avant tout
appel HTTP.

## Correctif r31 — lancement manuel Jeedom

Le bouton « Exécuter » de Jeedom ajoute le tag standard `#trigger#` avec la
valeur `user`. Ce déclencheur invalide désormais systématiquement le contexte
ScenarioForm, même si une réponse précédente est encore en attente.

En complément, ScenarioForm transmet `#scenarioform_origin#` avec la valeur
`scenarioform`. Cette marque est exigée par la validation du contexte avant
d’entrer dans la branche avec tags ou d’envoyer le résultat métier.

## Correctif r32 — ticket de lancement consommable

Le tag standard `#trigger#` n’est pas présent dans tous les lancements
extérieurs à ScenarioForm. Il ne sert donc plus à décider de la branche.

Avant chaque lancement, ScenarioForm génère désormais un nonce aléatoire dans
`#scenarioform_launch_nonce#` et en conserve temporairement le condensat dans le
cache Jeedom. `isScenarioFormContext()` compare puis supprime ce ticket lors de
sa première utilisation. Le contexte reste reconnu dans le processus courant
jusqu’à `sendResult()`, mais ne peut pas être réutilisé par une exécution
ultérieure. Des tags anciens, même cryptographiquement valides et encore liés à
une réponse `pending`, ne suffisent donc plus.

## Correctif r33 — portée de la branche ScenarioForm

Le journal de diagnostic a confirmé que la r32 distingue correctement les deux
cas (`context=OUI` via ScenarioForm et `context=NON` via le bouton Jeedom). Le
traitement restait cependant situé après la fermeture de cette condition : il
s'exécutait donc aussi lors d'un lancement manuel, avec des variables vides.

Dans les nouveaux scénarios modèles, la lecture des tags, toute la zone
« TRAITEMENT À PERSONNALISER », la construction du message et `sendResult()`
sont maintenant réunies dans la branche `context=OUI`. La branche manuelle ne
fait qu'ajouter au journal :

```text
ScenarioForm : lancement manuel ignoré par le scénario modèle.
```

Pour protéger les personnalisations, l'installation de la mise à jour ne
modifie pas les blocs Code déjà créés. Il faut déplacer leur traitement dans la
condition existante, ou créer un nouveau scénario modèle puis y reporter le
traitement.

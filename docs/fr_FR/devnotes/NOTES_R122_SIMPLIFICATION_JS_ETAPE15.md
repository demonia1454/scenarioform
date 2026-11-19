# ScenarioForm R122 — Étape 15

Base : E13 validée sur Jeedom 4.6 ; E14 était un audit sans modification.

## Modification ciblée

Dans `core/ajax/scenarioform.ajax.php`, action `createScenarioTemplate`, le serveur refuse désormais explicitement la création d'un scénario modèle si le formulaire possède déjà un scénario associé, **avant** de créer un objet scénario Jeedom. Lorsque le formulaire ne possède aucun scénario, le nouveau scénario est associé directement comme scénario unique.

Le bouton de l'interface n'est normalement affiché que lorsque le formulaire ne possède aucun scénario. Cette vérification PHP protège également les appels directs.

Aucun changement aux autres mécanismes : remplacement de scénario, transfert des champs, historique, variables, champs en lecture seule et retour métier.

## Action héritée

`reorderFormScenarios` reste présente pour cette étape. Aucun appel interne n'a été trouvé lors de l'audit E14, mais les appels externes ne sont pas exclus. Sa suppression n'est pas nécessaire à la correction ciblée E15.

## Validation

`bash tests/run_all.sh` et `php -l core/ajax/scenarioform.ajax.php` ont été exécutés pour cette livraison. Le test `tests/create_scenario_template_regression.js` vérifie statiquement la position du contrôle, l'association unique et le nettoyage en cas d'échec. Ces tests ne remplacent pas un essai réel sur Jeedom.

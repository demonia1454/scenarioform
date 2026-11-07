# R122 — simplification JavaScript étape 8

Extraction des événements délégués Modifier/Supprimer du tableau des champs dans `desktop/js/scenarioform_fields.js`, via `scenarioformBindFieldsTableEvents()`. Le rendu `renderFields()` conserve sa signature et appelle cette fonction après construction du tableau. Confirmation, requête AJAX et rafraîchissement inchangés.

Les tests de non-régression ciblés incluent la vérification des liaisons idempotentes et des appels existants. La suite statique historique peut nécessiter adaptation aux fonctions déplacées.

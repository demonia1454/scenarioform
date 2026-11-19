# R122 — simplification JavaScript, étape 3

- Ajout de `scenarioformAjaxAlertError(message)` dans `desktop/js/scenarioform_helpers.js`.
- Migration ciblée des callbacks d'erreur réseau de `replaceFormScenario` et `reorderForms`.
- Messages, niveau d'alerte, paramètres AJAX et callbacks de succès inchangés.
- Aucun changement PHP, aucune modification des retours métier ou des validations de dates.
- Test automatisé ajouté : `tests/ajax_error_helper_regression.js`.
- Vérifier sur Jeedom : remplacement d'un scénario, réordonnancement des formulaires, comportement en cas de panne réseau.

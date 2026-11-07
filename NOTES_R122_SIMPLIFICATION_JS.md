# R122 — Simplification JavaScript, première passe

Base : R122 correctif dates en lecture seule.

- Extraction des fonctions `scenarioformEscapeHtml`, `scenarioformEscapeAttribute` et `scenarioformBuildPlaceholder` dans `desktop/js/scenarioform_helpers.js`.
- Chargement de ce fichier avant `scenarioform.js` via `include_file` Jeedom.
- Conservation des noms de fonctions globaux, de leurs signatures et de leurs implémentations.
- Ajout de tests Node.js ciblés dans `tests/helpers_regression.js`.
- Aucun changement intentionnel des formulaires, des dates, des requêtes AJAX ou de l'interface.

Attention : cette extraction est une première étape et ne représente pas une refonte complète. Validation manuelle sur Jeedom 4.6 nécessaire (chargement des scripts, création et validation de formulaires, remplacement de scénario, lecture seule des dates, retours métier).

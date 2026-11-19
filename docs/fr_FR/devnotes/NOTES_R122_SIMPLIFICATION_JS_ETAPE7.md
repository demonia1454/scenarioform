# R122 — Simplification JS, étape 7

Base : R122 étape 6 corrigée, validée sur Jeedom 4.6.

- Extraction du rendu HTML du tableau des champs vers `desktop/js/scenarioform_fields.js` (`scenarioformBuildFieldsTable`).
- `renderFields` conserve les événements et les actions du tableau dans `scenarioform.js`.
- Ajout du chargement du module avant le fichier principal et d’un test Node dédié.
- Aucun changement du PHP métier, de la validation des champs, de l’historique ni des variables Jeedom.
- La suite historique `static_checks.sh` comporte des assertions liées à l’ancien emplacement du code et doit encore être adaptée.

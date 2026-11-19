# R122 — Étape 10 : événements de l’éditeur de champs

Base : étape 9 validée sur Jeedom 4.6.

- Déplacement des liaisons des boutons `#bt_saveField` et `#bt_cancelField` de `loadFieldEdit()` vers `scenarioformBindFieldEditorEvents(formId)` dans `desktop/js/scenarioform_fields.js`.
- Préservation de `.off('click').on('click', ...)`, des identifiants transmis à `saveField()`, et du retour à `loadFieldList(formId)`.
- Aucun changement PHP, AJAX, validation ou logique métier.
- Ajout d'un test de régression des deux boutons et de l'absence de doublons de gestionnaires.

Exécuter : `bash tests/run_all.sh`. La validation sur Jeedom reste nécessaire.

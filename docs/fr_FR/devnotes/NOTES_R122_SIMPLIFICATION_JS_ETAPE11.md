# R122 — Étape 11 : liste des champs

Base : archive stable R122 étape 10 fournie.

- Déplacement sans modification de `renderFields(fields)` et `loadFieldList(formId, scenarioId)` de `desktop/js/scenarioform.js` vers `desktop/js/scenarioform_fields.js`.
- Les paramètres AJAX, la gestion des erreurs, le rendu, les événements et l'actualisation du bouton de modèle restent identiques.
- Aucun fichier PHP, classe métier, scénario ni variable Jeedom modifié.
- Ajout du test `tests/field_list_module_regression.js` (requête, scénario, rendu, erreur).
- Ajustement des mocks de deux tests existants pour tenir compte du nouveau module propriétaire de `loadFieldList`.

Commande exécutée : `bash tests/run_all.sh` — succès.

La validation fonctionnelle sur Jeedom 4.6 reste nécessaire avant toute étape 12.

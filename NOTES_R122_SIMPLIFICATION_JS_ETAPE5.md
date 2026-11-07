# R122 — Simplification JavaScript, étape 5

Base : étape 4 validée sur Jeedom 4.6.

Extraction ciblée de la collecte de configuration du formulaire depuis `saveForm()` vers `scenarioformCollectFormSaveData(formId, action)` dans `desktop/js/scenarioform_forms.js`.

Conservés à l'identique : sélecteurs DOM, noms des paramètres AJAX, valeurs, association des scénarios, option de retour métier, action createForm/saveForm, callbacks et gestion d'erreurs, PHP.

Tests : `node tests/form_save_payload_regression.js`, autres tests de régression, vérification syntaxique. Validation Jeedom nécessaire.

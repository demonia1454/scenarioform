# R122 — Simplification JavaScript, étape 4

Base : étape 3 validée par l’utilisateur.

## Changement ciblé
- Nouveau module `desktop/js/scenarioform_forms.js` chargé après les utilitaires et avant le script principal.
- Déplacement à l’identique de `renderFormScenarioEditor(available, selected)` et `collectFormScenarioIds()` ; noms globaux et signatures conservés.
- Aucun changement de PHP métier, AJAX, champs, dates ou droits.

## Tests
- `node --check` sur les trois scripts.
- `tests/forms_module_regression.js` : ordre d’affichage, cases cochées et collecte des associations.
- Suites de régression existantes exécutées séparément.

## Essais Jeedom
- Ouvrir un formulaire associé à plusieurs scénarios.
- Vérifier les cases, l’ordre et l’option « Attendre un retour métier ».
- Modifier une association et enregistrer, puis rouvrir le formulaire.
- Vérifier le remplacement de scénario et un formulaire d’absence.

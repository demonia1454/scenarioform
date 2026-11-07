# R122 — Étape 9 : remise à niveau des tests

Base : R122 étape 8 validée sur Jeedom 4.6.

## Portée
- Aucune modification du code de production : seules les vérifications de `tests/` et cette note changent.
- Actualisation des chemins des fonctions déplacées vers `scenarioform_helpers.js`, `scenarioform_forms.js` et `scenarioform_fields.js`.
- Actualisation d'une assertion sur les boutons du formulaire : elle inclut désormais `#bt_openMoveForm`.
- Le test du nombre d'occurrences du délai de retour métier impose désormais un minimum de trois, sans bloquer les nouveaux usages valides.
- Correction de vérifications `sed | grep -q` susceptibles de provoquer une erreur SIGPIPE (141) sous `pipefail`.
- Ajout de `tests/module_loading_regression.js` : ordre de chargement, présence des fichiers, unicité des fonctions extraites.
- Ajout de `tests/run_all.sh` : lance l'analyse syntaxique, tous les tests JS et la suite statique historique.

## Exécution
Depuis la racine du plugin : `bash tests/run_all.sh`

## Résultat local
Suite complète : OK. Ne remplace pas la validation Jeedom 4.6.

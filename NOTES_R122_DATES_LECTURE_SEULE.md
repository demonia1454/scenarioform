# R122 — Correctif dates en lecture seule

Dans `core/ajax/scenarioform.ajax.php`, lors de l'exécution, les champs `datetime` utilisant une variable Jeedom en mode `readonly` normalisent les formats `Y-m-d H:i:s`, `Y-m-d H:i`, `d/m/Y H:i:s` et `d/m/Y H:i` vers `Y-m-d H:i` avant la validation existante. Les dates impossibles restent rejetées. Les champs modifiables ne changent pas.

## Vérifications à réaliser sur Jeedom

1. Sauvegarder Jeedom avant installation.
2. Annulation : dates en lecture seule, même année puis années différentes.
3. Programmation : champs modifiables, vérifier l'enregistrement.
4. Tester une date invalide et les champs numériques en lecture seule.
5. Pour le problème distinct de non-effacement : relever la valeur du tag `#annuler#` dans les logs, et vérifier `AbsDebPro` et `AbsFinPro` après exécution. Ne pas modifier les données de production sans sauvegarde.

Tests locaux : syntaxe PHP, tests statiques et régression JavaScript. Pas de test d'intégration sur Jeedom réel.

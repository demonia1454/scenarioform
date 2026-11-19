# R122 — Simplification JavaScript, étape 2 (transport AJAX)

Base : R122 simplification JS étape 1, validée manuellement.

- Sept appels AJAX de gestion des requêtes et formulaires passent désormais par `scenarioformAjax(options)` dans `scenarioform_helpers.js`.
- Cette fonction délègue directement à `$.ajax(options)` sans modifier les paramètres, les callbacks, les messages ni le traitement des erreurs.
- Aucun changement PHP, aucune modification de l’API et aucun changement des appels d’exécution ou de retour métier.
- Test automatisé de transparence du transport ajouté.
- La centralisation des traitements d’erreur est **reportée** : elle requiert une cartographie des réponses et une validation Jeedom plus poussée.

## Vérifications manuelles recommandées
- Afficher et modifier une requête.
- Afficher et modifier un formulaire.
- Réordonner les requêtes et les formulaires.
- Remplacer un scénario associé à un formulaire (sur environnement de test).
- Charger la liste des scénarios lors de la création d’un formulaire.
- Vérifier que les messages d’erreur habituels restent identiques.

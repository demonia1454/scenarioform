# R122 — Étape 6 corrigée : historique et variables en lecture seule

- Base : étape 5 validée.
- Lors de « Réutiliser ces valeurs », recharger les champs depuis Jeedom via getFieldList avant d’appliquer l’historique.
- Éviter le rechargement en boucle grâce au marqueur interne du clic de reprise.
- Ne pas vider ni remplacer les champs en lecture seule liés à une variable Jeedom.
- Conserver les valeurs historiques pour les autres champs et dans la consultation de l’historique.
- Actualiser l’aide du CRUD.
- Aucun changement PHP.

À tester : variable modifiée après exécution, reprise de l’historique, édition d’une réponse, champs modifiables et lecture seule, comportement en cas d’échec de getFieldList.

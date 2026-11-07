# R122 — E15 correctif affichage après création du scénario modèle

La création guidée déclenchait uniquement `loadRequestForm`, laissant le bandeau de la liste des formulaires sur « Aucun scénario » jusqu’à F5. Le gestionnaire appelle désormais `loadRequestDetail(requestId, formId)` afin de recharger les associations et de resélectionner le formulaire concerné.

Aucune modification PHP ni du stockage. Test statique de régression ajouté (`tests/template_refresh_regression.js`). À confirmer sur Jeedom 4.6 avant validation E15.

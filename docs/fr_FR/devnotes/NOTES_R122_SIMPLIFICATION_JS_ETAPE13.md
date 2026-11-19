# R122 — Étape 13 — Libellé et nettoyage de l’ancien éditeur multiscénario

Base : `ScenarioForm_R122_E12_test.zip`, validée sur Jeedom 4.6.

## Modifications
- Libellé de l’éditeur : « Scénario associé » au lieu de « Scénario principal ».
- Texte d’aide et avertissement harmonisés.
- Suppression du gestionnaire d’événement `.bt_replace_form_scenario`, qui n’est plus rendu depuis E12.
- Suppression des règles CSS propres à l’ancien tableau de scénarios sélectionnables/triables, également non rendu depuis E12.
- Aucune modification PHP, SQL, des associations, des champs, des variables, de l’historique ou des retours métier. L’API de remplacement reste disponible.
- Contrôles de non-régression ajoutés aux tests.

## Essais Jeedom
Vérifier la sélection « Scénario associé », le changement de scénario avec conservation des champs, l’enregistrement et l’exécution du formulaire, les champs en lecture seule et l’historique.

Ne pas poursuivre sans validation sur Jeedom 4.6.

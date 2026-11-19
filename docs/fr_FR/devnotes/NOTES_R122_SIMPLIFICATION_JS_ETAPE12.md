# R122 — Étape 12 — Scénario principal unique

Base : `ScenarioForm_R122_E11_test.zip` (E11 validée sur Jeedom 4.6).

## Modifications
- Éditeur de formulaire : sélection d'un scénario principal unique au lieu de cases multiples, tri et glisser-déposer supprimés de cet éditeur.
- Option « Attendre un retour métier » conservée pour le scénario sélectionné.
- Contrôle serveur dans `scenarioformForm::syncScenarios` : refus des nouvelles associations de plusieurs scénarios, même si une requête AJAX contourne l'interface.
- Les formulaires sans scénario restent autorisés en phase de préparation.
- Les associations existantes, champs, historique et retours métier ne sont pas supprimés par une migration.
- Tests du module formulaire mis à jour pour la sélection unique, l'absence de sélection et l'avertissement sur un ancien formulaire multiscénario.

## Attention aux anciens formulaires multiscénarios
Ils sont affichés avec un avertissement et aucun scénario présélectionné. La sauvegarde nécessite de choisir un scénario principal. Si les autres scénarios possèdent des champs, le mécanisme de protection existant bloque leur suppression automatique : aucune migration destructive n'est effectuée.

## Validation
`bash tests/run_all.sh` : OK.
Essais sur Jeedom 4.6 : à effectuer par l'utilisateur avant toute nouvelle étape.

## À vérifier sur Jeedom
- Créer un formulaire avec un scénario principal ; vérifier l'enregistrement et la saisie.
- Modifier le scénario principal avec conservation des champs (transfert déjà prévu par E11).
- Vérifier l'option de retour métier, les champs en lecture seule et l'historique.
- Vérifier qu'un formulaire existant avec un seul scénario continue à s'exécuter sans choix supplémentaire.

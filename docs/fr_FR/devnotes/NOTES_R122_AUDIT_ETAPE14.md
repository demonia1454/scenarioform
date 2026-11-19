# ScenarioForm R122 — Étape 14 : audit sans modification fonctionnelle

Date : 5 novembre 2026. Référence : E13 validée sur Jeedom 4.6.

## Périmètre
Inspection des fichiers desktop/js, desktop/css, core/ajax, core/class, mobile et tests. Aucun code exécutable modifié.

## Vérifications
- `bash tests/run_all.sh` : succès (code retour 0).
- Tests JS, sécurité et contrôles statiques : succès selon la suite existante.
- Les tests ne constituent pas une validation complète des parcours Jeedom, de la base de données ou des scénarios réels.

## Constats prioritaires
1. `core/ajax/scenarioform.ajax.php`, action `reorderFormScenarios` (vers ligne 2051) : action héritée du multiscénario ; aucune référence appelante retrouvée dans les fichiers desktop/mobile/tests lors de la recherche textuelle. Candidate à suppression **après** vérification des éventuels appels externes et des protections serveur.
2. `core/ajax/scenarioform.ajax.php`, création guidée de scénario (vers lignes 1589–1594) : ajoute le nouveau scénario à la liste des scénarios existants avant `syncScenarios`. Or `core/class/scenarioformForm.class.php::syncScenarios` rejette plus d'un scénario depuis E12. Sur formulaire déjà associé, le parcours peut donc échouer. Tester le parcours et décider si la création doit remplacer, refuser explicitement ou proposer une autre action ; ne pas changer silencieusement la sémantique.
3. `core/class/scenarioformResponse.class.php::launchScenarios` (vers ligne 221) : nom et boucle hérités de l'exécution multiple, mais méthode encore appelée par plusieurs parcours AJAX (exécution, relance, retour). **À conserver** pour l'instant.
4. `core/class/scenarioformForm.class.php::syncScenarios` : méthode utilisée pour création/modification et remplacement ; contient la protection d'un scénario et le transfert de champs. **À conserver**.
5. `scenarioformRequestScenario` et `scenarioformRequest` : liens requête/scénario distincts des liens formulaire/scénario. **Ne pas supprimer** sur simple ressemblance de nom.
6. Les identifiants `scenario_id` restent nécessaires pour champs, historique, réponse, réexécution et sécurité. Ne pas supprimer ces références.
7. Message d'exécution de la suite : « Suite complète R122 étape 9 : OK », libellé ancien dans `tests/run_all.sh` ; correction cosmétique possible ultérieurement.
8. Messages PHP internes faisant encore référence à « scénario principal » dans `syncScenarios` : vocabulaire à harmoniser éventuellement, séparément des changements de logique.

## Recommandations
- E15 : commencer par un test de régression ciblé de la création guidée sur formulaire déjà associé, puis traiter le parcours si nécessaire ; supprimer `reorderFormScenarios` uniquement après examen des usages externes et compatibilité.
- E16 : contrôle transversal de la sécurité, du transfert de champs, des valeurs en lecture seule, de l'historique, du retour métier et des scénarios, complété par les essais Jeedom.
- E13 reste la version stable. L'audit ne justifie aucune modification fonctionnelle immédiate.

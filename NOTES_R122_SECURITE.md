# ScenarioForm R122 — Première passe de sécurisation

## Modification effectuée

- `purgePreviousFormReports` est désormais réservé à l'administrateur côté serveur.
  En R121, cette action supprimait des documents de réponses pour un formulaire
  sans vérifier le propriétaire des réponses concernées. Une session utilisateur
  authentifiée pouvait donc déclencher la purge d'un formulaire accessible par ID.
- Ajout de `tests/security_guards.js` : garde administrateur, présence de contrôles
  de propriété sur les actions d'historique, rechargement des droits.

## Limites et vérifications à poursuivre

- Les tests ajoutés sont **statiques** : ils ne simulent pas des sessions Jeedom.
- Tester sur une installation Jeedom 4.6 avec comptes administrateur et limité.
- Vérifier si le bouton de purge doit être masqué aux non-administrateurs ; le
  refus serveur est la protection effective.
- Vérifier l'exposition des messages d'exception (`$e->getMessage()`) aux clients.
- Auditer les autres actions AJAX et les points d'entrée API, notamment les
  permissions d'exécution et les secrets.
- Refactorisation JS **non entamée** pour éviter de mélanger une correction de
  sécurité et un changement de structure dans la même première passe.

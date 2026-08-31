# ScenarioForm V2 - installation de test

Cette version introduit plusieurs formulaires par requête et une liste ordonnée
de scénarios propre à chaque formulaire.

Pour une première prise en main complète, suivre
[`EXEMPLE_PRET_A_EMPLOI.md`](EXEMPLE_PRET_A_EMPLOI.md).

Pour permettre la saisie avec un compte non administrateur, suivre
[`ACCES_UTILISATEUR.md`](ACCES_UTILISATEUR.md).

Pour les droits, l'accès distant, HTTPS et les journaux, consulter
[`SECURITE_ET_ACCES.md`](SECURITE_ET_ACCES.md).

Le guide principal orienté usages est disponible dans
[`docs/fr_FR/index.md`](docs/fr_FR/index.md).

## Avant installation

1. Effectuer une sauvegarde complète depuis Jeedom et la télécharger.
2. Sauvegarder `/var/www/html/plugins/scenarioform`.
3. Conserver un export ou une sauvegarde Jeedom contenant la base de données.
4. Tester d'abord dans `/home/jeedom/scenarioform-dev/scenarioform`.

## Migration

Le hook `scenarioform_update()` est idempotent :

- il conserve `scenarioform_request_scenario` ;
- il crée `scenarioform_form_scenario` ;
- il copie les anciennes associations de chaque requête vers ses formulaires ;
- il ne supprime aucune réponse, aucun champ et aucune association historique.

La migration doit être déclenchée par le mécanisme de mise à jour Jeedom. Ne
supprimez pas l'ancienne table avant validation complète de la V2.

## Contrôles après mise à jour

1. Ouvrir chaque requête existante.
2. Vérifier son ou ses formulaires.
3. Vérifier les scénarios migrés sur chaque formulaire.
4. Tester l'ordre par glisser-déposer puis avec Monter/Descendre.
5. Enregistrer, recharger et contrôler l'ordre.
6. Tester un formulaire avec champs requis et facultatifs.
7. Tester date, heure, date/heure et booléen.
8. Exécuter un formulaire de test et consulter son historique.

## Retour arrière

Le retour arrière complet doit restaurer ensemble le dossier du plugin et la
sauvegarde de base réalisée avant migration. La table historique n'étant pas
supprimée, un retour au code précédent reste possible, mais une restauration
complète demeure la procédure la plus sûre.

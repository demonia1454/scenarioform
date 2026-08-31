# ScenarioForm

ScenarioForm est un plugin pour Jeedom 4.6 permettant d’exécuter des scénarios depuis des formulaires personnalisables.

> **Version bêta.** ScenarioForm V2.2 bêta 1 — r55 doit d’abord être installé et validé sur une instance de test. Effectuez une sauvegarde complète de Jeedom avant toute installation ou mise à jour.

## Fonctionnalités

- plusieurs requêtes et plusieurs formulaires par requête ;
- champs obligatoires ou facultatifs ;
- champs texte, numériques, date, heure, date/heure, booléens et listes ;
- association ordonnée de plusieurs scénarios à chaque formulaire ;
- réorganisation par glisser-déposer ou avec Monter/Descendre ;
- validation côté navigateur et côté serveur ;
- historique des réponses, valeurs et résultats métier ;
- accès limité aux utilisateurs Jeedom autorisés.

## Compatibilité

- Jeedom 4.6 ;
- interface en français ;
- aucune dépendance ni démon propre au plugin.

## Documentation

- [Guide utilisateur](docs/fr_FR/index.md)
- [Installation et migration](INSTALLATION_V2.md)
- [Exemple prêt à l’emploi](EXEMPLE_PRET_A_EMPLOI.md)
- [Accès utilisateur](ACCES_UTILISATEUR.md)
- [Sécurité et accès](SECURITE_ET_ACCES.md)
- [Historique des changements](CHANGELOG.md)

## Installation de la bêta

1. Téléchargez l’archive de la Release r55 et son fichier `.sha256`.
2. Vérifiez l’empreinte SHA-256 avant installation.
3. Effectuez une sauvegarde complète de Jeedom et conservez-en une copie hors de l’instance.
4. Suivez [INSTALLATION_V2.md](INSTALLATION_V2.md).
5. Contrôlez les requêtes, formulaires, scénarios associés, validations et historiques après mise à jour.

## Tests

```bash
bash tests/static_checks.sh
node tests/validation_regression.js
```

Le lint PHP doit être exécuté dans un environnement disposant d’une version de PHP compatible avec Jeedom 4.6.

## Licence

Ce projet est distribué sous licence MIT. Consultez [LICENSE](LICENSE).

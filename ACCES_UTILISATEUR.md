# ScenarioForm — accès d’un utilisateur non administrateur

Le parcours utilisateur complet est décrit dans
[`docs/fr_FR/index.md`](docs/fr_FR/index.md).

ScenarioForm peut être utilisé sans donner de droits administrateur Jeedom.

## Configuration recommandée

1. Dans **Réglages → Système → Utilisateurs**, choisir le profil
   **Utilisateur limité**.
2. Ouvrir **Droits** pour cet utilisateur.
3. Dans l’onglet des scénarios, accorder **Visualisation et exécution**
   uniquement aux scénarios que ses formulaires ScenarioForm doivent lancer.
4. Enregistrer, puis ouvrir une nouvelle session avec ce compte et accéder à
   ScenarioForm.

## Fonctions disponibles

L’utilisateur peut :

- voir les requêtes et formulaires actifs ;
- saisir et valider les valeurs ;
- lancer les scénarios pour lesquels il possède le droit d’exécution ;
- suivre le retour métier attendu ;
- consulter et reprendre ses propres saisies.

Il ne peut pas créer, modifier, réorganiser ou supprimer les requêtes,
formulaires, champs, associations, scénarios ou éléments d’historique.

Les réponses antérieures à la r41 ne possèdent pas d’utilisateur propriétaire :
elles restent visibles uniquement des administrateurs.

## Diagnostic

Le message « Vous ne disposez pas du droit d’exécution… » indique que le droit
**Visualisation et exécution** manque pour au moins un scénario associé au
formulaire. Tous les scénarios associés doivent être autorisés.

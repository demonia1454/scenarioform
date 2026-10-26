# ScenarioForm — guide d'utilisation

ScenarioForm permet de lancer des scénarios Jeedom depuis des formulaires
personnalisés, puis de suivre leur résultat métier et de retrouver les saisies
dans un historique.

## Comprendre l'organisation

- une **requête** regroupe un ou plusieurs formulaires liés à un même usage ;
- un **formulaire** présente les valeurs à saisir ;
- un **champ** transmet sa valeur au scénario sous forme de tag Jeedom ;
- un ou plusieurs **scénarios** traitent la saisie ;
- une **réponse** mémorise les valeurs, les lancements et les résultats métier.

Exemple : la requête « Présence » peut contenir le formulaire « Je rentre »,
avec une date et un commentaire, puis lancer un scénario qui prépare le
logement.

## Créer rapidement un premier exemple

Avec un compte administrateur :

1. ouvrir **Accueil → ScenarioForm** ;
2. choisir **Assistant premier formulaire** ;
3. conserver ou adapter les noms proposés ;
4. choisir **Créer l'exemple** ;
5. sélectionner **Saisir les valeurs**, indiquer une date puis choisir
   **Valider et exécuter** ;
6. consulter le résultat et l'historique.

L'assistant crée une nouvelle requête, un nouveau formulaire, deux champs et un
nouveau scénario prêt à tester. Il ne modifie aucun élément existant.

Le parcours manuel détaillé est disponible dans
[`EXEMPLE_PRET_A_EMPLOI.md`](../../EXEMPLE_PRET_A_EMPLOI.md).

## Créer son propre formulaire

### 1. Créer une requête

Choisir **Nouvelle requête**, renseigner un nom et une description, puis
sélectionner **Créer la requête**.

### 2. Créer un formulaire

Ouvrir la requête, choisir **Créer un formulaire**, renseigner son nom et sa
description puis valider.

Les actions **Créer**, **Modifier** et **Supprimer le formulaire** sont
regroupées dans l'en-tête. La suppression conserve les scénarios Jeedom mais
supprime les champs, associations, réponses et valeurs du formulaire après
confirmation.

### 3. Ajouter les champs

Choisir **Ajouter des champs**. Chaque champ possède au minimum :

- un tag technique sans `#`, par exemple `date_depart` ;
- un libellé affiché, par exemple « Date de départ » ;
- un type ;
- un caractère obligatoire ou facultatif ;
- un ordre d'affichage.

Les types disponibles couvrent notamment le texte, le texte long, la date,
l'heure, la date et l'heure, les nombres, l'adresse électronique, la case à
cocher et la liste de choix. Des bornes, longueurs et comparaisons entre champs
temporels peuvent être ajoutées selon le type.

### 4. Associer un scénario

Deux possibilités existent :

- associer un scénario Jeedom existant dans **Modifier le formulaire** ;
- choisir **Créer un scénario modèle** après avoir ajouté les champs.

Le scénario modèle contient déjà la lecture des tags, la protection du contexte
ScenarioForm, la gestion des erreurs et l'envoi du résultat. Seules les zones
explicitement balisées « TRAITEMENT À PERSONNALISER » et « MESSAGE DE RETOUR »
doivent être adaptées.

Le bouton **Ouvrir le scénario** permet d'accéder directement à l'éditeur
Jeedom. Un lancement manuel du scénario modèle est volontairement ignoré.

## Utiliser un formulaire au quotidien

1. choisir une requête puis un formulaire ;
2. sélectionner **Saisir les valeurs** ;
3. compléter les champs ;
4. choisir **Valider et exécuter** ;
5. suivre les résultats attendus ;
6. utiliser **Nouvelle saisie** ou **Voir l'historique**.

Pendant la saisie, un administrateur peut utiliser **Ajouter une valeur** sous
une liste de choix. La nouvelle valeur est enregistrée dans la configuration du
champ, ajoutée à la liste puis sélectionnée. Cette commande n'est pas affichée
aux utilisateurs non administrateurs.

Lorsqu’un formulaire contient plusieurs scénarios, choisissez d’abord le
scénario à exécuter. ScenarioForm affiche uniquement les champs associés à ce
scénario et ne lance que celui-ci.

Dans la gestion des champs d’un formulaire associé à un seul scénario, utilisez
**Copier depuis…** pour choisir un binôme formulaire/scénario parmi les autres
formulaires de la même requête. Les champs sont dupliqués avec de nouveaux
identifiants et peuvent ensuite évoluer indépendamment.

Lorsqu'un scénario est configuré sans retour métier attendu, il est présenté
comme lancé immédiatement. Lorsqu'un retour est attendu, ScenarioForm suit les
états `accepted`, `rejected`, `warning`, `error` ou `timeout`.

Pendant cette attente, **Retour — continuer en arrière-plan** permet de quitter
l'écran sans interrompre le scénario. Le suivi visuel s'arrête dans le
navigateur, mais l'éventuel retour métier reste enregistré et peut être
consulté ultérieurement dans l'historique.

## Consulter et reprendre l'historique

Le bouton **Historique** affiche les réponses du formulaire. Une saisie peut
être reprise pour préremplir un nouveau formulaire.

L’ouverture affiche d’abord la **Liste**. Le bouton **Statistiques** donne
ensuite accès à la synthèse de la période ; **Liste** revient aux exécutions.
Un clic sur un indicateur statistique ouvre la liste filtrée correspondante.

La vue statistique calcule les taux de succès et d’incident, les absences de
retour, les durées moyenne, minimale et maximale, ainsi que l’évolution des
exécutions. L’analyse des champs dépend de leur type : minimum/moyenne/maximum
pour les nombres, proportions pour les booléens, fréquences pour les choix et
textes, regroupement chronologique pour les dates. Les résultats portent sur le
formulaire ouvert et la période choisie ; les anciennes données incomplètes sont
ignorées uniquement pour le calcul qu’elles ne permettent pas d’effectuer.

Pour une période bornée, la vue compare automatiquement les résultats avec la
période précédente de même durée et signale l’évolution du taux d’incident. Elle
présente aussi l’évolution des valeurs numériques, les scénarios les plus souvent
en échec et les formulaires les plus utilisés. Le classement transverse respecte
les droits : un utilisateur limité ne voit que ses propres exécutions.

La liste présente une synthèse sur deux lignes. **Détails** déplie les valeurs,
le résultat technique du lancement et le résultat métier complet.

La période, le statut et la recherche dans les valeurs ou messages permettent
de réduire la liste. L’historique est déjà limité au formulaire ouvert. La
durée de chaque scénario apparaît dans son résultat lorsqu’elle est disponible.
**Exporter la sélection (.csv)** télécharge exactement la sélection affichée, avec une colonne
par champ et les résultats de lancement et métier.

- un administrateur voit l'ensemble de l'historique ;
- un utilisateur non administrateur voit uniquement ses propres réponses ;
- chaque utilisateur peut supprimer une de ses réponses ou vider sa propre
  partie de l'historique ;
- les anciennes réponses sans propriétaire restent visibles uniquement des
  administrateurs.

La suppression d'une réponse ou le vidage de l'historique supprime également
ses valeurs et résultats associés après confirmation.

## Donner accès à un utilisateur limité

Dans **Réglages → Système → Utilisateurs → Droits** :

1. choisir l'onglet **Scénarios** ;
2. repérer chaque scénario associé au formulaire ;
3. sélectionner **Visualisation et exécution** ;
4. enregistrer puis reconnecter l'utilisateur.

Les équipements techniques « ScenarioForm — ... » peuvent rester sur
**Aucun** dans l'onglet Équipements.

Le bandeau « Mode utilisateur » confirme qu'un compte non administrateur peut
saisir, exécuter les scénarios autorisés et consulter son historique. Les
fonctions de configuration restent masquées et protégées côté serveur.

Consulter également [`ACCES_UTILISATEUR.md`](../../ACCES_UTILISATEUR.md).

## Accès distant et sécurité

ScenarioForm utilise la session Jeedom. Pour un accès depuis Internet, utiliser
l'accès distant officiel ou le reverse proxy sécurisé de Jeedom avec HTTPS et
un certificat valide.

Le retour métier s'effectue localement de Jeedom vers lui-même. Il ne nécessite
aucun port supplémentaire ni exposition directe de l'API du plugin.

### Compte rendu métier enrichi

Le message simple reste suffisant dans la majorité des cas. Un scénario peut
aussi fournir un quatrième argument facultatif à `sendResult` pour créer un
compte rendu consultable depuis le bouton **Compte rendu** de l'historique :

```php
$document = [
    'title' => 'Compte rendu du traitement',
    'summary' => 'La préparation du logement est planifiée.',
    'event_at' => $dateRetour->format('Y-m-d 18:00:00'),
    'sections' => [
        ['title' => 'Échéance', 'content' => $dateRetour->format('d/m/Y')],
        ['title' => 'Actions', 'content' => ['Chauffage programmé', 'Éclairage vérifié']],
        ['title' => 'Paramètres', 'content' => ['Mode' => 'Confort', 'Consigne' => '19 °C']]
    ]
];
scenarioform::sendResult($scenario, 'accepted', 'Traitement terminé', $document);
```

Pour afficher un tableau et permettre sa copie directe dans Excel,
LibreOffice Calc ou Google Sheets, utilisez une section de type `table` :

```php
$document = [
    'title' => 'Export mensuel',
    'summary' => '31 lignes exportées.',
    'event_at' => '2026-08-01 00:00:00',
    'sections' => [[
        'title' => 'Données',
        'type' => 'table',
        'headers' => ['Jour', 'Date', 'Valeur'],
        'rows' => [
            [1, '01/08/2026', '123,45'],
            [2, '02/08/2026', '124,18']
        ]
    ]]
];
scenarioform::sendResult($scenario, 'accepted', 'Export terminé', $document);
```

Le bouton **Copier pour tableur** apparaît dans la fenêtre dès que le compte
rendu contient au moins une section `table`. Les colonnes sont copiées au
format TSV, adapté au collage direct dans un tableur.

`event_at` représente la date métier facultative. Les dates techniques de
création et de dernière modification sont ajoutées automatiquement. Les
sections acceptent du texte, une liste ou des couples libellé/valeur ; elles
sont toujours affichées comme du texte et jamais interprétées comme du HTML.

Les détails sont regroupés dans
[`SECURITE_ET_ACCES.md`](../../SECURITE_ET_ACCES.md).

## Diagnostic

| Situation | Action recommandée |
| --- | --- |
| ScenarioForm n'apparaît pas | Vérifier que le plugin est installé, activé et accessible sous **Accueil → ScenarioForm**. |
| Aucun scénario actif associé | Modifier le formulaire et activer au moins une association. |
| Droit d'exécution refusé | Accorder **Visualisation et exécution** dans l'onglet **Scénarios**, sur l'identifiant exact indiqué. |
| En attente | Patienter pendant le délai configuré ; le scénario n'a pas encore renvoyé son résultat. |
| Aucun retour reçu | Consulter le journal du scénario Jeedom et vérifier le bloc Code. |
| Lancement manuel ignoré | Comportement normal du scénario modèle ; lancer le formulaire depuis ScenarioForm. |
| Erreur métier | Lire le message retourné, corriger le traitement puis effectuer une nouvelle saisie. |

Le délai d'attente par défaut est de 120 secondes et peut être modifié dans la
configuration du plugin.

## Mettre à jour sans perdre ses données

Une mise à jour ScenarioForm conserve les requêtes, formulaires, champs,
associations, réponses et droits Jeedom portant sur des scénarios existants.
Effectuer néanmoins une sauvegarde Jeedom avant toute mise à jour.

Un droit doit être réattribué si un scénario est supprimé puis recréé, car son
identifiant change. Il n'est pas nécessaire de désactiver le plugin avant une
mise à jour.

Consulter [`INSTALLATION_V2.md`](../../INSTALLATION_V2.md) pour la procédure de
test et de retour arrière.

## Périmètre de la version 2.2

La version 2.2 couvre la création, la saisie, l'exécution, les retours métier,
les droits et l'historique opérationnel. Les fonctions avancées d'analyse, de
statistiques et de tableaux de bord historiques sont volontairement reportées
à une future version 2.3.

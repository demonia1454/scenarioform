# ScenarioForm — premier exemple prêt à l’emploi

Le guide général est disponible dans
[`docs/fr_FR/index.md`](docs/fr_FR/index.md).

Cet exemple crée un formulaire « Je rentre » qui reçoit une date de retour et
un commentaire facultatif. Il permet de vérifier tout le parcours sans avoir à
configurer de tag système ni de callback.

Compter environ dix minutes. La création de la requête, du formulaire, des
champs et du scénario nécessite un compte administrateur Jeedom. Le formulaire
pourra ensuite être utilisé avec un compte limité.

## Avant de commencer

Vérifier que :

- ScenarioForm est installé et activé ;
- le compte utilisé pour la configuration est administrateur ;
- les scénarios Jeedom ne sont pas globalement désactivés.

ScenarioForm conserve les requêtes, formulaires et réponses existants lors
d'une mise à jour du plugin.

### Variante rapide avec l'assistant

Un administrateur peut choisir **Assistant premier formulaire** dans la barre
supérieure. Après confirmation des trois noms proposés, l'assistant crée en une
fois la requête, le formulaire, les deux champs et le scénario entièrement
prêt à exécuter. Aucun élément existant n'est modifié.

Les sections suivantes restent utiles pour comprendre le résultat, le recréer
manuellement ou l'adapter à un autre usage.

## Résultat attendu

L’utilisateur saisit une date et, éventuellement, un commentaire. Le scénario
Jeedom journalise ces valeurs puis renvoie à ScenarioForm un message tel que :

> Retour enregistré pour le 03/12/2026.

L’exécution et son message restent ensuite consultables dans l’historique du
formulaire.

## 1. Créer la requête

Dans **Accueil → ScenarioForm**, choisir **Nouvelle requête** puis saisir :

- Nom : `Présence`
- Description : `Préparer le logement avant mon retour.`

Choisir **Créer la requête**.

## 2. Créer le formulaire

Dans la requête « Présence », choisir **Créer un formulaire** puis saisir :

- Nom : `Je rentre`
- Description : `Indiquer ma date de retour.`

Choisir **Valider**. Le nouveau formulaire devient automatiquement le
formulaire actif.

## 3. Ajouter les champs

Choisir **Ajouter des champs**, puis créer les deux champs suivants.

### Date de retour

- Tag : `retour`
- Label : `Date de retour`
- Type : `Date`
- Obligatoire : oui
- Ordre : `1`

### Commentaire

- Tag : `commentaire`
- Label : `Commentaire`
- Type : `Texte long`
- Obligatoire : non
- Ordre : `2`

Les tags métier `#retour#` et `#commentaire#` seront transmis automatiquement
au scénario. Les tags techniques, le ticket de lancement et le callback sont
gérés par ScenarioForm : il ne faut pas les créer manuellement.

## 4. Créer le scénario modèle

Dans la barre d'actions située sous le formulaire, choisir **Créer un scénario
modèle** et conserver le nom proposé :

`ScenarioForm — Je rentre`

Dans la confirmation, choisir **Ouvrir le scénario**. Ce bouton reste ensuite
disponible dans la barre d'actions du formulaire. Le bloc Code contient déjà :

- la vérification du contexte ScenarioForm ;
- la récupération des valeurs dans `$sf_retour` et `$sf_commentaire` ;
- la gestion des erreurs d’exécution ;
- l’envoi du résultat à ScenarioForm ;
- le refus explicite d’un lancement manuel.

Ne pas ajouter de commande graphique de retour. L’appel à
`scenarioform::sendResult()` est déjà fourni par le modèle.

Dans **Modifier le formulaire**, vérifier que le scénario est actif dans la
liste des scénarios associés et que **Attendre un retour métier** est coché.

## 5. Personnaliser uniquement le traitement métier

Entre les marqueurs `DÉBUT — TRAITEMENT À PERSONNALISER` et
`FIN — TRAITEMENT À PERSONNALISER`, remplacer `// Votre code ici.` par :

```php
if ($sf_retour === '') {
    throw new Exception('La date de retour est obligatoire.');
}

$dateRetour = DateTimeImmutable::createFromFormat('!Y-m-d', $sf_retour);

if (!$dateRetour) {
    throw new Exception('La date de retour est invalide.');
}

$scenario->setLog(
    'Retour prévu le ' . $dateRetour->format('d/m/Y') .
    ($sf_commentaire !== '' ? ' — ' . $sf_commentaire : '')
);
```

Entre les marqueurs `DÉBUT — MESSAGE DE RETOUR` et
`FIN — MESSAGE DE RETOUR`, remplacer la ligne `$message = ...` par :

```php
$message = 'Retour enregistré pour le ' . $dateRetour->format('d/m/Y') . '.';
```

Enregistrer le scénario avec le bouton **Sauvegarder** de Jeedom. Il n’est pas
nécessaire de modifier les autres parties du bloc Code ni d'utiliser son bouton
**Exécuter** : un lancement manuel est volontairement ignoré par le modèle.

## 6. Exécuter et contrôler

1. Revenir dans ScenarioForm.
2. Choisir le formulaire « Je rentre ».
3. Choisir **Saisir les valeurs**.
4. Indiquer une date et un commentaire.
5. Choisir **Valider et exécuter**.
6. Vérifier le message « Retour enregistré… ».
7. Choisir **Voir l’historique** après l'exécution, ou **Historique** dans la
   barre d'actions du formulaire, puis contrôler les valeurs et le résultat.

Pendant l’attente, **Nouvelle saisie** et **Voir l’historique** restent
disponibles.

## Essayer avec un utilisateur limité

Dans **Réglages → Système → Utilisateurs**, ouvrir **Droits** pour l'utilisateur
limité, puis choisir l'onglet **Scénarios**. Pour le scénario Jeedom
« ScenarioForm — Je rentre », sélectionner **Visualisation et exécution** et
enregistrer. En cas de doute, utiliser **Ouvrir le scénario** et vérifier son
identifiant dans l'adresse de la page Jeedom.

Ne pas confondre avec l'onglet **Équipements** : les équipements techniques
nommés « ScenarioForm — ... » peuvent rester sur **Aucun**. Après modification
des droits, reconnecter l'utilisateur limité avant l'essai.

En mode utilisateur, ScenarioForm autorise la saisie, le lancement des
scénarios permis et la consultation du seul historique de cet utilisateur. La
création, la modification et la suppression restent réservées aux
administrateurs.

## Contrôle final

Le parcours est validé si :

- la saisie affiche les deux champs dans le bon ordre ;
- **Valider et exécuter** lance le scénario sans erreur de droit ;
- le message « Retour enregistré pour le ... » apparaît ;
- l'historique contient la date, le commentaire et le résultat métier ;
- un autre utilisateur limité ne voit pas cette saisie dans son historique.

## Diagnostic rapide

| Message | Vérification |
| --- | --- |
| En attente | Le scénario est lancé et ScenarioForm attend son retour. |
| Aucun retour reçu | Consulter le journal Jeedom du scénario. Une erreur de syntaxe peut empêcher tout retour. |
| Erreur : ... | Corriger l’erreur métier indiquée par le scénario. |
| Vous ne disposez pas du droit d’exécution | Dans les droits de l'utilisateur limité, ouvrir l'onglet **Scénarios** et accorder **Visualisation et exécution** au scénario Jeedom associé. |
| Lancement manuel ignoré | Comportement normal : le scénario modèle est prévu pour ScenarioForm. |

Par défaut, une absence de retour est signalée après 120 secondes. Ce délai est
modifiable dans la configuration du plugin.

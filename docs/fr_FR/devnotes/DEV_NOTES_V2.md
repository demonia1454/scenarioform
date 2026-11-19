# Point d'étape — stabilisation fonctionnelle et préparation V2

## État du projet

ScenarioForm dispose maintenant d'un socle fonctionnel opérationnel permettant de :

* créer une requête ;
* modifier une requête ;
* supprimer une requête ;
* sélectionner une requête dans la liste ;
* afficher son détail ;
* créer un formulaire ;
* modifier un formulaire ;
* supprimer un formulaire ;
* définir les champs d'un formulaire ;
* modifier et supprimer les champs ;
* ordonner les champs ;
* définir le type d'un champ ;
* définir son tag ;
* définir si un champ est requis ou non ;
* saisir les valeurs du formulaire ;
* valider les valeurs ;
* envoyer la requête ;
* enregistrer les réponses ;
* consulter l'historique des réponses.

Les tests réalisés jusqu'à présent montrent que ce socle fonctionne.

---

## Notion requis / facultatif

La notion initialement appelée « facultatif » a été clarifiée et doit désormais être considérée comme :

> **Champ requis**

La propriété technique utilisée est :

```text
required
```

avec les valeurs :

```text
0 = non requis
1 = requis
```

La classe `scenarioformField` dispose notamment de :

```php
public function getRequired(): int
```

### Liste des champs

L'action PHP `getFieldList` retourne maintenant également :

```php
'required' => $field->getRequired()
```

La liste affiche désormais :

```text
Ordre | Label | Type | Tag | Obligatoire | Actions
```

avec :

```text
✓ = requis
— = non requis
```

### Édition d'un champ

La case :

```text
Champ obligatoire
```

est correctement synchronisée avec `field.required`.

Elle accepte les représentations :

```text
true
false
1
0
"1"
"0"
```

La sauvegarde transmet :

```js
required: $('#edit_field_required').is(':checked') ? 1 : 0
```

---

## Saisie des valeurs

Lors de la saisie, les champs requis sont signalés par un astérisque et reçoivent l'attribut HTML `required`.

La logique de génération utilise notamment :

```js
${isRequired ? 'required' : ''}
```

La validation JavaScript ne contrôle que les éléments dont la propriété HTML `required` est active.

Principe :

```text
required = 1 → valeur obligatoire
required = 0 → valeur vide autorisée
```

---

## Validation serveur — executeForm

Une anomalie importante a été identifiée et corrigée.

L'ancien comportement PHP considérait tous les champs comme obligatoires, sauf les booléens.

La validation a été alignée sur la propriété :

```php
$field->getRequired()
```

Le comportement actuel est :

```text
Champ requis
    absent → erreur
    vide   → erreur
    rempli → validation du type

Champ facultatif
    absent → accepté
    vide   → accepté
    rempli → validation du type

Booléen
    absent → 0
    décoché → 0
    coché → 1
```

Une valeur renseignée dans un champ facultatif reste soumise à la validation de son type.

Ainsi :

```text
date facultative + vide
    → accepté

date facultative + date valide
    → accepté

date facultative + date invalide
    → refusée
```

Même principe pour :

* heure ;
* date et heure.

---

## Point important pour la suite

Le fonctionnement requis/facultatif est maintenant cohérent entre :

```text
éditeur du champ
        ↓
liste des champs
        ↓
formulaire de saisie
        ↓
validation JavaScript
        ↓
validation PHP
```

Il faut maintenant **éviter de modifier cette logique sans nécessité** et la considérer comme un socle stabilisé.

---

# Prochaine phase : utilisation réelle du projet

Le projet entre maintenant dans une phase différente.

Plutôt que d'ajouter immédiatement de nouvelles fonctionnalités, l'objectif est d'utiliser ScenarioForm avec plusieurs besoins réels afin d'identifier les évolutions utiles.

## Cas d'utilisation à tester

Prévoir plusieurs formulaires représentatifs, par exemple :

* formulaire de demande d'intervention ;
* formulaire avec date et heure ;
* formulaire avec champs obligatoires et facultatifs ;
* formulaire comportant des booléens ;
* formulaire destiné à déclencher un scénario Jeedom ;
* formulaire comportant plusieurs informations facultatives.

Pendant cette utilisation, noter les besoins rencontrés.

Les classer en :

```text
INDISPENSABLE
    Fonctionnement impossible ou incohérent sans cette évolution.

CONFORT
    Fonction utile améliorant fortement l'utilisation.

ESTHÉTIQUE
    Amélioration visuelle ou ergonomique.
```

---

# Préparation d'une V2 fonctionnelle

Évolutions potentielles à confirmer après utilisation réelle.

## Formulaires

Possibilités futures :

* activation/désactivation ;
* description ;
* ordre ;
* icône ;
* catégorie éventuelle ;
* confirmation avant envoi.

## Champs

Socle actuel :

* nom / tag ;
* label ;
* type ;
* ordre ;
* requis ;
* activation.

Évolutions possibles, à ne pas implémenter avant validation du besoin :

* valeur par défaut ;
* placeholder ;
* texte d'aide ;
* longueur minimale/maximale ;
* liste de choix ;
* type `select` ;
* conditions d'affichage.

---

# Réflexion sur le fonctionnement global

Le modèle fonctionnel actuel est :

```text
REQUÊTE
    ↓
FORMULAIRE
    ↓
CHAMPS
    ↓
SAISIE
    ↓
VALIDATION
    ↓
RÉPONSE
    ↓
HISTORIQUE
    ↓
SCÉNARIO JEEDOM
```

Le projet doit conserver cette architecture générale.

L'objectif est de faire de ScenarioForm un outil permettant de :

> demander des informations à un utilisateur, valider ces informations et déclencher une action/scénario Jeedom avec les valeurs saisies.

---

# Phase esthétique / intégration Jeedom

La refonte esthétique doit intervenir après stabilisation fonctionnelle.

Objectif :

> Donner à ScenarioForm l'apparence et les conventions d'un plugin Jeedom existant, plutôt que celles d'une application web indépendante.

À étudier :

* structure des panneaux ;
* tableaux ;
* boutons ;
* icônes Font Awesome ;
* titres ;
* espacements ;
* messages ;
* couleurs d'état ;
* formulaires ;
* responsive ;
* cohérence desktop/mobile ;
* conventions visuelles des plugins Jeedom existants.

La refonte devra être faite à partir des conventions réelles de Jeedom et non par invention d'une charte graphique indépendante.

---

# Méthode de travail retenue

Ne pas repartir dans une refonte générale.

Procéder par étapes :

1. stabiliser le socle actuel ;
2. utiliser ScenarioForm sur plusieurs cas réels ;
3. noter les besoins rencontrés ;
4. classer les besoins : indispensable / confort / esthétique ;
5. définir une V2 fonctionnelle ;
6. implémenter progressivement les besoins retenus ;
7. effectuer ensuite une passe d'harmonisation et de nettoyage du code ;
8. réaliser enfin la refonte esthétique et l'intégration avec les conventions Jeedom.

Les logs de développement peuvent rester temporairement présents pendant la phase de test.

Ils seront nettoyés lors de la phase de consolidation.

---

# État actuel

Le projet peut être considéré comme :

> **socle fonctionnel opérationnel — début de phase de validation par l'usage réel.**

La prochaine étape n'est donc pas nécessairement du développement.

Elle consiste à utiliser le projet comme un utilisateur et à déterminer ce qui manque réellement.






Résumé pour reprise

## CONTEXTE SCENARIOFORM — REPRISE DU PROJET

Nous développons un plugin Jeedom nommé **ScenarioForm**.

Le socle fonctionnel est maintenant opérationnel :

* requêtes : création / modification / suppression / sélection ;
* formulaires : création / modification / suppression ;
* champs : création / modification / suppression / ordre ;
* types de champs ;
* tags ;
* champs requis ou non ;
* saisie des valeurs ;
* validation ;
* envoi de la requête ;
* exécution du scénario ;
* enregistrement des réponses ;
* historique.

### Notion `required`

La propriété technique est :

```text
required = 0 → champ non requis
required = 1 → champ requis
```

La classe `scenarioformField` possède :

```php
getRequired(): int
```

La notion UI doit être appelée **« Champ obligatoire »** ou **« Requis »**, et non plus « facultatif ».

`getFieldList` retourne maintenant `required`.

La liste des champs affiche :

```text
Ordre | Label | Type | Tag | Obligatoire | Actions
```

La saisie affiche un astérisque et l'attribut HTML `required` uniquement pour les champs requis.

### Validation

La validation JavaScript ne contrôle que les champs HTML `required`.

La validation PHP de `executeForm` a été corrigée pour respecter `getRequired()`.

Règle :

```text
requis + vide → refus
requis + rempli → validation du type

non requis + vide → accepté
non requis + rempli → validation du type

boolean absent/décoché → 0
```

Une valeur renseignée dans un champ facultatif doit quand même être validée selon son type.

Les types date / heure / datetime doivent rester validés lorsqu'une valeur est fournie.

### État du projet

Le socle est suffisamment stable pour commencer une phase d'utilisation réelle.

Nous voulons maintenant éviter d'ajouter des fonctionnalités au hasard.

Objectif :

1. utiliser ScenarioForm avec plusieurs besoins réels ;
2. identifier les problèmes ou manques ;
3. classer les besoins :

   * INDISPENSABLE
   * CONFORT
   * ESTHÉTIQUE
4. définir une V2 fonctionnelle ;
5. implémenter progressivement les besoins retenus ;
6. faire ensuite une passe de nettoyage/consolidation ;
7. terminer par une refonte esthétique conforme aux conventions et à l'apparence des plugins Jeedom existants.

### Vision du produit

Le modèle général est :

```text
REQUÊTE
  ↓
FORMULAIRE
  ↓
CHAMPS
  ↓
SAISIE
  ↓
VALIDATION
  ↓
RÉPONSE
  ↓
HISTORIQUE
  ↓
SCÉNARIO JEEDOM
```

L'objectif est d'avoir un outil Jeedom permettant de demander des informations à un utilisateur, de les valider et de déclencher un scénario avec les valeurs saisies.

### Méthode

Ne pas repartir dans une grosse refonte.

Commencer par l'utilisation réelle du plugin et noter les besoins qui apparaissent.

Ensuite seulement définir la V2.

La refonte esthétique viendra après la stabilisation fonctionnelle. ()


je te rappelle demain. Nous avons estimé intéressant de permettre plusieurs formulaires à une requête et d'adjoindre le (voire les) scenario(s) à ce couple plutôt qu'à la requête

Oui, c’est un point important pour la suite, et ça change légèrement le modèle fonctionnel que nous avions résumé.

Le modèle cible serait plutôt :

REQUÊTE
   │
   ├── FORMULAIRE 1 ──┬── SCÉNARIO A
   │                  └── SCÉNARIO B
   │
   ├── FORMULAIRE 2 ──┬── SCÉNARIO C
   │                  └── SCÉNARIO D
   │
   └── FORMULAIRE 3 ───── SCÉNARIO E

Donc la requête devient le conteneur, tandis que le couple :

Formulaire + scénario(s)

devient l'unité fonctionnelle réellement exécutée.

C'est effectivement plus souple que le modèle actuel où le scénario est attaché directement à la requête.
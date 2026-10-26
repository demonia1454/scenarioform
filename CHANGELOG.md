## v2.2-beta3-r112 — Interface mobile et authentification HTTPS (23/10/2026)

- Ajout de la page `mobile/php/scenarioform.php` et activation de la compatibilité mobile dans `plugin_info/info.json`.
- Liste mobile des requêtes et formulaires autorisés, avec ouverture directe du formulaire sélectionné dans l’interface desktop adaptée aux petits écrans.
- Prise en charge des paramètres `sf_request` et `sf_form` pour sélectionner automatiquement la requête et le formulaire.
- Conservation du correctif d’authentification HTTPS de la r111 (`authentification.php`, sans `session_start()` redondant).
- Cette version est une variante locale non officielle ; validation sur une installation Jeedom requise.

## v2.2-beta3-r111 — 2026-10-20
- Ajout de `scenarioformGoogleCalendar` pour centraliser les accès SQL à `scenarioform_googlecalendar`.
- Le nettoyage des correspondances lors de la suppression confirmée d’une réponse utilise désormais la classe, dans la transaction existante.
- Aucun changement de schéma SQL ou de comportement Google Agenda ; validation en environnement Jeedom restant à effectuer.

## v2.2-beta3-r110 — 2026-10-20
- Ajout de la création idempotente de `scenarioform_googlecalendar` dans les hooks installation/mise à jour et dans `core/config/install.sql`.
- Structure conforme au `SHOW CREATE TABLE` fourni, sans modification des tables existantes.
- Version de développement : tests Jeedom non réalisés.

# r108 — Correction de persistance de la valeur initiale

- Correction : le nom de la variable Jeedom saisi dans « Valeur initiale » est désormais réellement enregistré dans la configuration du champ.
- Suppression d'un traitement de validation placé par erreur dans l'exécution du formulaire.
- Aucun changement requis pour le tag ou le type du champ.

# r107 — Valeur initiale depuis une variable Jeedom

- Ajout d’un paramètre de champ « Variable Jeedom » pour initialiser dynamiquement sa valeur à l’ouverture du formulaire.
- Prise en charge des champs booléen, select, texte, nombre, date, heure et datetime.
- La valeur n’est lue qu’à l’ouverture du formulaire ; aucune configuration existante n’est modifiée si le paramètre reste vide.
- Les valeurs restaurées depuis l’historique restent prioritaires lorsqu’elles sont appliquées après le rendu initial.

## V2.2 bêta 3 r106 — tri de l’historique fiabilisé

- Correction de la valeur technique des options de tri par champ : le navigateur conserve désormais `field:id:<id>:asc|desc` au lieu du libellé visible.
- À chaque ouverture de l’historique, le tri par défaut repart du champ configuré comme « Champ utilisé comme titre dans l’historique », en ordre croissant.
- Aucun changement de schéma SQL ni migration des réponses existantes.

## r102 — 2026-10-02

- Historique : le choix du tri est maintenant transmis explicitement au serveur lors de chaque chargement et actualisation.
- Le serveur applique le tri demandé (date, numéro de réponse ou champ du formulaire) avant de renvoyer l’historique ; le tri client reste en complément pour l’affichage.
- Correction du cas où le champ choisi restait affiché dans le sélecteur sans modifier réellement l’ordre des réponses.

## r101 — 2026-10-02

- Historique : correction du sélecteur de tri par champ ; le champ choisi reste désormais sélectionné et est réellement utilisé après le rechargement de l’historique.
- À la première ouverture de l’historique, le tri se positionne automatiquement sur le champ configuré comme « titre dans l’historique » lorsqu’il est défini.
- Le choix manuel de l’utilisateur reste prioritaire lors des actualisations suivantes.

## r100 — 2026-10-02

- Métadonnées : auteur affiché remplacé par « demonia ». La catégorie technique Jeedom reste `organization` pour préserver la compatibilité.
- Historique : le tri utilise désormais réellement la date pour « plus récentes / plus anciennes ».
- Historique : ajout du tri par numéro de réponse, croissant ou décroissant.
- Historique : ajout dynamique de chaque champ du formulaire dans le sélecteur de tri, dans les deux sens (A → Z / croissant et Z → A / décroissant).
- Les champs numériques, dates et booléens sont triés selon leur type ; les valeurs vides sont placées en fin de liste.

## r99 — 2026-10-01

- Historique : présentation de chaque réponse réorganisée sur plusieurs niveaux pour éviter les colonnes trop étroites et les mots coupés.
- La première ligne met en avant le numéro de réponse et le champ choisi comme titre.
- Le formulaire, la date/heure et l’état d’exécution sont regroupés sur une ligne de contexte plus discrète.
- Les actions disposent désormais de leur propre ligne et se répartissent automatiquement selon la largeur disponible.
- Aucun changement fonctionnel ni de données : les actions et le contenu de l’historique restent identiques.

## r98 — 2026-10-01

- Comptes rendus métier : ajout d’une purge ciblée « Purger les précédents » qui conserve uniquement le compte rendu le plus récent de chaque scénario du formulaire.
- La purge ne supprime ni les réponses de l’historique ni leurs valeurs ; elle retire uniquement les anciens documents métier.
- Clarification du comportement : un compte rendu est déjà stocké séparément par réponse/scénario ; la vue « Comptes rendus métier » liste volontairement les exécutions historiques tant qu’elles ne sont pas purgées.
- Le scénario d’exemple Enedis fourni séparément ajoute le total mensuel à la synthèse des données journalières fcsv=1.

## r97 — 2026-10-01

- Ajout d’un réglage de formulaire « Champ utilisé comme titre dans l’historique ».
- Le champ choisi est appliqué dynamiquement aux réponses existantes comme aux nouvelles, sans modifier les données historiques.
- Le mode « Automatique » conserve le comportement r96 : premier champ renseigné.
- Si une ancienne réponse ne contient pas de valeur pour le champ explicitement choisi, aucun titre complémentaire n’est affiché.

# r96

- Historique : la ligne de chaque réponse affiche désormais le premier champ renseigné sous la forme **Libellé : valeur**, sans devoir ouvrir « Détails ».
- La valeur affichée est tronquée à 80 caractères pour préserver la lisibilité ; la valeur complète reste disponible au survol.
- Si aucun champ n’est renseigné, l’affichage de l’historique reste inchangé.

# r95

- Listes de choix dépendantes : lorsqu’une valeur de la liste parente ne possède aucun choix enfant, le champ dépendant est masqué et désactivé.
- Ce comportement est identique en saisie normale et lors de la modification d’une réponse historique.
- La validation serveur accepte une liste dépendante vide dans ce cas, même si le champ est configuré obligatoire.
- Réapparition automatique du champ dépendant dès qu’une valeur parente disposant de choix est sélectionnée.

# r94

- Historique : numérotation visible séparée par formulaire (`history_id`), en conservant l’ID technique global des réponses pour toutes les actions.
- Une nouvelle réponse d’un formulaire poursuit la séquence propre à ce formulaire ; les autres formulaires ont leur propre séquence à partir de 1.
- Compatible avec l’édition d’historique r93 et les listes de choix dépendantes.

# Changelog

## V2.2 bêta 3 r93 — modification de l’historique

- Ajout d’un bouton **Modifier** sur chaque réponse de l’historique.
- Réutilisation du formulaire courant pour corriger une ou plusieurs valeurs, y compris les listes de choix dépendantes.
- Mise à jour de la réponse existante sans relancer le scénario et sans créer une nouvelle ligne d’historique.
- Validation serveur des valeurs et de la cohérence parent/enfant des listes dépendantes.
- Synchronisation transactionnelle des valeurs en base et du snapshot `configuration.history.values`.
- Conservation des résultats et comptes rendus de l’exécution d’origine.

## V2.2 bêta 3 r92 — ordre des champs

- Après la création, la modification de l’ordre ou la suppression d’un champ, les champs du même formulaire et du même scénario sont renumérotés de 1 à N.
- Un champ déplacé à la position indiquée décale les autres champs sans modifier leur ordre relatif.

## V2.2 bêta 3 r91 — listes de choix dépendantes

- Une liste de choix peut dépendre d’une première liste et proposer des valeurs selon son choix.
- Les valeurs dépendantes sont vérifiées à l’enregistrement du formulaire.

## V2.2 bêta 3 r90 — texte intégral dans le CSV

- La colonne Texte conserve désormais la ligne complète du compte rendu, y compris la date et l’heure qu’elle contient.
- Les colonnes Date et Heure continuent d’être renseignées séparément à partir de cette ligne ou, à défaut, de la création du compte rendu.

## V2.2 bêta 3 r89 — reconnaissance des dates CSV

- Les colonnes Date et Heure des comptes rendus sont écrites sans guillemets pour faciliter leur reconnaissance par un tableur français.
- La colonne Texte conserve son échappement CSV et sa protection contre les formules.

## V2.2 bêta 3 r88 — colonnes date, heure et texte

- Export CSV à trois colonnes : Date, Heure et Texte.
- La date et l’heure présentes dans une ligne du compte rendu sont extraites de cette ligne ; à défaut, celles de la création du compte rendu sont utilisées.
- Les dates sont écrites au format JJ/MM/AAAA pour faciliter leur reconnaissance par les tableurs en français.

## V2.2 bêta 3 r87 — date métier dans l’export CSV

- La colonne Date reprend la date et l’heure indiquées dans le titre du compte rendu, comme « Rendez-vous — 08-02-2026 à 15:00 ».
- En l’absence de date dans le titre, l’export utilise la date métier du document, puis sa date de création.

## V2.2 bêta 3 r86 — export des comptes rendus

- Export CSV des lignes affichées dans « Comptes rendus », avec les colonnes Date et Description.
- Le bouton « Retour » quitte les comptes rendus et revient à la fiche du formulaire sélectionné.

## V2.2 bêta 3 r85 — consultation des comptes rendus par formulaire

- Ajout d'un bouton « Comptes rendus » entre « Modifier les champs » et « Historique ».
- Affichage des comptes rendus du formulaire sélectionné avec un titre composé du titre de section et du résumé, ainsi que toutes les lignes des tableaux enregistrés.

## V2.2 bêta 3 r84 — actions de saisie immédiatement accessibles

- Déplacement des boutons « Valider et exécuter » et « Retour » dans le bandeau « Valeurs à saisir ».
- Positionnement automatique sur ce bandeau après la reprise de valeurs depuis l’historique.
- Adaptation de la disposition des actions aux écrans étroits.

## V2.2 bêta 3 r83 — sortie de l’attente métier

- Ajout du bouton « Retour — continuer en arrière-plan » pendant l’attente du retour métier.
- Arrêt du polling dans le navigateur sans interrompre le scénario Jeedom déjà lancé.
- Conservation de la réponse et de son éventuel retour métier dans l’historique.

## V2.2 bêta 3 r82 — enrichissement des listes pendant la saisie

- Ajout, pour les administrateurs, d’une valeur à un champ « Liste de choix » directement depuis l’écran de saisie.
- Enregistrement transactionnel avec verrouillage du champ afin de préserver les ajouts simultanés.
- Normalisation des valeurs et refus des doublons sans distinction de casse.
- Maintien de la vérification des droits d’exécution des scénarios pour les utilisateurs non administrateurs.

## V2.2 bêta 3 r81 — comparaisons et tendances

- Comparaison de la période sélectionnée avec la période précédente de même durée.
- Signalement explicite d’une hausse, d’une baisse ou d’une stabilité du taux d’incident.
- Comparaison des exécutions, succès, incidents, absences de retour et durées moyennes.
- Ajout de l’évolution des champs numériques entre la première et la seconde moitié de la période.
- Classement des cinq scénarios les plus souvent en échec.
- Classement transverse des cinq formulaires les plus utilisés, limité aux historiques accessibles à l’utilisateur.

## V2.2 bêta 3 r80 — statistiques adaptées aux données

- Ajout des taux de succès et d’incident métier et du nombre d’absences de retour.
- Calcul des durées moyenne, minimale et maximale à partir des retours horodatés.
- Analyse des champs numériques par minimum, moyenne et maximum.
- Répartition Oui/Non des booléens et fréquence des choix et textes.
- Regroupement chronologique des champs date et date/heure.
- Ajout d’une évolution temporelle des exécutions et de la part des incidents.
- Statistiques limitées au formulaire ouvert et à la période sélectionnée.

## V2.2 bêta 3 r79 — liste avant statistiques

- Le bouton « Historique » ouvre désormais directement la liste des exécutions.
- Les statistiques sont déplacées dans une vue secondaire accessible par un bouton dédié.
- Ajout d’un retour explicite « Liste » depuis les statistiques.
- Un clic sur un indicateur ou un incident statistique revient automatiquement à la liste filtrée correspondante.
- Les filtres, l’export et la purge restent réservés à la vue liste.

## V2.2 bêta 3 r78 — téléchargement CSV fiabilisé

- Isolation du clic de téléchargement afin que la navigation AJAX globale de Jeedom n’intercepte pas l’URL `blob:`.
- Conservation de l’URL temporaire pendant le téléchargement pour éviter l’erreur « Failed to fetch » des WebView et de certains navigateurs.
- Libellé précisant que l’export porte sur la sélection filtrée du formulaire ouvert.
- Nom du formulaire et date intégrés au nom du fichier téléchargé.
- Ajout d’un repli pour les navigateurs utilisant `msSaveOrOpenBlob`.

## V2.2 bêta 3 r77 — historique filtrable et exportable

- Ajout d’un filtre métier par statut : accepté, avertissement, erreur, refusé ou aucun retour.
- Recherche libre dans les valeurs saisies, libellés, scénarios et messages métier.
- Affichage de la durée de traitement de chaque scénario lorsqu’elle est disponible.
- Export CSV de la sélection réellement affichée, avec une colonne par champ et les résultats détaillés.
- Protection des cellules CSV susceptibles d’être interprétées comme des formules par un tableur.

## V2.2 bêta 3 r76 — synthèse de l’historique

- Ajout d’une synthèse compacte sur 24 heures, 7 jours, 30 jours, une période personnalisée ou toute la période.
- Indicateurs d’exécutions, de lancements réussis, de retours acceptés, d’incidents et de réponses en attente.
- Répartition des statuts métier et liste des cinq incidents les plus récents.
- Filtrage de l’historique par clic sur un indicateur et accès direct au détail d’un incident.
- Distinction explicite entre réussite technique du lancement et résultat métier.

## V2.2 bêta 3 r75 — actions du dernier compte rendu réparées

- Correction de la lecture de la dernière réponse depuis la structure `history` renvoyée par le serveur.
- Affichage effectif du bouton « Détails » immédiatement après l’exécution.
- Affichage immédiat du bouton « Compte rendu » lorsqu’un document métier accompagne la réponse.

## V2.2 bêta 3 r74 — résultat immédiatement exploitable

- Masquage du sélecteur de scénario lorsqu’un seul scénario est disponible.
- Conservation du sélecteur lorsque plusieurs scénarios peuvent être exécutés.
- Ajout des actions « Compte rendu » et « Détails » directement après l’exécution.
- Réutilisation du compte rendu et des données de la réponse enregistrée, sans détour par l’historique.

## V2.2 bêta 3 r73 — accueil et compte rendu allégés

- Regroupement du titre « Requêtes » et des actions dans une barre d’accueil compacte.
- Masquage du titre « Édition » tant qu’aucune requête n’est sélectionnée.
- Réduction du message d’accueil vide à une indication discrète et horizontale.
- Fusion des bandeaux de validation et de lancement en un résumé d’exécution unique.
- Renommage du bloc de résultat en « Compte rendu et détails ».

## V2.2 bêta 3 r72 — espace de travail élargi

- Réduction d’un tiers de la colonne des requêtes sur les grands écrans.
- Répartition responsive portée à 2/10 colonnes en grand écran, 3/9 en écran moyen et 4/8 en petit écran.
- Suppression de la limite de largeur qui empêchait les formulaires, champs et historiques d’utiliser l’espace libéré.
- Ellipse et infobulle sur les noms de requêtes trop longs.
- Conservation de l’empilement pleine largeur sur mobile.

## V2.2 bêta 3 r71 — formulaire actif immédiatement identifiable

- Renforcement du contraste et de la bordure du formulaire sélectionné.
- Ajout d’une coche et du badge « Formulaire actif » sur la ligne sélectionnée.
- Synchronisation de l’attribut d’accessibilité `aria-selected` lors de chaque changement.
- Conservation du glisser-déposer, des commandes d’ordre et de l’adaptation mobile.

## V2.2 bêta 3 r70 — copie des comptes rendus vers un tableur

- Ajout des sections structurées de type `table` avec en-têtes et lignes.
- Affichage des tableaux dans la fenêtre du compte rendu métier.
- Ajout du bouton « Copier pour tableur », qui place les tableaux au format TSV dans le presse-papiers.
- Maintien de la compatibilité avec les anciennes sections texte, liste et libellé/valeur.
- Neutralisation des valeurs susceptibles d’être interprétées comme des formules par un tableur.

## V2.2 bêta 3 r69 — destination provisoire simplifiée

- Lorsqu’un formulaire ne possède encore aucun scénario, « Scénario modèle à créer » est affiché comme une destination informative.
- La liste déroulante n’est plus affichée dans cet état puisqu’aucune autre destination n’est sélectionnable.
- La valeur technique provisoire reste transmise lors de l’ajout et de la copie des champs.

## V2.2 bêta 3 r68 — interactions de l’historique

- Les gestionnaires de l’historique ne sont plus réenregistrés à chaque actualisation périodique.
- Le bouton « Détails » fonctionne aussi pour la réponse la plus récente pendant et après le suivi du retour métier.
- La croix, la touche Échap et le bouton « Fermer » referment correctement la fenêtre du compte rendu.

## V2.2 bêta 3 r67 — formulaire conservé pendant le traitement

- Après la soumission, les champs restent affichés tant que le retour métier est en attente.
- La saisie et les actions sont verrouillées pendant cette attente afin d’éviter une double exécution.
- Le suivi du résultat est affiché au-dessus du formulaire sans détruire les valeurs saisies.
- Le formulaire n’est remplacé par l’écran de résultat qu’une fois tous les retours métier terminés.

## V2.2 bêta 3 r66 — création des champs avant le scénario modèle

- Un formulaire sans scénario affiche la destination provisoire « Scénario modèle à créer ».
- Les champs peuvent être créés ou copiés avant la création du modèle.
- À la création du modèle, les champs provisoires lui sont automatiquement rattachés.
- Le bouton de création du scénario modèle réapparaît dès qu’un champ existe.

## V2.2 bêta 3 r65 — remplacement d’un scénario sans perte de champs

- Lorsqu’un formulaire remplace son unique scénario par un autre, tous les champs sont automatiquement transférés vers le nouveau scénario.
- Les identifiants des champs, leurs contrôles et toute leur configuration sont conservés.
- Une modification ambiguë impliquant plusieurs scénarios est refusée si elle rendrait des champs invisibles.
- Un message confirme le nombre de champs transférés après la sauvegarde.

## V2.2 bêta 3 r64 — compte rendu métier enrichi

- Ajout de `scenarioform_response_document`, reliée au résultat normalisé d’un scénario par `response_scenario_id`.
- Extension rétrocompatible de `sendResult` avec un document structuré facultatif (titre, résumé, date métier et sections).
- Enregistrement transactionnel du résultat simple et du compte rendu, avec dates de création et de modification.
- Ajout d’un bouton « Compte rendu » dans l’historique et affichage sécurisé dans une fenêtre dédiée.
- L’extrait analytique de l’historique privilégie désormais le résumé du compte rendu.

## V2.2 bêta 3 r63 — compatibilité des sources de duplication

- Prise en charge des champs historiques dont le scénario n’a pas encore été renseigné en base, lorsque leur formulaire possède un scénario unique.
- Identification explicite du scénario affiché dans la barre comme destination de la copie.
- Les autres binômes formulaire/scénario restent proposés dans la fenêtre ouverte par « Copier depuis… ».

## V2.2 bêta 3 r62 — duplication entre formulaires

- Correction du périmètre de « Copier depuis… » : la source est désormais un binôme formulaire/scénario appartenant à la même requête.
- Les sources proposées proviennent des autres formulaires et indiquent leur nombre de champs.
- La destination reste le scénario unique du formulaire en cours ; l’action est désactivée si ce formulaire possède plusieurs scénarios.
- Le serveur vérifie l’appartenance des deux formulaires à la même requête et refuse d’écraser une liste de champs existante.

## V2.2 bêta 3 r61 — sources de copie complètes

- La gestion des champs liste désormais tous les scénarios associés au formulaire, y compris les scénarios désactivés qui possèdent encore des champs.
- La liste des scénarios utilisables pour la copie est séparée de la liste des scénarios actuellement exécutables.
- Le message affiché lorsqu’aucune source n’existe indique qu’un second scénario doit d’abord être associé et enregistré dans le formulaire.

## V2.2 bêta 3 r60 — champs par scénario et historique analytique

- Rattachement des champs à un scénario précis du formulaire ; les champs existants sont affectés au premier scénario actif lors de la migration.
- Sélection du scénario avant la saisie et exécution du seul scénario choisi.
- Copie complète des champs vers un scénario vide du même formulaire, avec nouveaux identifiants et remappage des comparaisons internes.
- Normalisation progressive de l’historique : utilisateur, scénario, instantanés des noms, état global, extrait métier et résultats par scénario deviennent interrogeables en base.
- Conservation du JSON historique pour assurer la lecture des anciennes réponses.
- Présentation compacte de chaque réponse sur deux lignes avec détails dépliables.

## V2.2 bêta 3 r59 — historique compact

- Suppression de l’aide sous les champs, redondante avec les placeholders.
- Regroupement du titre, du tri, de l’actualisation, du vidage et du retour à la saisie dans une seule barre d’historique.
- Déplacement des actions « Utiliser ces valeurs » et « Supprimer » sur la ligne d’en-tête de chaque réponse.

## V2.2 bêta 3 r58 — historique exploitable et saisie guidée

- Conservation d’un instantané complet des valeurs et libellés afin que l’historique reste lisible après renommage ou suppression d’un champ.
- Gestion sécurisée de l’historique par chaque utilisateur : suppression d’une réponse ou de son propre historique, sans accès aux réponses des autres comptes.
- Ajout du tri chronologique et de l’actualisation manuelle de l’historique.
- Tri alphabétique des scénarios disponibles et action explicite « Trier les scénarios A–Z » sans supprimer l’ordre manuel.
- Aide visible sous chaque champ de saisie avec caractère obligatoire ou facultatif, format et contraintes utiles.
- Libellé « Utiliser ces valeurs » pour distinguer la reprise d’une ancienne réponse d’une modification de l’historique.

## V2.2 bêta 3 r57 — robustesse des erreurs et rechargements

- Suppression compensatoire d’une réponse si l’enregistrement de ses valeurs échoue.
- Gestionnaires d’événements JavaScript regroupés dans un espace de noms et remplacés proprement lors d’un rechargement.
- Variables de glisser-déposer rendues redéclarables afin d’éviter une erreur lors d’un second chargement du script.
- Correction du libellé de champ hors portée lors de l’ouverture de la confirmation de suppression.


## V2.2 bêta 2 r56 — persistance des réponses

- Ajout de la colonne `updated` manquante à `scenarioform_response_value` lors d’une installation neuve.
- Migration idempotente des installations existantes afin de permettre l’enregistrement des valeurs saisies.
- Effacement de l’ancienne alerte globale après la sauvegarde réussie d’un champ.
- Validation sur une VM Jeedom dédiée : mise à jour, valeurs, tags, retour métier et historique.


## V2.2 bêta 1 r55 — promotion après recette

- Promotion publique du paquet r54 après validation complète du parcours de recette.
- Confirmation de la conservation de l’ordre des scénarios après enregistrement et rechargement.
- Validation des champs obligatoires, de la saisie valide, du lancement des scénarios, du résultat métier, de l’historique et de la navigation de retour.
- Aucun changement du code exécutable par rapport au paquet r54 testé.

## V2.2 r54 — conservation du formulaire sélectionné

- Le bouton « Retour » de la saisie revient désormais sur le formulaire initialement sélectionné.
- Le premier formulaire de la liste reste utilisé uniquement si la sélection précédente n'est plus disponible.
- Ajout d'un contrôle de non-régression sur la transmission de l'identifiant du formulaire au retour.

## V2.2 r53 — documentation locale accessible

- Le bouton « Documentation » de la fiche du plugin ouvre désormais une page intégrée à ScenarioForm.
- Le guide reste disponible sans publication sur un site externe.
- La page est réservée aux utilisateurs connectés et propose un retour direct vers ScenarioForm.

## V2.2 r52 — documentation orientée usages

- Ajout d'un guide utilisateur canonique au format Jeedom dans `docs/fr_FR/index.md`.
- Organisation par tâches : premier exemple, création manuelle, usage quotidien, historique, droits, sécurité, diagnostic et mise à jour.
- Liens entre le guide général et les documents spécialisés existants.
- Délimitation explicite de la v2.2 ; analyses et statistiques avancées restent prévues pour une future v2.3.

## V2.2 r51 — audit sécurité, accès et journaux

- Confirmation et documentation du bandeau réservé aux comptes non administrateurs.
- Reconstruction de la destination du callback depuis l'adresse interne canonique de Jeedom ; une URL de tag modifiée n'est plus utilisée comme destination réseau.
- Le point de retour accepte uniquement POST, applique une limite de fréquence et interdit la mise en cache de ses réponses.
- Suppression des anciennes traces contenant le condensat du jeton, la configuration complète d'une réponse ou la représentation complète d'un objet.
- Documentation des droits, de l'accès distant, de HTTPS et du contenu attendu des journaux.
- Aucun accès distant ni port supplémentaire n'est requis pour le retour métier local.

## V2.2 r50 — assistant premier formulaire

- Ajout d'un assistant administrateur accessible depuis la barre supérieure de ScenarioForm.
- Personnalisation des noms de la requête, du formulaire et du scénario avant création.
- Création en une opération d'un exemple indépendant « Je rentre » : deux champs, scénario associé et retour métier prêt à tester.
- Nettoyage compensatoire des éléments nouvellement créés si une étape échoue ; aucun élément existant n'est modifié.
- Rappel final des droits à accorder à un utilisateur limité.

## V2.2 r49 — tutoriel prêt à l'emploi finalisé

- Mise à jour du parcours « Je rentre » selon l'interface r48 et ses nouveaux emplacements d'actions.
- Ajout des prérequis, du temps indicatif, du réglage de retour métier et d'une liste de contrôle finale.
- Ajout d'un essai guidé avec un utilisateur limité et clarification de la différence entre droits **Équipements** et **Scénarios**.
- Enrichissement du diagnostic des erreurs de droits et de retour métier.

## V2.2 r48 — gestion des formulaires regroupée

- Déplacement de **Modifier le formulaire** entre **Créer un formulaire** et **Supprimer le formulaire**.
- La barre inférieure se concentre désormais sur les champs, la saisie, l'historique et l'accès au scénario.
- Les actions Modifier et Supprimer restent désactivées tant qu'aucun formulaire n'est sélectionné.

## V2.2 r47 — actions de formulaire réorganisées

- Déplacement de **Supprimer le formulaire** à côté de **Créer un formulaire** dans l'en-tête de la liste.
- Déplacement de **Ouvrir le scénario** dans la barre d'actions du formulaire, à l'emplacement précédemment occupé par la suppression.
- En présence de plusieurs scénarios associés, un bouton d'ouverture identifié par son nom est affiché pour chacun.

## V2.2 r46 — diagnostic précis des droits

- Le refus d'exécution indique désormais l'identifiant exact du scénario associé.
- Affichage de la clé de droit Jeedom consultée et de sa valeur effective, afin de repérer immédiatement un scénario homonyme, une association obsolète ou un droit non enregistré.

## V2.2 r45 — lecture directe du droit Jeedom enregistré

- Lecture du droit natif `scenario<ID>` de l'utilisateur courant avant le lancement.
- Autorisation uniquement lorsque la valeur enregistrée contient le droit d'exécution `x`.
- Contournement des écarts de contexte de `scenario::hasRight()` observés depuis le panel ScenarioForm, sans accorder automatiquement de droit.

## V2.2 r44 — prise en compte fiable des droits de scénario

- Rechargement de l'utilisateur courant depuis Jeedom avant le contrôle d'exécution.
- Transmission explicite de cet utilisateur à `scenario::hasRight()` lorsque la version de Jeedom le permet.
- Correction du refus erroné pouvant subsister après avoir accordé **Visualisation et exécution** à un utilisateur limité.

## V2.2 r43 — panel Jeedom et accès utilisateur

- Correction de la déclaration du panel desktop : ScenarioForm apparaît désormais sous **Accueil → ScenarioForm**.
- Conservation du contrôle natif Jeedom : un utilisateur limité doit disposer du droit **Visualisation et exécution** sur chaque scénario lancé par ses formulaires.

## V2.2 r42 — chargement fiable après installation

- Chargement explicite des classes métier pendant l'installation et au démarrage du point d'entrée AJAX.
- Correction de l'erreur `Class "scenarioformRequest" not found` pouvant apparaître au premier lancement après une installation fraîche.
- Le fonctionnement ne dépend plus de la mise à jour préalable du cache d'autoload de Jeedom.

## V2.2 r41 — accès utilisateur sans droits administrateur

- Ouverture de ScenarioForm à tout utilisateur Jeedom authentifié.
- Mode utilisateur limité à la saisie, au lancement et à la consultation de son propre historique.
- Protection côté serveur de toutes les créations, modifications, réorganisations et suppressions, réservées aux administrateurs.
- Vérification du droit Jeedom d’exécution sur chaque scénario avant le lancement par un utilisateur non administrateur.
- Les requêtes et formulaires désactivés restent invisibles et inaccessibles aux utilisateurs non administrateurs.
- Chaque nouvelle réponse mémorise son utilisateur afin d’isoler les historiques ; les anciennes réponses sans propriétaire restent visibles uniquement des administrateurs.

## V2.2 r40 — retour métier facultatif et accès au scénario

- Ajout du réglage « Attendre un retour métier » pour chaque scénario associé à un formulaire.
- Les scénarios sans retour attendu sont affichés comme lancés immédiatement, sans attente ni expiration après 120 secondes.
- Le formulaire indique clairement si un retour métier est attendu pour chaque scénario.
- Ajout d’un accès permanent « Ouvrir le scénario » pour les administrateurs Jeedom.
- Le bouton de création du scénario modèle n’est plus proposé aux profils qui ne peuvent pas effectuer cette action.
- Les associations existantes continuent d’attendre un retour métier par défaut.

## V2.2 r39 — exemple guidé prêt à l’emploi

- Ajout d’un parcours complet « Je rentre », de la création de la requête jusqu’à la consultation de l’historique.
- L’exemple indique précisément les deux seules zones du scénario modèle à personnaliser.
- Les tags techniques et callbacks restent entièrement gérés par ScenarioForm.
- Ajout d’un tableau de diagnostic des résultats les plus courants.

## V2.2 r38 — navigation pendant l’attente

- Les actions « Nouvelle saisie » et « Voir l’historique » restent disponibles pendant l’attente d’un retour métier.
- Quitter le suivi en direct arrête proprement sa requête et son temporisateur de rafraîchissement.
- Correction du nom du formulaire utilisé dans sa confirmation de suppression.

## V2.2 r37 — expiration des retours sans réponse

- Le délai par défaut avant « Aucun retour reçu » passe de 900 à 120 secondes.
- Les délais personnalisés compris entre 30 secondes et 24 heures restent respectés.
- Le rafraîchissement s’arrête lorsque la réponse passe au statut `timeout`, désormais affiché sans message redondant.

## V2.2 r36 — messages d’erreur et suppressions explicites

- Le délai sans callback invite désormais à consulter le journal Jeedom du scénario.
- Les confirmations de suppression indiquent le nom de la requête, du formulaire ou du champ concerné.
- Les données supprimées en cascade sont annoncées avant confirmation ; les scénarios Jeedom conservés sont explicitement distingués.
- La suppression d’une réponse ou de tout l’historique rappelle également la suppression de leurs valeurs et résultats associés.

## V2.2 r35 — modèle de scénario simplifié et balisé

- Suppression des valeurs par défaut devenues inutiles depuis que le lancement manuel est explicitement ignoré.
- Déclaration des variables uniquement dans la branche validée comme lancement ScenarioForm.
- Ajout de marqueurs DÉBUT/FIN distincts autour des valeurs reçues, du traitement à personnaliser et du message de retour.
- Les scénarios existants ne sont pas modifiés automatiquement afin de préserver leur code métier.

## V2.2 r34 — formulaire actif et ordre personnalisable

- Le formulaire créé devient automatiquement le formulaire actif après validation.
- La liste des formulaires peut être réordonnée par glisser-déposer ou avec les boutons Monter/Descendre ; l'ordre est enregistré immédiatement.

## V2.2 r33 — traitement réservé au lancement ScenarioForm

- Placement de toute la zone « TRAITEMENT À PERSONNALISER » dans la branche
  validée par `isScenarioFormContext()` du scénario modèle.
- Un lancement manuel conserve les valeurs par défaut mais n’exécute plus le
  traitement et n’envoie aucun résultat à ScenarioForm.
- Ajout d’une ligne explicite dans le journal Jeedom lorsqu’un lancement manuel
  est ignoré.
- Les scénarios modèles déjà créés ne sont pas réécrits afin de préserver leur
  code personnalisé ; leur bloc Code doit être adapté ou recréé manuellement.

## V2.2 r32 — ticket de lancement à usage unique

- Abandon de la dépendance au tag Jeedom `#trigger#`, absent dans certains
  modes de lancement extérieur.
- Création, juste avant chaque lancement ScenarioForm, d’un nonce aléatoire
  associé à la réponse et au scénario pendant deux minutes au maximum.
- Validation et consommation atomique de ce ticket au début du scénario
  modèle ; des tags résiduels ne peuvent donc plus réactiver la branche avec
  ScenarioForm.
- Réutilisation du contexte validé dans le même processus pour permettre
  l’envoi final par `sendResult()`.

## V2.2 r31 — distinction explicite du lancement manuel

- Rejet immédiat du contexte lorsque Jeedom indique `#trigger# = user`, valeur
  ajoutée par le bouton « Exécuter » de l’éditeur de scénarios.
- Ajout de `#scenarioform_origin# = scenarioform` à chaque lancement effectué
  par le plugin et validation obligatoire de cette origine.
- Conservation des contrôles cryptographiques et de l’état `pending` introduits
  en r30.

## V2.2 r30 — rejet des tags résiduels

- Remplacement, dans les nouveaux scénarios modèles, du simple test de présence
  d’un tag par une validation complète du contexte ScenarioForm.
- Contrôle de l’identifiant de réponse, du scénario cible, du condensat du
  jeton, de l’échéance et de l’état encore `pending`.
- Une exécution manuelle avec des tags conservés par Jeedom utilise désormais
  la branche sans ScenarioForm et ne peut plus envoyer un retour obsolète.
- Application de la même protection aux blocs Code et aux commandes d’action
  natives.

## V2.2 r29 — apparition immédiate du scénario modèle

- Mise à jour de la barre d’actions dès l’enregistrement ou la suppression d’un
  champ, sans imposer de recharger le formulaire.
- Apparition immédiate de « Créer un scénario modèle » après le premier champ
  lorsque le formulaire ne possède aucune association.
- Retrait immédiat du bouton si le dernier champ est supprimé.
- Mémorisation côté interface du nombre d’associations pour éviter une requête
  supplémentaire à chaque modification de champ.

## V2.2 r28 — saisie et historique séparés

- Remplacement de l’empilement vertical par deux vues exclusives : saisie ou
  historique.
- Le bouton « Historique » masque désormais le formulaire de saisie et affiche
  directement les réponses en haut de la zone utile.
- Ajout de « Revenir à la saisie » dans l’en-tête de l’historique.
- Conservation de l’actualisation automatique des résultats en attente et des
  actions Reprendre, Supprimer et Vider l’historique.

## V2.2 r27 — scénario modèle après création des champs

- Retrait de la création du scénario modèle depuis l’écran « Nouveau
  formulaire », où aucun champ n’est encore disponible.
- Affichage du bouton uniquement lorsqu’au moins un champ existe et qu’aucun
  scénario n’est encore associé au formulaire.
- Disparition automatique du bouton après la création et l’association du
  scénario modèle.
- Conservation du parcours d’association manuelle d’un scénario existant dans
  l’éditeur du formulaire.

## V2.2 r26 — scénario modèle dès la création du formulaire

- Ajout de l’option « Créer et associer un scénario modèle » directement dans
  l’écran « Nouveau formulaire ».
- Proposition automatique d’un nom construit depuis celui du formulaire, avec
  possibilité de le personnaliser.
- Création du formulaire, du scénario, du bloc Code et de l’association dans
  une seule validation ; annulation de l’ensemble en cas d’échec.
- Conservation du bouton disponible sur un formulaire existant pour produire
  ultérieurement un modèle contenant ses champs déjà configurés.

## V2.2 r25 — tolérance aux associations orphelines

- Normalisation du retour de `scenario::byId()` : la valeur `false` utilisée
  par Jeedom lorsqu’un scénario n’existe plus devient `null` côté plugin.
- Les associations orphelines sont ainsi ignorées puis désactivées lors de la
  prochaine synchronisation, au lieu de provoquer une erreur de typage.
- Application du même correctif aux anciennes associations portées par les
  requêtes.

## V2.2 r24 — chargement des champs du scénario modèle

- Chargement explicite de la classe `scenarioformField` avant la génération du
  bloc Code, corrigeant l’erreur « Class scenarioformField not found ».
- Ajout d’un contrôle statique dédié à cette dépendance.

## V2.2 r23 — création d’un scénario modèle

- Ajout d’une action « Créer un scénario modèle » depuis le formulaire actif.
- Création d’un scénario Jeedom actif, rangé dans le groupe ScenarioForm et
  automatiquement associé au formulaire d’origine.
- Génération d’un bloc Code contenant une variable PHP sûre pour chaque tag du
  formulaire, des valeurs par défaut pour le lancement manuel et la détection
  du contexte ScenarioForm.
- Intégration des retours `accepted` et `error` via
  `scenarioform::sendResult()`, avec emplacements commentés à personnaliser.
- Refus des noms déjà utilisés et suppression du scénario si sa création ou
  son association ne peut pas être finalisée.

## V2.2 r22 — résultat visible après exécution

- Affichage du résultat métier directement sous les confirmations de validation
  et de lancement, sans passage par l'historique.
- Actualisation silencieuse de cette zone toutes les quatre secondes tant qu'un
  scénario de la réponse courante reste en attente.
- Interrogation ciblée de la seule réponse créée, avec contrôle de son
  appartenance au formulaire affiché.

## V2.2 r21 — liste d'actions ciblée

- Création et activation des équipements de retour uniquement pour les
  scénarios associés à au moins un formulaire ScenarioForm.
- Désactivation des équipements devenus inutiles afin de raccourcir le
  sélecteur de commandes sans perdre leurs identifiants internes.
- Réactivation transparente si un scénario est associé de nouveau.
- Actualisation du nom de l'équipement depuis le nom courant du scénario lors
  de la synchronisation des formulaires et à l'ouverture de ScenarioForm.

## V2.2 r20 — respect des associations supprimées

- Suppression de la recopie historique `requête–scénario` vers
  `formulaire–scénario` à chaque mise à jour.
- Une association supprimée volontairement dans un formulaire n'est désormais
  plus recréée lors de l'installation d'une nouvelle révision.
- La correction ne supprime aucune association existante : celle réintroduite
  par une ancienne révision peut être retirée une dernière fois manuellement.

## V2.2 r19 — actions liées à chaque scénario

- Remplacement de l'équipement d'action générique par un équipement technique
  distinct pour chaque scénario Jeedom actif.
- Conservation de l'identifiant du scénario cible dans chaque commande.
- Ajout d'un retour local contrôlé vers la réponse en attente la plus récente
  lorsque Jeedom ne transmet pas les tags à `cmd::execute()`.
- Suppression automatique de l'ancien équipement générique.

## V2.2 r18 — contexte des actions métier

- Récupération des quatre tags de callback directement depuis le moteur
  `scenarioExpression` lors de l'exécution d'une commande métier native.
- Conservation des méthodes précédentes comme replis selon la version du cœur
  Jeedom.
- Aucun changement nécessaire dans les scénarios déjà configurés avec les
  commandes r17.

## V2.2 r17 — actions métier natives

- Création automatique d'un équipement technique invisible fournissant quatre
  commandes d'action natives : accepter, refuser, avertir et signaler une erreur.
- Saisie directe du message métier dans l'éditeur graphique des scénarios.
- Récupération automatique du contexte et des tags ScenarioForm lors de
  l'exécution de la commande.
- Conservation de l'appel PHP en une ligne pour les usages avancés.

## V2.2 r16 — retour simplifié et attente bornée

- Ajout de `scenarioform::sendResult()` pour transmettre un résultat métier en
  une seule ligne depuis un bloc Code Jeedom.
- Ignorance propre de cet appel lorsque le scénario est lancé manuellement et
  ne possède pas les tags ScenarioForm.
- Passage automatique des résultats restés en attente à `timeout`, affiché
  comme « Aucun retour reçu ».
- Délai configurable de 30 secondes à 24 heures, avec 120 secondes par défaut.
- Arrêt naturel de l'actualisation de l'historique après expiration des attentes.

## V2.2 r15 — retour métier par scénario

- Initialisation d'un état `pending` indépendant pour chaque scénario lancé.
- Transmission au scénario de l'identifiant de réponse, de son identifiant,
  de l'URL de rappel et d'un jeton cryptographique.
- Ajout d'un point de retour dédié acceptant les états `accepted`, `rejected`,
  `warning` et `error`, avec contrôle du scénario et transition idempotente.
- Conservation exclusive du condensat du jeton et retrait du jeton de
  l'historique exposé au navigateur.
- Affichage des résultats métier dans l'historique et actualisation silencieuse
  toutes les quatre secondes tant qu'un scénario reste en attente.

## V2.2 r14 — affichage contextuel des comparaisons

- Masquage de la section « Comparaison avec un autre champ » lorsqu'aucun
  autre champ temporel compatible n'est disponible.
- Actualisation de cette disponibilité lorsque le type du champ est modifié.
- Alerte explicite lorsqu'une règle existante référence un champ supprimé ou
  devenu incompatible.
- Refus côté interface des configurations partielles contenant un opérateur
  sans champ de référence, ou inversement.

## V2.2 r13 — cohérence entre champs temporels

- Configuration d'une comparaison entre deux champs `date`, `time` ou
  `datetime` d'un même formulaire avec les opérateurs ≥, >, ≤ et <.
- Message immédiat près du champ contrôlé dès que l'une des deux valeurs est
  modifiée, avec possibilité de personnaliser le texte affiché.
- Répétition de la même validation côté serveur avant tout enregistrement ou
  lancement de scénario.
- Référence stable par identifiant de champ afin qu'un renommage du tag ne
  désactive pas silencieusement la règle.

## V2.2 r12 — navigation historique et ordre des champs

- Séparation explicite des modes gestion, saisie et historique afin qu'un
  retour à la nouvelle saisie ne puisse plus être remplacé par une réponse
  asynchrone devenue obsolète.
- Annulation des chargements précédents lors d'un changement d'écran et
  remplacement du clic artificiel sur « Historique » par un appel dédié.
- Attribution côté serveur de l'ordre suivant (`MAX(displayOrder) + 1`) lors
  de la création d'un champ, également préaffiché dans l'éditeur.

## V2.2 r11 — mode d’exécution mobile

- Ajout d’un bouton mobile « Gérer » qui regroupe les commandes de création,
  modification, configuration et suppression dans un niveau secondaire.
- Mise en avant du parcours courant sur smartphone : choisir une requête et un
  formulaire, saisir les valeurs, exécuter, puis consulter l’historique.
- Conservation de l’intégralité des commandes sur mobile après ouverture du
  mode gestion, sans créer de version fonctionnelle distincte.
- Interface desktop inchangée : le regroupement n’est actif que sous 768 px.

## V2.2 r10 — confort mobile

- Transformation des barres d’actions en grilles tactiles lisibles sur petit
  écran, avec cibles d’au moins 44 px et action destructive isolée.
- Passage des champs de saisie à 44 px de hauteur et 16 px de corps afin de
  faciliter la saisie tactile et d’éviter le zoom automatique des navigateurs
  mobiles.
- Séparation plus nette entre la liste des requêtes et l’espace d’édition.
- Amélioration du retour à la ligne des descriptions, valeurs et métadonnées
  longues, sans débordement horizontal de la page.
- Agrandissement des commandes d’ordonnancement des scénarios et adaptation des
  cartes, tableaux et actions de l’historique aux écrans étroits.

## V2.2 r9 — accès direct à l’historique

- Ajout du bouton « Historique » dans la barre d’actions du formulaire, aux
  côtés de « Modifier le formulaire », « Saisir les valeurs » et « Modifier les
  champs ».
- Ouverture automatique de l’écran de saisie et de l’historique lorsque cet
  accès direct est utilisé, afin de revoir immédiatement le précédent
  lancement.
- Suppression du bouton « Historique » redondant au pied de la saisie.

## V2.2 — finition visuelle (premier passage)

- Création d'une feuille de style dédiée, compatible avec les couleurs du thème
  Jeedom et les petits écrans.
- Clarification de la barre d'actions, de la navigation latérale, des titres et
  de l'espace de travail.
- Remplacement des pastilles emoji par des indicateurs d'état sobres.
- Présentation des formulaires et de l'historique sous forme de panneaux
  structurés.
- Harmonisation des espacements, bordures, états survolés et textes secondaires.
- Clarification du vocabulaire « Requêtes » / « Formulaires » et du bouton de
  création principal.
- Remplacement de l'état vide et de la notice d'édition très colorés par des
  composants sobres.
- Sélection visuelle unique dans la liste et suppression de la répétition du
  détail pendant l'édition d'une requête.
- Liste des scénarios limitée en hauteur, défilable et visuellement allégée afin
  de garder les actions de sauvegarde accessibles.
- Mise en évidence discrète des scénarios cochés et atténuation des commandes
  de déplacement hors survol ou navigation clavier.
- Sélection explicite du formulaire actif, regroupement des actions et mise à
  distance de l'action destructive.
- Présentation de la gestion des champs dans un panneau avec tableau responsive,
  en-têtes discrets et tags techniques différenciés.
- Recentrage de la saisie dans un panneau de largeur lisible, amélioration du
  rythme vertical et regroupement des actions d'exécution et d'historique.
- Présentation des champs de saisie sur deux colonnes à partir des écrans larges,
  avec retour automatique à une colonne sur mobile et contrôles plus compacts.
- Compactage de l'historique en cartes : date dans l'en-tête, métadonnées et
  valeurs en grilles responsives, barre de purge et actions harmonisées.
- Alignement du résumé de validation sur la largeur du panneau de saisie.
- Libellé contextuel « Ajouter des champs » pour un formulaire vide, puis
  « Modifier les champs » dès qu'il contient au moins un champ.
- Fond neutre pour les formulaires non sélectionnés et maintien d'une légère
  teinte d'accent uniquement sur le formulaire actif.

## V2.1 stabilisée — non-régression

- Alignement de la validation serveur des booléens obligatoires sur la
  validation navigateur : un booléen requis doit être coché.
- Échappement des messages d'erreur serveur et des noms de scénarios affichés
  après exécution.
- Arrêt explicite de `getHistory` lorsque l'identifiant du formulaire manque.
- Suppression d'anciens commentaires et d'une trace serveur classée à tort au
  niveau `error` lors de chaque lecture des valeurs.
- Ajout de tests exécutables pour les bornes inclusives 5 et 150, les refus de
  151 et 1000, les champs requis/facultatifs et les placeholders.

## V2.1 de validation

- Alignement de `scenario_id` sur le type réel `INT UNSIGNED` de la base Jeedom.
- Alignement du schéma neuf des champs sur la structure réellement observée.
- Ajout idempotent des cascades formulaire/champs/réponses/valeurs dans la
  migration, afin qu'une installation neuve retrouve l'intégrité référentielle
  validée sur Jeedom.
- Suppression de reliquats inutilisés : ancien générateur de tags, ancienne
  recherche de champ, chargeur de scénarios de requête et paramètre JavaScript
  ignoré lors de la sauvegarde d'une requête.

## V2 de validation

- Plusieurs formulaires autorisés pour une même requête.
- Association des scénarios au formulaire plutôt qu'à la requête.
- Ordre des scénarios propre à chaque formulaire.
- Glisser-déposer et commandes Monter/Descendre.
- Migration non destructive depuis `scenarioform_request_scenario`.
- Contrainte d'unicité `(form_id, scenario_id)`.
- Exécution des scénarios depuis le formulaire soumis.
- Conservation de la logique stabilisée `required`.
- Désactivation de l'affichage des erreurs PHP dans les réponses AJAX.
## 2026-08-17

- Enrichissement de l'historique avec la requête, le formulaire, la date, les
  valeurs, les scénarios demandés et le résultat de chaque lancement.
- Conservation d'un instantané du contexte dans la configuration de la réponse,
  sans migration de base de données.
- Les anciennes réponses restent lisibles et signalent les informations de
  lancement qui n'étaient pas encore enregistrées.
- Suppression du trajet technique inutilisé `getResponseHistory` : toute la
  gestion de l'historique passe désormais par `getHistory`.
- Suppression des traces `console.log` propres au chargement et à la reprise de
  l'historique, tout en conservant les erreurs et avertissements utiles.
- Les champs entiers et décimaux n'utilisent plus le spinner natif du navigateur,
  qui pouvait corriger silencieusement une valeur hors bornes. La valeur saisie
  est conservée telle quelle et les bornes inclusives sont contrôlées côté
  serveur avec un message indiquant le champ et la limite.
- Ajout, dans la configuration d'un champ texte obligatoire, d'une aide
  contextuelle précisant qu'un minimum vide ou égal à zéro correspond à une
  longueur minimale effective de 1.
- Ajout d'une assistance à trois niveaux dans le formulaire de saisie : Label
  permanent, placeholder généré depuis les contraintes, puis message précis
  sous chaque champ invalide avec résumé et focus sur la première erreur.
- Suppression de toutes les traces `console.log` de la version active ; les
  erreurs et avertissements utiles sont conservés.
- Suppression des quatre anciennes copies techniques suffixées `1608`.

### v2.2-beta3-r109 — Regroupement de l'historique (correctif de développement)
- Lorsque le tri actif porte sur un champ du formulaire, une seule ligne est affichée par valeur distincte.
- Le bouton « Voir » déplie les réponses du groupe et « Fermer » les replie, indépendamment pour chaque groupe.
- L'ordre des groupes et des réponses suit le tri actif (tri initial du formulaire ou modification provisoire de session).
- Les tris par date ou numéro conservent la liste classique. Les filtres, actions et export existants sont préservés.
- Correctif non validé en environnement Jeedom ; les avertissements de suppression/calendrier de l'archive source restent applicables.

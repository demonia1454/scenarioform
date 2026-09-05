# Changelog

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

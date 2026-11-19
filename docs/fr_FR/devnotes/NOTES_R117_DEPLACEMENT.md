# R117 — Déplacer un formulaire entre requêtes

Depuis l'administration ScenarioForm, ouvrir la requête d'origine, sélectionner le formulaire et cliquer sur Modifier. En bas de l'éditeur, choisir une autre requête dans « Déplacer vers une autre requête », puis confirmer.

**Attention :** enregistrer les autres changements du formulaire avant de le déplacer. Le déplacement ne sauvegarde pas les modifications non validées de l'éditeur.

L'opération conserve l'ID du formulaire, ses champs, ses associations aux scénarios et son historique. Elle change uniquement la requête de rattachement et place le formulaire à la fin de la requête cible. Les anciens liens contenant l'ID de la requête d'origine peuvent ne plus fonctionner.

## Test conseillé
1. Sauvegarder la configuration Jeedom et conserver l'archive R116.
2. Choisir un formulaire de test possédant une réponse historique ; relever son ID et consulter son historique.
3. Déplacer le formulaire ; vérifier qu'il disparaît de l'ancienne requête et apparaît dans la nouvelle.
4. Vérifier que l'ID, les champs, les scénarios associés et les anciennes réponses sont conservés.
5. Soumettre une nouvelle réponse dans la requête cible ; contrôler l'ancien et le nouvel historique.
6. Revenir à la requête d'origine si nécessaire avec le même outil.

Cette version n'a pas été testée en conditions réelles sur une installation Jeedom.

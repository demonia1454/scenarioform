# R119 — Réorganisation des requêtes

- Glisser-déposer discret des requêtes dans la colonne latérale (administrateurs uniquement).
- Sauvegarde de l’ordre via `reorderRequests`, validation exhaustive des identifiants et transaction SQL.
- Ordre partagé, conservé via `displayOrder` déjà présent en base de données.
- Aucun changement du comportement de sélection par clic, ni du déplacement des formulaires.
- En cas d’échec d’enregistrement, la liste est rechargée.
- À valider en environnement Jeedom, notamment le glisser-déposer tactile (HTML5 natif principalement destiné aux interfaces souris).

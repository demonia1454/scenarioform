# R122 — Remplacement d'un scénario en conservant ses champs

- Dans l'édition d'un formulaire, bouton « Remplacer » sur chaque scénario associé.
- Le remplacement est explicite et réservé aux administrateurs.
- Les champs liés à l'ancien scénario sont transférés vers le nouveau scénario dans une transaction SQL.
- Les autres associations et leurs champs ne sont pas modifiés.
- Un scénario supprimé de Jeedom reste visible dans l'éditeur comme « Scénario introuvable #ID » afin de permettre sa récupération.
- La destination doit être un scénario Jeedom existant non déjà associé au formulaire.

**Prudence :** vérifier sur une installation Jeedom 4.6 de test avant production. Les variables attendues par le scénario de destination doivent correspondre aux champs transférés. Les modifications non enregistrées du formulaire ne sont pas sauvegardées par le bouton de remplacement.

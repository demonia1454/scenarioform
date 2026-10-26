# ScenarioForm R116 – Variables Jeedom par champ

Base : archive `scenarioform-r113-correctif-expectresult-v3.zip`.

Dans l'édition d'un champ, renseigner « Variable Jeedom » puis choisir le mode :

- **Modifiable : transmettre au scénario** (par défaut) : valeur initiale issue de la variable, puis valeur soumise transmise comme avant. Pas d'écriture automatique.
- **Lecture seule** : champ désactivé dans le formulaire. Le serveur relit la variable Jeedom au moment de la soumission et ignore toute valeur falsifiée côté navigateur.
- **Modifiable : enregistrer aussi dans la variable Jeedom** : après validation des champs et vérification des droits d'exécution du scénario, le serveur écrit la valeur dans la variable avant le lancement du scénario.

Les formulaires existants restent en mode `transmit` si le paramètre est absent. La restauration de l'historique conserve sa priorité d'affichage existante. Les modes sont disponibles sur les champs standards, y compris les booléens et les listes.

**Précautions** : l'écriture intervient à l'acceptation du formulaire, pas après confirmation du retour métier. Elle n'est pas transactionnelle avec le lancement du scénario : une erreur ultérieure ne restaure pas la valeur précédente. Éviter le mode « écriture » pour des variables critiques sans validation métier supplémentaire. Les champs en lecture seule ne sont pas des secrets : la valeur est transmise au navigateur. Une variable affichée ne se rafraîchit pas pendant que le formulaire reste ouvert.

**Validation technique** : syntaxe PHP et JS contrôlée ; tests d'intégration Jeedom réels non exécutés.

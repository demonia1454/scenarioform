<?php
if (!isConnect()) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
?>

<div class="row row-overflow">
    <div class="col-xs-12 col-md-10 col-md-offset-1">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title"><i class="fas fa-book"></i> {{ScenarioForm — Guide d'utilisation}}</h3>
            </div>
            <div class="panel-body">
                <p class="lead">{{ScenarioForm permet de saisir des valeurs dans un formulaire, puis de lancer un ou plusieurs scénarios Jeedom avec ces valeurs.}}</p>

                <h3>{{Créer rapidement un premier exemple}}</h3>
                <ol>
                    <li>{{Ouvrez ScenarioForm depuis le menu de Jeedom.}}</li>
                    <li>{{Cliquez sur « Assistant premier formulaire ».}}</li>
                    <li>{{Suivez les étapes proposées pour créer la requête, le formulaire et le scénario modèle.}}</li>
                    <li>{{Saisissez les valeurs, puis validez le formulaire pour tester l'exécution.}}</li>
                </ol>

                <h3>{{Créer son propre formulaire}}</h3>
                <ol>
                    <li>{{Créez une requête afin de regrouper les formulaires d'un même usage.}}</li>
                    <li>{{Créez un formulaire et associez-lui un ou plusieurs scénarios.}}</li>
                    <li>{{Ajoutez les champs nécessaires, leurs valeurs par défaut et leurs règles de validation.}}</li>
                    <li>{{Dans le scénario Jeedom, récupérez les valeurs transmises par les tags ScenarioForm.}}</li>
                </ol>

                <h3>{{Utiliser un formulaire au quotidien}}</h3>
                <p>{{Sélectionnez une requête, ouvrez le formulaire, complétez les valeurs puis cliquez sur « Valider ». Le résultat métier du scénario apparaît lorsque celui-ci en renvoie un. Les saisies précédentes restent disponibles dans votre historique.}}</p>

                <h3>{{Utilisateurs limités et droits Jeedom}}</h3>
                <p>{{Un compte limité peut saisir, exécuter et consulter son propre historique. Pour autoriser l'exécution, accordez le droit « Visualisation et exécution » au scénario concerné dans la section Scénarios de la gestion des droits Jeedom. Les droits de la première page « Équipements » ne remplacent pas les droits des scénarios.}}</p>

                <h3>{{Accès distant et sécurité}}</h3>
                <ul>
                    <li>{{Utilisez de préférence Jeedom derrière HTTPS pour l'accès extérieur.}}</li>
                    <li>{{N'exposez jamais les clés API ou les jetons de rappel dans un journal ou une capture d'écran.}}</li>
                    <li>{{Le rappel interne ScenarioForm doit rester accessible depuis Jeedom lui-même.}}</li>
                </ul>

                <h3>{{En cas de difficulté}}</h3>
                <table class="table table-striped table-bordered">
                    <thead><tr><th>{{Symptôme}}</th><th>{{Vérification}}</th></tr></thead>
                    <tbody>
                        <tr><td>{{Le scénario est visible mais ne s'exécute pas}}</td><td>{{Vérifiez son droit « Visualisation et exécution » dans la section Scénarios.}}</td></tr>
                        <tr><td>{{Aucun retour métier}}</td><td>{{Vérifiez que le scénario appelle scenarioform::sendResult().}}</td></tr>
                        <tr><td>{{Le formulaire refuse une valeur}}</td><td>{{Contrôlez les champs obligatoires et les règles de validation.}}</td></tr>
                        <tr><td>{{Le résultat reste en attente}}</td><td>{{Contrôlez l'URL interne de Jeedom et les journaux expurgés de tout secret.}}</td></tr>
                    </tbody>
                </table>

                <h3>{{Mises à jour}}</h3>
                <p>{{Une mise à jour normale du plugin conserve les requêtes, formulaires, champs, historiques et droits Jeedom. Évitez de désactiver puis réactiver inutilement le plugin : Jeedom peut alors réinitialiser certains droits. Effectuez une sauvegarde Jeedom avant toute intervention importante.}}</p>

                <div class="alert alert-info">
                    {{La version 2.2 privilégie la création, l'exécution et l'historique opérationnel. Les fonctions avancées d'analyse et de statistiques sont prévues pour une future version 2.3.}}
                </div>

                <a class="btn btn-default" href="index.php?v=d&m=scenarioform&p=scenarioform">
                    <i class="fas fa-arrow-left"></i> {{Retour à ScenarioForm}}
                </a>
            </div>
        </div>
    </div>
</div>

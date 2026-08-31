<?php
if (!isConnect()) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
$scenarioformIsAdmin = isConnect('admin');
?>

<?php include_file('desktop', 'scenarioform', 'css', 'scenarioform'); ?>

<div class="row row-overflow scenarioform-app<?php echo $scenarioformIsAdmin ? '' : ' scenarioform-user-mode'; ?>">
    <script>window.scenarioformIsAdmin = <?php echo $scenarioformIsAdmin ? 'true' : 'false'; ?>;</script>
    <?php if (!$scenarioformIsAdmin) { ?>
    <div class="col-xs-12">
        <div class="alert alert-info scenarioform-user-mode-notice">
            {{Mode utilisateur : saisie, exécution et consultation de votre historique.}}
        </div>
    </div>
    <?php } ?>

    <!-- Barre d'actions -->
    <div class="col-xs-12 scenarioform-toolbar">
        <div class="pull-right scenarioform-toolbar-actions">
            <button class="btn btn-default btn-sm scenarioform-mobile-management-toggle"
                    id="bt_toggleMobileManagement"
                    type="button"
                    aria-expanded="false">
                <i class="fas fa-cog"></i>
                <span>Gérer</span>
            </button>
            <a class="btn btn-success btn-sm scenarioform-mobile-admin-action" id="bt_addScenarioForm">
                <i class="fas fa-plus-circle"></i>
                {{Nouvelle requête}}
            </a>
            <a class="btn btn-primary btn-sm scenarioform-mobile-admin-action" id="bt_scenarioformAssistant">
                <i class="fas fa-magic"></i>
                {{Assistant premier formulaire}}
            </a>
            <a class="btn btn-default btn-sm" id="bt_backScenarioForm">
                <i class="fas fa-arrow-left"></i>
                {{Retour}}
            </a>
        </div>
    </div>

    <!-- Liste -->
    <div class="col-lg-3 col-md-4 col-sm-5 scenarioform-sidebar">
        <legend class="scenarioform-section-title">
            <i class="fas fa-list"></i>
            {{Requêtes}}
        </legend>

        <div id="div_scenarioformList" class="list-group">
            <!-- alimenté en JS -->
        </div>
    </div>

    <!-- Edition -->
    <div class="col-lg-9 col-md-8 col-sm-7 scenarioform-main">

        <legend class="scenarioform-section-title">
            <i class="fas fa-edit"></i>
            {{Edition}}
        </legend>

<div id="div_scenarioformEdition" class="scenarioform-workspace">

    <div id="scenarioform-request-detail">
    </div>


    <div id="scenarioform-scenarios">
    </div>


    <div id="div_scenarioform-form"></div>

    <div id="scenarioform-fields-management"></div> 

</div>

	<div id="scenarioform-request-edit">
	</div> 

            <div id="scenarioform-empty-message" class="scenarioform-empty-state">
                <i class="far fa-hand-pointer" aria-hidden="true"></i>
                <strong>{{Sélectionnez une requête}}</strong>
                <span>{{Choisissez un élément dans la liste pour afficher ses formulaires.}}</span>
            </div>

        </div>

    </div>

</div>

<?php include_file('desktop', 'scenarioform', 'js', 'scenarioform'); ?>

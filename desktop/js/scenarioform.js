"use strict";

var scenarioformViewMode = 'idle';
var scenarioformValuesRequest = null;
var scenarioformHistoryRequest = null;
var scenarioformHistoryPollTimer = null;
var scenarioformResultRequest = null;
var scenarioformResultPollTimer = null;
var scenarioformPendingExecution = null;
var scenarioformPendingReuseResponseId = null;
var scenarioformPendingEditResponseId = null;
var scenarioformCopySources = [];
var scenarioformHistory = [];
var scenarioformReports = [];

$(document).off('.scenarioform');

//
//        RESET ECRAN SCENARIOFORM
// 

function resetScenarioFormScreen() {

    scenarioformViewMode = 'idle';
    scenarioformReports = [];
    scenarioformPendingReuseResponseId = null;
    scenarioformPendingExecution = null;

    if (scenarioformValuesRequest) {
        scenarioformValuesRequest.abort();
        scenarioformValuesRequest = null;
    }

    if (scenarioformHistoryRequest) {
        scenarioformHistoryRequest.abort();
        scenarioformHistoryRequest = null;
    }

    if (scenarioformHistoryPollTimer) {
        clearTimeout(scenarioformHistoryPollTimer);
        scenarioformHistoryPollTimer = null;
    }

    if (scenarioformResultRequest) {
        scenarioformResultRequest.abort();
        scenarioformResultRequest = null;
    }

    if (scenarioformResultPollTimer) {
        clearTimeout(scenarioformResultPollTimer);
        scenarioformResultPollTimer = null;
    }

    $('#scenarioform-request-detail')
        .html('');


    $('#scenarioform-request-edit')
        .html('')
        .hide();


    $('#div_scenarioform-form')
        .html('')
        .show();

    $('#scenarioform-fields-management')
    .html('')
    .hide();
    

    $('#scenarioform-empty-message')
        .show();

    $('#scenarioform-main-title')
        .hide();

}

//  
//        INITIALISATION
//
$(function () {



    resetScenarioFormScreen();

    loadRequestList();

});

function loadRequestList() {

    $.ajax({
        type: 'POST',
        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
        data: {
            action: 'getRequestList'
        },
        dataType: 'json',

        success: function (data) {


            if (data.state !== 'ok') {

                $('#div_scenarioformList').html(
                    '<div class="alert alert-danger">' +
                    data.result +
                    '</div>'
                );

                return;
            }

            let html = '';

data.result.forEach(function (request) {

    let stateClass = request.isEnable ? 'is-enabled' : 'is-disabled';
    let stateLabel = request.isEnable ? 'Active' : 'Inactive';

    html += `
        <a href="#"
           class="list-group-item scenarioform-request ${stateClass}"
           data-id="${request.id}"
           title="${scenarioformEscapeAttribute(request.name)}"
           data-request-name="${scenarioformEscapeHtml(request.name)}">
            <span class="scenarioform-request-heading">
                <strong>${scenarioformEscapeHtml(request.name)}</strong>
                <span class="scenarioform-status" title="${stateLabel}">
                    <span class="scenarioform-status-dot" aria-hidden="true"></span>
                    ${stateLabel}
                </span>
            </span>
            <small>${scenarioformEscapeHtml(request.description || 'Aucune description')}</small>

        </a>
    `;
});
            $('#div_scenarioformList').html(html);

            // Accès direct depuis la WebApp mobile : sélection de la requête et du formulaire.
            var params = new URLSearchParams(window.location.search);
            var requestedId = parseInt(params.get('sf_request'), 10);
            var requestedForm = parseInt(params.get('sf_form'), 10);
            if (requestedId > 0 && data.result.some(function (item) {
                return parseInt(item.id, 10) === requestedId;
            })) {
                loadRequestDetail(requestedId, requestedForm > 0 ? requestedForm : undefined);
            }


        },

        error: function(xhr, status, error) {


        }
    });

}



function loadRequestDetail(id, selectedFormId) {

            $('#scenarioform-main-title')
                .show();

            $('.scenarioform-request')
                .removeClass('active')
                .filter('[data-id="' + parseInt(id, 10) + '"]')
                .addClass('active');


            $('#scenarioform-empty-message')
                .hide();

            $('#scenarioform-request-edit')
                .html('')
                .hide();


        // --------------------------------
        // Nettoyage complet ancien formulaire
        // --------------------------------

        $('#div_scenarioform-form')
            .removeAttr('data-form-id')
            .html('')
            .show();


        // --------------------------------
        // Chargement détail requête
        // --------------------------------

        $.ajax({

            type: 'POST',

            url:
                'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

            data: {
                action: 'getRequestDetail',
                id: id
            },

            dataType: 'json',


            success: function(data) {



                // --------------------------------
                // Vérification retour AJAX
                // --------------------------------

                if (data.state !== 'ok') {

                    $('#div_scenarioformEdition')
                        .html(
                            '<div class="alert alert-warning">' +
                            data.result +
                            '</div>'
                        );

                    return;
                }


                // --------------------------------
                // Récupération du détail
                // --------------------------------

                let detail = data.result;




                // --------------------------------
                // Récupération et mémorisation ID
                // --------------------------------

                const requestId = parseInt(
                    detail.request.id,
                    10
                );




                // --------------------------------
                // Mémorisation dans le bloc détail
                // --------------------------------

                $('#scenarioform-request-detail')
                    .attr(
                        'data-request-id',
                        requestId
                    )
                    .data(
                        'request-id',
                        requestId
                    );


                // --------------------------------
                // Mémorisation dans le conteneur
                // --------------------------------

                $('#div_scenarioformEdition')
                    .attr(
                        'data-request-id',
                        requestId
                    )
                    .data(
                        'request-id',
                        requestId
                    );




                // --------------------------------
                // Bloc détail requête
                // --------------------------------

                let htmlRequest = '';


                htmlRequest += `
                    <h3 class="scenarioform-page-title">
                        Requête : ${detail.request.name}
                    </h3>
                `;


                htmlRequest += `
                    <p class="scenarioform-page-description">
                        ${detail.request.description || ''}
                    </p>
                `;


                htmlRequest += `

                    <button
                        class="btn btn-warning btn-sm scenarioform-mobile-admin-action"
                        id="bt_editRequest">

                        <i class="fas fa-edit"></i>
                        Modifier la requête

                    </button>


                    <button
                        class="btn btn-danger btn-sm scenarioform-mobile-admin-action"
                        id="bt_removeRequest">

                        <i class="fas fa-trash"></i>
                        Supprimer la requête

                    </button>

                `;


                $('#scenarioform-request-detail')
                    .html(htmlRequest)
                    .show();


                // --------------------------------
                // Chargement formulaire
                // --------------------------------

                $('#div_scenarioform-form')
                    .html(
                        'Chargement du formulaire...'
                    );


                let forms = Array.isArray(detail.forms) ? detail.forms : [];
                let formListHtml = `
                    <div class="scenarioform-form-list scenarioform-card">
                        <div class="scenarioform-card-header">
                        <h4>Formulaires</h4>
                        <div class="scenarioform-card-header-actions">
                            <button class="btn btn-success btn-sm scenarioform-mobile-admin-action" id="bt_createForm">
                                <i class="fas fa-plus-circle"></i> Créer un formulaire
                            </button>
                            <button class="btn btn-default btn-sm scenarioform-mobile-admin-action"
                                    id="bt_editForm" disabled>
                                <i class="fas fa-edit"></i> Modifier le formulaire
                            </button>
                            <button class="btn btn-danger btn-sm scenarioform-danger-action scenarioform-mobile-admin-action"
                                    id="bt_removeForm" disabled>
                                <i class="fas fa-trash-alt"></i> Supprimer le formulaire
                            </button>
                        </div>
                        </div>
                        <div class="list-group scenarioform-form-choices">
                `;

                forms.forEach(function(form) {
                    let scenarioNames = (form.scenarios || []).map(function(item) {
                        return item.name;
                    }).join(', ');
                    formListHtml += `
                        <div class="list-group-item scenarioform-form-choice"
                             role="button" tabindex="0" draggable="true" aria-selected="false"
                             data-form-id="${form.id}"
                             data-form-name="${scenarioformEscapeHtml(form.name)}">
                            <span class="scenarioform-form-choice-main">
                                <i class="fas fa-grip-vertical scenarioform-form-drag-handle"
                                   aria-hidden="true" title="Déplacer"></i>
                                <i class="fas fa-check-circle scenarioform-form-active-icon"
                                   aria-hidden="true"></i>
                                <strong>${scenarioformEscapeHtml(form.name)}</strong>
                                <span class="scenarioform-form-active-badge">Formulaire actif</span>
                            </span>
                            <span class="text-muted">${scenarioformEscapeHtml(scenarioNames || 'Aucun scénario')}</span>
                            <span class="scenarioform-form-order-actions">
                                <button type="button" class="btn btn-default btn-xs bt_form_up"
                                        title="Monter" aria-label="Monter ce formulaire">
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                                <button type="button" class="btn btn-default btn-xs bt_form_down"
                                        title="Descendre" aria-label="Descendre ce formulaire">
                                    <i class="fas fa-arrow-down"></i>
                                </button>
                            </span>
                        </div>
                    `;
                });

                formListHtml += '</div></div><div id="scenarioform-selected-form"></div>';
                $('#div_scenarioform-form').removeAttr('data-form-id').html(formListHtml);

                if (forms.length > 0) {
                    let requestedFormId = parseInt(selectedFormId, 10);
                    let selectedForm = forms.find(function(form) {
                        return parseInt(form.id, 10) === requestedFormId;
                    });
                    loadRequestForm(detail.request.id, selectedForm ? selectedForm.id : forms[0].id);
                } else {
                    $('#scenarioform-selected-form').html(
                        '<div class="alert alert-warning">Aucun formulaire associé</div>'
                    );
                }

            },


            error: function(xhr) {

                console.error(
                    'Erreur AJAX loadRequestDetail :',
                    xhr.responseText
                );

            }

        });

}

function scenarioformReturnToRequestDetail(requestId) {

    let selectedFormId = parseInt(
        $('#div_scenarioform-form').attr('data-form-id'),
        10
    );

    loadRequestDetail(
        requestId,
        selectedFormId > 0 ? selectedFormId : undefined
    );

}


function editRequest(id) {

    $('#scenarioform-request-detail').hide();

    $('#div_scenarioform-form').hide();

    $('#scenarioform-fields-management').hide();

    $('#scenarioform-request-edit').show();

    $.ajax({

        type: 'POST',

        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data: {
            action: 'getRequestDetail',
            id: id
        },

        dataType: 'json',


        success: function(data) {



            if (data.state !== 'ok') {
                return;
            }


            let detail = data.result;

            let html = '';

            html += '<h3 class="scenarioform-page-title">Modifier la requête</h3>';
            html += '<p class="scenarioform-page-description">Mettez à jour son nom et sa description.</p>';


            html += '<div class="form-group">';
            html += '<label>Nom</label>';

            html += `
            <input type="text"
                   class="form-control"
                   id="edit_request_name"
                   value="${detail.request.name}">
            `;

            html += '</div>';



            html += '<div class="form-group">';
            html += '<label>Description</label>';

            html += `
            <textarea
              class="form-control"
              id="edit_request_description">${detail.request.description || ''}</textarea>
            `;

            html += '</div>';



            html += `
                <div class="scenarioform-notice">
                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                    Les scénarios sont maintenant associés à chaque formulaire.
                </div>
            `;


            html += '<br>';

            html += `
            <button class="btn btn-success"
                    id="bt_saveRequest">
                <i class="fas fa-save"></i>
                Sauvegarder
            </button>

            <button class="btn btn-default"
                    id="bt_backRequest"
                    data-request-id="${id}">
                Retour
            </button>
            `;


            $('#scenarioform-request-edit')
                .html(html);

        },


        error:function(xhr){


        }


    });


}

function loadRequestForm(requestId, formId)
    {

    $('.scenarioform-form-choice')
        .removeClass('active')
        .attr('aria-selected', 'false')
        .filter('[data-form-id="' + parseInt(formId, 10) + '"]')
        .addClass('active')
        .attr('aria-selected', 'true');

    $.ajax({

        type: 'POST',

        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data: {
            action: 'getForm',
            id: requestId,
            form_id: formId || 0
        },

        dataType: 'json',

        success: function(data)
        {



            if (data.state !== 'ok') {

                $('#scenarioform-selected-form')
                    .html(
                        '<div class="alert alert-warning">' +
                        data.result +
                        '</div>'
                    );


                $('#scenarioform-fields-management')
                    .html('')
                    .hide();

                return;
            }


            let form = data.result;
            scenarioformCopySources = Array.isArray(form.copy_sources)
                ? form.copy_sources
                : [];


            /*
            * Aucun formulaire associé
            */
            if (!form || !form.id) {

                $('#div_scenarioform-form')
                    .removeAttr('data-form-id')
                    .html(
                        `
                        <div class="alert alert-warning">
                            Aucun formulaire associé
                        </div>

                        <button class="btn btn-success btn-sm scenarioform-mobile-admin-action"
                                id="bt_createForm">

                            <i class="fas fa-plus-circle"></i>
                            Créer un formulaire

                        </button>
                        `
                    );


                $('#scenarioform-fields-management')
                    .html('')
                    .hide();


                return;

            }


            if (!Array.isArray(form.fields)) {
                form.fields = [];
            }

            let fieldsButtonLabel = form.fields.length === 0
                ? 'Ajouter des champs'
                : 'Modifier les champs';
            let fieldsButtonIcon = form.fields.length === 0
                ? 'fa-plus'
                : 'fa-list';
            let fieldScenarioChoices = form.field_scenarios || form.scenarios || [];
            if (fieldScenarioChoices.length === 0 && form.can_edit_scenarios) {
                fieldScenarioChoices = [{id: 0, name: 'Scénario modèle à créer', active: true}];
            }
            let canCopyFields = fieldScenarioChoices.length === 1;
            let hasPendingScenarioTemplate = fieldScenarioChoices.length === 1 &&
                parseInt(fieldScenarioChoices[0].id, 10) === 0;
            let fieldScenarioDestinationControl = hasPendingScenarioTemplate
                ? '<strong>Scénario modèle à créer</strong>' +
                    '<input type="hidden" id="scenarioform-field-scenario" value="0">'
                : `<select id="scenarioform-field-scenario" class="form-control input-sm">
                    ${fieldScenarioChoices.map(function(scenario) {
                        return '<option value="' + parseInt(scenario.id, 10) + '">' +
                            scenarioformEscapeHtml(scenario.name) +
                            (scenario.active === false ? ' — désactivé' : '') + '</option>';
                    }).join('')}
                </select>`;


            /*
            * Mémorisation ID formulaire
            */
            $('#div_scenarioform-form')
                .attr(
                    'data-form-id',
                    form.id
                )
                .attr(
                    'data-scenario-count',
                    Array.isArray(form.scenarios) ? form.scenarios.length : 0
                )
                .attr(
                    'data-can-edit-scenarios',
                    form.can_edit_scenarios ? '1' : '0'
                );


            //
            // Construction HTML
            //

            let html = '';
            let scenarioOpenButtons = '';


            html += `
                <h3 class="scenarioform-page-title">Formulaire : ${scenarioformEscapeHtml(form.name)}</h3>
            `;


            html += `
                <p class="scenarioform-page-description">
                    ${scenarioformEscapeHtml(form.description || '')}
                </p>
            `;

            if (Array.isArray(form.scenarios) && form.scenarios.length > 0) {
                html += '<div class="scenarioform-associated-scenarios"><strong>Scénarios :</strong><ul>';
                form.scenarios.forEach(function(item) {
                    let returnLabel = item.expect_result
                        ? 'Retour métier attendu'
                        : 'Aucun retour métier attendu';
                    html += '<li><span>' + scenarioformEscapeHtml(item.name) +
                        '</span> — <span class="text-muted">' + returnLabel + '</span></li>';
                    if (form.can_edit_scenarios && item.edit_url) {
                        let openLabel = form.scenarios.length > 1
                            ? 'Ouvrir : ' + scenarioformEscapeHtml(item.name)
                            : 'Ouvrir le scénario';
                        scenarioOpenButtons += '<a class="btn btn-default btn-sm scenarioform-mobile-admin-action" ' +
                            'target="_blank" rel="noopener" href="' +
                            scenarioformEscapeAttribute(item.edit_url) + '">' +
                            '<i class="fas fa-external-link-alt"></i> ' + openLabel + '</a>';
                    }
                });
                html += '</ul></div>';
            }
        
            html += `

            <div id="scenarioform-execute-zone"></div>

            `;
     
            $('#scenarioform-selected-form')
                .html(html);


            /*
            * Boutons formulaire
            */
            $('#scenarioform-selected-form')
                .prepend(

                `

                <div class="scenarioform-form-actions">
                <button class="btn btn-success btn-sm"
                        id="bt_enterFormValues">

                    <i class="fas fa-keyboard"></i>
                    Saisir les valeurs

                </button>

                <button class="btn btn-default btn-sm scenarioform-mobile-admin-action"
                        id="bt_manageFields">

                    <i class="fas ${fieldsButtonIcon}"></i>
                    ${fieldsButtonLabel}

                </button>

                ${form.can_edit_scenarios && form.fields.length > 0 && (!Array.isArray(form.scenarios) || form.scenarios.length === 0) ? `
                    <button class="btn btn-primary btn-sm scenarioform-mobile-admin-action"
                            id="bt_createScenarioTemplate">

                        <i class="fas fa-code"></i>
                        Créer un scénario modèle

                    </button>
                ` : ''}

                <button class="btn btn-default btn-sm" id="bt_formReports" type="button">
                    <i class="fas fa-file-alt"></i> Comptes rendus
                </button>

                <button class="btn btn-default btn-sm"
                        id="bt_historyForm">

                    <i class="fas fa-history"></i>
                    Historique

                </button>

                ${scenarioOpenButtons}


                </div>

                `

            );

            $('#bt_editForm, #bt_removeForm').prop('disabled', false);


            /*
            * Gestion des fields
            */
            if ($('#scenarioform-fields-management').length === 0) {

                $('#div_scenarioform-form')
                    .after(
                        '<div id="scenarioform-fields-management"></div>'
                    );

            }



            $('#scenarioform-fields-management')
                .html(
                `
                <div id="scenarioform-fields" class="scenarioform-card scenarioform-fields-card">
                    <div class="scenarioform-card-header">
                    <h4>
                        <i class="fas fa-list"></i>
                        Champs / Variables
                    </h4>


                    <div class="scenarioform-field-scenario-actions">
                    <span class="scenarioform-field-destination-label">Destination :</span>
                    ${fieldScenarioDestinationControl}
                    <button class="btn btn-default btn-sm" id="bt_copyScenarioFields"
                            ${canCopyFields ? '' : 'disabled title="Disponible lorsque le formulaire possède une seule destination"'}>
                        <i class="fas fa-copy"></i> Copier depuis…
                    </button>
                    <button class="btn btn-primary btn-sm"
                            id="bt_addField">

                        <i class="fas fa-plus"></i>
                        Ajouter un champ

                    </button>
                    </div>
                    </div>

                    <div id="scenarioform-fields-list">

                    </div>

                </div>

                `

            )
            .hide();



            /*
            * Chargement liste champs
            */
            loadFieldList(form.id, parseInt($('#scenarioform-field-scenario').val(), 10));



        },


        error:function(xhr)
        {


        }

});

}

$(document).on('click.scenarioform', '#bt_createScenarioTemplate', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    let requestId = parseInt($('.scenarioform-request.active').attr('data-id'), 10);
    let formName = $.trim($('#scenarioform-selected-form .scenarioform-page-title').text())
        .replace(/^Formulaire\s*:\s*/i, '');

    if (!formId) {
        alert('Formulaire introuvable');
        return;
    }

    bootbox.prompt({
        title: 'Nom du nouveau scénario modèle',
        value: formName ? 'ScenarioForm — ' + formName : 'ScenarioForm — Nouveau scénario',
        callback: function(name) {
            name = $.trim(name || '');
            if (name === '') {
                return;
            }

            let button = $('#bt_createScenarioTemplate');
            $.ajax({
                type: 'POST',
                url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
                data: {
                    action: 'createScenarioTemplate',
                    form_id: formId,
                    name: name
                },
                dataType: 'json',
                beforeSend: function() {
                    button.prop('disabled', true)
                        .html('<i class="fas fa-spinner fa-spin"></i> Création...');
                },
                success: function(data) {
                    if (!data || data.state !== 'ok') {
                        alert((data && data.result) || 'Erreur lors de la création du scénario');
                        return;
                    }

                    loadRequestForm(requestId, formId);
                    bootbox.dialog({
                        title: 'Scénario modèle créé',
                        message:
                            '<p>Le scénario <strong>' + scenarioformEscapeHtml(data.result.name) +
                            '</strong> a été créé et associé au formulaire.</p>' +
                            '<p>Son bloc Code contient les variables des champs et le retour métier.</p>',
                        buttons: {
                            close: {
                                label: 'Fermer',
                                className: 'btn-default'
                            },
                            edit: {
                                label: '<i class="fas fa-external-link-alt"></i> Ouvrir le scénario',
                                className: 'btn-primary',
                                callback: function() {
                                    window.open(data.result.edit_url, '_blank');
                                }
                            }
                        }
                    });
                },
                error: function() {
                    alert('Erreur technique lors de la création du scénario');
                },
                complete: function() {
                    button.prop('disabled', false)
                        .html('<i class="fas fa-code"></i> Créer un scénario modèle');
                }
            });
        }
    });
});
    
function showFormValues(formId, openHistory, scenarioId)
    {

        if (openHistory === true) {
            showFormHistory(formId);
            return;
        }

        var requestedMode = 'entry';
        scenarioformViewMode = requestedMode;

        if (scenarioformValuesRequest) {
            scenarioformValuesRequest.abort();
        }

        scenarioformValuesRequest = $.ajax({

            type: 'POST',

            url:
                'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

            data: {

                action: 'getFieldList',
                form_id: formId,
                entry: 1,
                scenario_id: scenarioId || 0

            },

            dataType: 'json',


            success: function(data)
            {

                if (scenarioformViewMode !== requestedMode) {
                    return;
                }



                if (data.state !== 'ok') {

                    console.error(
                        'fieldlist ERREUR =',
                        data.result
                    );


                    jeedomUtils.showAlert({

                        message: data.result,

                        level: 'danger'

                    });

                    return;

                }


                let entryData = data.result || {};
                let fields = entryData.fields;
                let scenarios = Array.isArray(entryData.scenarios) ? entryData.scenarios : [];
                let selectedScenarioId = parseInt(entryData.scenario_id, 10) || 0;


                if (!Array.isArray(fields)) {

                    fields = [];

                }




                /*
                * ==========================================
                * CONSTRUCTION HTML
                * ==========================================
                */

                let html = '';


                html += `

                    <div class="scenarioform-entry-card">
                    <div class="scenarioform-entry-header">
                    <div class="scenarioform-entry-header-copy">
                        <h4>

                            <i class="fas fa-edit"></i>

                            Valeurs à saisir

                        </h4>
                        <p>Renseignez les informations nécessaires avant l’exécution.</p>
                    </div>
                    ${selectedScenarioId && fields.length > 0 ? `
                        <div class="scenarioform-entry-actions">
                            <button
                                type="button"
                                class="btn btn-success"
                                id="bt_executeForm">

                                <i class="fas fa-play"></i>

                                Valider et exécuter

                            </button>

                            <button
                                type="button"
                                class="btn btn-default btn-sm"
                                id="bt_backExecuteForm">

                                <i class="fas fa-arrow-left"></i>
                                Retour
                            </button>
                        </div>
                    ` : ''}
                    </div>
                    ${scenarios.length > 1 ? `
                        <div class="form-group scenarioform-entry-scenario">
                            <label for="scenarioform-entry-scenario">Scénario à exécuter</label>
                            <select id="scenarioform-entry-scenario" class="form-control">
                                <option value="">— Choisir un scénario —</option>
                                ${scenarios.map(function(scenario) {
                                    let id = parseInt(scenario.id, 10);
                                    return '<option value="' + id + '" ' +
                                        (id === selectedScenarioId ? 'selected' : '') + '>' +
                                        scenarioformEscapeHtml(scenario.name) + '</option>';
                                }).join('')}
                            </select>
                        </div>
                    ` : ''}
                    <div class="scenarioform-entry-fields">

                `;


                if (!selectedScenarioId) {
                    html += '<div class="alert alert-info">Choisissez un scénario pour afficher ses champs.</div></div>';
                } else if (fields.length === 0) {

                    html += `

                        <div class="alert alert-info">

                            Aucun champ à renseigner.

                        </div>
                        </div>

                    `;

                } else {


                    fields.forEach(
                        function(field)
                        {

                            /*
                            * Champ désactivé
                            *
                            * On ne l'affiche pas dans
                            * la saisie utilisateur.
                            */

                            if (
                                field.isEnable === false ||
                                field.isEnable === 0 ||
                                field.isEnable === '0'
                            ) {

                                return;

                            }


                            /*
                            * ==================================
                            * TYPE HTML
                            * ==================================
                            */

                            let inputType = 'text';


                            switch (field.type) {

                                case 'date':

                                    inputType = 'date';

                                    break;


                                case 'time':

                                    inputType = 'time';

                                    break;


                                case 'datetime':

                                    inputType = 'datetime-local';

                                    break;


                                case 'boolean':

                                    inputType = 'checkbox';

                                    break;

                                case 'integer':

                                    inputType = 'text';

                                    break;

                                case 'decimal':

                                    inputType = 'text';

                                    break;

                                case 'email':

                                    inputType = 'email';

                                    break;


                                case 'text':

                                default:

                                    inputType = 'text';

                                    break;

                            }


                            /*
                            * ==================================
                            * REQUIRED
                            * ==================================
                            */

                            let isRequired = (

                                field.required === true ||

                                field.required === 1 ||

                                field.required === '1'

                            );


                            /*
                            * ==================================
                            * LABEL
                            * ==================================
                            */

                            let label =
                                field.label ||
                                field.name;


                            if (isRequired) {

                                label +=
                                    ' *';

                            }


                            /*
                            * ==================================
                            * TAG
                            * ==================================
                            */

                            let tag =
                                field.tag ||
                                field.name;

                            let configuration = field.configuration || {};
                            let readonlyAttribute = configuration.initialVariable && configuration.variableMode === 'readonly' ? ' disabled aria-disabled="true"' : '';
                            let initialValue = field.initialValue !== undefined && field.initialValue !== null
                                ? String(field.initialValue)
                                : '';
                            if (field.type === 'datetime' && initialValue.indexOf(' ') !== -1 && initialValue.indexOf('T') === -1) {
                                initialValue = initialValue.replace(' ', 'T');
                            }
                            let constraintAttributes = '';
                            let placeholder = scenarioformBuildPlaceholder(field);
                            let placeholderAttribute = placeholder === ''
                                ? ''
                                : ' placeholder="' + scenarioformEscapeHtml(placeholder) + '"';
                            let validationAttributes =
                                ' data-field-label="' +
                                scenarioformEscapeHtml(field.label || field.name) + '"' +
                                ' data-field-type="' + scenarioformEscapeHtml(field.type) + '"';

                            ['minLength', 'maxLength', 'min', 'max', 'step']
                                .forEach(function(key) {
                                    if (configuration[key] !== undefined && configuration[key] !== '') {
                                        let attributeName = key.replace(/[A-Z]/g, function(letter) {
                                            return '-' + letter.toLowerCase();
                                        });
                                        validationAttributes +=
                                            ' data-' + attributeName + '="' +
                                            scenarioformEscapeHtml(configuration[key]) + '"';
                                    }
                                });

                            if (configuration.comparisonFieldId && configuration.comparisonOperator) {
                                validationAttributes +=
                                    ' data-compare-field-id="' +
                                    parseInt(configuration.comparisonFieldId, 10) + '"' +
                                    ' data-compare-operator="' +
                                    scenarioformEscapeAttribute(configuration.comparisonOperator) + '"' +
                                    ' data-compare-message="' +
                                    scenarioformEscapeAttribute(configuration.comparisonMessage || '') + '"';
                            }

                            if (field.type === 'integer') {
                                constraintAttributes += ' inputmode="numeric"';
                            } else if (field.type === 'decimal') {
                                constraintAttributes += ' inputmode="decimal"';
                            }

                            if (configuration.minLength !== undefined) {
                                constraintAttributes += ' minlength="' +
                                    parseInt(configuration.minLength, 10) + '"';
                            }
                            if (configuration.maxLength !== undefined) {
                                constraintAttributes += ' maxlength="' +
                                    parseInt(configuration.maxLength, 10) + '"';
                            }
                            /*
                             * Les bornes numériques sont validées côté serveur.
                             * Un input texte avec clavier numérique évite que le
                             * navigateur corrige silencieusement une valeur hors
                             * bornes (par exemple 1000 transformé en 149).
                             */


                            /*
                            * ==================================
                            * BOOLEAN
                            * ==================================
                            */

                            if (
                                field.type === 'boolean'
                            ) {

                                html += `

                                    <div class="form-group">

                                        <div class="checkbox">

                                            <label>

                                                <input

                                                    type="checkbox"

                                                    class="scenarioform-field"

                                                    id="scenarioform-field-${field.id}"

                                                    name="${field.name}"

                                                    data-tag="${tag}"

                                                    ${validationAttributes} ${readonlyAttribute}

                                                    value="1"

                                                    ${['1', 'true', 'on', 'yes', 'oui'].indexOf(initialValue.toLowerCase()) !== -1 ? 'checked' : ''}

                                                >

                                                ${label}

                                            </label>

                                        </div>


                                    </div>

                                `;

                            } else if (field.type === 'textarea') {

                                html += `
                                    <div class="form-group">
                                        <label for="scenarioform-field-${field.id}">${label}</label>
                                        <textarea
                                            class="form-control scenarioform-field"
                                            id="scenarioform-field-${field.id}"
                                            name="${field.name}"
                                            data-tag="${tag}"
                                            ${isRequired ? 'required' : ''}
                                            ${validationAttributes} ${readonlyAttribute}
                                            ${placeholderAttribute}
                                            ${constraintAttributes}>${scenarioformEscapeHtml(initialValue)}</textarea>
                                    </div>
                                `;

                            } else if (field.type === 'select') {

                                let optionsHtml = isRequired
                                    ? '<option value="">— Sélectionner —</option>'
                                    : '<option value="">— Aucun choix —</option>';

                                (configuration.parentFieldId ? [] : (configuration.options || [])).forEach(function(option) {
                                    let escapedOption = scenarioformEscapeHtml(option);
                                    optionsHtml += '<option value="' + escapedOption + '"' +
                                        (String(option) === initialValue ? ' selected' : '') + '>' +
                                        escapedOption + '</option>';
                                });

                                html += `
                                    <div class="form-group">
                                        <label for="scenarioform-field-${field.id}">${label}</label>
                                        <select
                                            class="form-control scenarioform-field"
                                            id="scenarioform-field-${field.id}"
                                            name="${field.name}"
                                            data-tag="${tag}"
                                            ${configuration.parentFieldId ? 'data-parent-field-id="' + parseInt(configuration.parentFieldId, 10) + '"' : ''}
                                            ${validationAttributes} ${readonlyAttribute}
                                            ${isRequired ? 'required' : ''}>${optionsHtml}</select>
                                        ${window.scenarioformIsAdmin && !configuration.parentFieldId ? `
                                            <button type="button"
                                                    class="btn btn-default btn-xs scenarioform-add-select-option"
                                                    data-field-id="${parseInt(field.id, 10)}">
                                                <i class="fas fa-plus"></i> Ajouter une valeur
                                            </button>
                                        ` : ''}
                                    </div>
                                `;

                            } else {


                                /*
                                * ==================================
                                * AUTRES TYPES
                                * ==================================
                                */

                                html += `

                                    <div class="form-group">

                                        <label
                                            for="scenarioform-field-${field.id}">

                                            ${label}

                                        </label>


                                        <input

                                            type="${inputType}"

                                            class="form-control scenarioform-field"

                                            id="scenarioform-field-${field.id}"

                                            name="${field.name}"

                                            data-tag="${tag}"

                                            ${validationAttributes} ${readonlyAttribute}

                                            ${isRequired ? 'required' : ''}

                                            ${initialValue !== '' ? 'value="' + scenarioformEscapeAttribute(initialValue) + '"' : ''}

                                            ${placeholderAttribute}

                                            ${constraintAttributes}

                                        >


                                    </div>

                                `;

                            }

                        }
                    );


                    html += '</div>';

                }

                html += '</div>';


                /*
                * ==========================================
                * INJECTION
                * ==========================================
                */

                $('#scenarioform-execute-zone')
                    .html(html);

                function updateDependentChoices() {
                    $('#scenarioform-execute-zone select[data-parent-field-id]').each(function() {
                        let child = $(this);
                        let field = fields.find(function(item) { return String(item.id) === child.attr('id').replace('scenarioform-field-', ''); });
                        let config = field && field.configuration || {};
                        let parent = $('#scenarioform-field-' + config.parentFieldId);
                        let choices = (config.optionsByParent || {})[parent.val()] || [];
                        let previous = child.val();
                        let hasParentValue = !!parent.val();
                        let hasChoices = choices.length > 0;
                        child.empty().append($('<option></option>').val('').text(hasParentValue ? '— Sélectionner —' : '— Choisir d’abord la liste parente —'));
                        choices.forEach(function(choice) { child.append($('<option></option>').val(choice).text(choice)); });
                        child.val(choices.indexOf(previous) !== -1 ? previous : '');
                        child.prop('disabled', !hasParentValue || !hasChoices);
                        // Une liste dépendante sans choix pour la valeur parente n'a rien à saisir :
                        // on masque donc tout le champ (saisie normale comme modification d'historique).
                        child.closest('.form-group').toggle(!hasParentValue || hasChoices);
                    });
                }
                $('#scenarioform-execute-zone').off('change.scenarioformDependent')
                    .on('change.scenarioformDependent', 'select.scenarioform-field', updateDependentChoices);
                updateDependentChoices();

                $('#scenarioform-execute-zone').attr('data-scenario-id', selectedScenarioId || '');

                $('#scenarioform-execute-zone .scenarioform-field')
                    .off('input.scenarioformComparison change.scenarioformComparison')
                    .on(
                        'input.scenarioformComparison change.scenarioformComparison',
                        function()
                        {
                            let changedField = $(this);
                            let changedId = String(changedField.attr('id') || '')
                                .replace('scenarioform-field-', '');
                            let fieldsToValidate = changedField;

                            if (changedId !== '') {
                                fieldsToValidate = fieldsToValidate.add(
                                    '#scenarioform-execute-zone [data-compare-field-id="' +
                                    changedId + '"]'
                                );
                            }

                            fieldsToValidate.each(function() {
                                let field = $(this);
                                let group = field.closest('.form-group');
                                let error = scenarioformValidateInput(field);

                                group.removeClass('has-error')
                                    .find('.scenarioform-field-error')
                                    .remove();

                                if (error !== null) {
                                    group.addClass('has-error').append(
                                        '<div class="help-block scenarioform-field-error" role="alert">' +
                                        scenarioformEscapeHtml(error.message) +
                                        '</div>'
                                    );
                                }
                            });
                        }
                    );


                $('#scenarioform-fields-management').hide();

                if (scenarioformPendingReuseResponseId !== null) {
                    let pendingResponseId = scenarioformPendingReuseResponseId;
                    scenarioformPendingReuseResponseId = null;
                    $('<button type="button" class="scenarioform-history-reuse" style="display:none;"></button>')
                        .attr('data-response-id', pendingResponseId)
                        .appendTo('#scenarioform-execute-zone')
                        .trigger('click')
                        .remove();
                }

                if (openHistory === true) {
                    loadFormHistory(formId);
                }



            },


            error: function(xhr, status)
            {

                if (status === 'abort') {
                    return;
                }

                console.error(
                    '>>> ERREUR AJAX showFormValues',

                    xhr.responseText

                );

            },

            complete: function()
            {
                scenarioformValuesRequest = null;
            }

        });

}

$(document).on('click.scenarioform', '.scenarioform-add-select-option', function() {
    let button = $(this);
    let fieldId = parseInt(button.attr('data-field-id'), 10);
    let select = $('#scenarioform-field-' + fieldId);

    if (!window.scenarioformIsAdmin || !fieldId || select.length === 0) {
        return;
    }

    bootbox.prompt({
        title: 'Ajouter une valeur à la liste',
        callback: function(option) {
            option = $.trim(option || '');
            if (option === '') {
                return;
            }

            $.ajax({
                type: 'POST',
                url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
                data: {
                    action: 'addSelectOption',
                    field_id: fieldId,
                    option: option
                },
                dataType: 'json',
                beforeSend: function() {
                    button.prop('disabled', true);
                },
                success: function(data) {
                    if (!data || data.state !== 'ok') {
                        jeedomUtils.showAlert({
                            message: (data && data.result) || 'Impossible d’ajouter cette valeur',
                            level: 'danger'
                        });
                        return;
                    }

                    let savedOption = String(data.result.option || option);
                    let exists = select.find('option').filter(function() {
                        return $(this).val() === savedOption;
                    }).length > 0;

                    if (!exists) {
                        select.append($('<option></option>').val(savedOption).text(savedOption));
                    }
                    select.val(savedOption).trigger('change');
                    jeedomUtils.showAlert({
                        message: 'Valeur ajoutée à la liste',
                        level: 'success'
                    });
                },
                error: function() {
                    jeedomUtils.showAlert({
                        message: 'Impossible d’ajouter cette valeur',
                        level: 'danger'
                    });
                },
                complete: function() {
                    button.prop('disabled', false);
                }
            });
        }
    });
});

function scenarioformEscapeHtml(value)
{
    return $('<div>').text(value == null ? '' : String(value)).html();
}

function scenarioformEscapeAttribute(value)
{
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function scenarioformBuildPlaceholder(field)
{
    let configuration = field.configuration || {};
    let hasMin = configuration.min !== undefined && configuration.min !== '';
    let hasMax = configuration.max !== undefined && configuration.max !== '';
    let hasMinLength = configuration.minLength !== undefined && configuration.minLength !== '';
    let hasMaxLength = configuration.maxLength !== undefined && configuration.maxLength !== '';

    if (field.type === 'integer' || field.type === 'decimal') {
        let kind = field.type === 'integer' ? 'Entier' : 'Nombre';
        if (hasMin && hasMax) {
            return kind + ' entre ' + configuration.min + ' et ' + configuration.max;
        }
        if (hasMin) {
            return kind + ' supérieur ou égal à ' + configuration.min;
        }
        if (hasMax) {
            return kind + ' inférieur ou égal à ' + configuration.max;
        }
        return field.type === 'integer' ? 'Saisissez un entier' : 'Ex. 12.50';
    }

    if (field.type === 'email') {
        return 'nom@exemple.fr';
    }

    if (['text', 'textarea'].indexOf(field.type) !== -1) {
        if (hasMinLength && hasMaxLength) {
            return configuration.minLength + ' à ' + configuration.maxLength + ' caractères';
        }
        if (hasMinLength) {
            return 'Au moins ' + configuration.minLength + ' caractères';
        }
        if (hasMaxLength) {
            return configuration.maxLength + ' caractères maximum';
        }
        return field.required === true || field.required === 1 || field.required === '1'
            ? 'Saisissez une valeur'
            : '';
    }

    return '';
}

function scenarioformValidateInput(field)
{
    // Un champ dépendant désactivé (notamment lorsqu'aucun choix enfant n'existe)
    // ne doit pas participer à la validation côté navigateur.
    if (field.prop('disabled')) {
        return null;
    }
    let element = field[0];
    let label = String(field.data('field-label') || field.attr('name') || 'Ce champ');
    let type = String(field.data('field-type') || field.attr('type') || 'text');
    let value = field.val() === null ? '' : String(field.val()).trim();
    let required = field.prop('required');
    let minLength = field.data('min-length');
    let maxLength = field.data('max-length');
    let min = field.data('min');
    let max = field.data('max');
    let step = field.data('step');
    let comparisonFieldId = field.data('compare-field-id');
    let comparisonOperator = String(field.data('compare-operator') || '');
    let comparisonMessage = String(field.data('compare-message') || '');
    let message = '';

    if (type === 'boolean') {
        if (required && !field.prop('checked')) {
            message = 'Ce champ obligatoire doit être coché.';
        }
    } else if (required && value === '') {
        message = 'Ce champ est obligatoire.';
    } else if (value !== '') {
        let length = Array.from(value).length;

        if (minLength !== undefined && minLength !== '' && length < Number(minLength)) {
            message = 'La saisie doit contenir au moins ' + minLength + ' caractères.';
        } else if (maxLength !== undefined && maxLength !== '' && length > Number(maxLength)) {
            message = 'La saisie ne doit pas dépasser ' + maxLength + ' caractères.';
        } else if (type === 'integer' && !/^-?\d+$/.test(value)) {
            message = 'Saisissez un nombre entier.';
        } else if (type === 'decimal' && !/^-?(?:\d+|\d*\.\d+)$/.test(value)) {
            message = 'Saisissez un nombre décimal avec un point comme séparateur.';
        } else if (type === 'integer' || type === 'decimal') {
            let numericValue = Number(value);
            if (min !== undefined && min !== '' && numericValue < Number(min)) {
                message = 'La valeur doit être supérieure ou égale à ' + min + '.';
            } else if (max !== undefined && max !== '' && numericValue > Number(max)) {
                message = 'La valeur doit être inférieure ou égale à ' + max + '.';
            } else if (type === 'decimal' && step !== undefined && step !== '' && Number(step) > 0) {
                let base = min !== undefined && min !== '' ? Number(min) : 0;
                let steps = (numericValue - base) / Number(step);
                if (Math.abs(steps - Math.round(steps)) > 0.0000001) {
                    message = 'La valeur doit respecter un pas de ' + step + '.';
                }
            }
        } else if (element && !element.checkValidity()) {
            message = element.validity && element.validity.typeMismatch
                ? 'Le format de la valeur est invalide.'
                : 'La valeur saisie ne respecte pas les contraintes du champ.';
        }
    }

    if (message === '' && value !== '' && comparisonFieldId !== undefined && comparisonFieldId !== '') {
        let comparisonField = $('#scenarioform-field-' + comparisonFieldId);
        let comparisonValue = comparisonField.length && comparisonField.val() !== null
            ? String(comparisonField.val()).trim()
            : '';

        if (comparisonValue !== '') {
            let comparisonIsValid =
                (comparisonOperator === 'gte' && value >= comparisonValue) ||
                (comparisonOperator === 'gt' && value > comparisonValue) ||
                (comparisonOperator === 'lte' && value <= comparisonValue) ||
                (comparisonOperator === 'lt' && value < comparisonValue);

            if (!comparisonIsValid) {
                let operatorLabels = {
                    gte: 'postérieure ou égale à',
                    gt: 'strictement postérieure à',
                    lte: 'antérieure ou égale à',
                    lt: 'strictement antérieure à'
                };
                let comparisonLabel = String(
                    comparisonField.data('field-label') ||
                    comparisonField.attr('name') ||
                    'la valeur de référence'
                );
                message = comparisonMessage ||
                    label + ' doit être ' +
                    (operatorLabels[comparisonOperator] || 'compatible avec') +
                    ' ' + comparisonLabel + '.';
            }
        }
    }

    return message === '' ? null : {label: label, message: message};
}

function renderFormScenarioEditor(available, selected)
{
    available = Array.isArray(available) ? available : [];
    selected = Array.isArray(selected) ? selected : [];

    let selectedIds = selected.map(function(item) { return String(item.id); });
    let selectedById = {};
    selected.forEach(function(item) { selectedById[String(item.id)] = item; });
    let byId = {};
    available.forEach(function(item) { byId[String(item.id)] = item; });

    let ordered = selected.slice();
    available.slice().sort(function(a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''), 'fr', {sensitivity: 'base'});
    }).forEach(function(item) {
        if (selectedIds.indexOf(String(item.id)) === -1) {
            ordered.push(item);
        }
    });

    let html = `
        <div class="form-group">
            <label>Scénarios associés à ce formulaire</label>
            <p class="help-block">
                Cochez les scénarios puis utilisez la poignée ou les boutons pour définir leur ordre.
            </p>
            <button type="button" class="btn btn-default btn-xs" id="bt_sortFormScenarios">
                <i class="fas fa-sort-alpha-down"></i> Trier les scénarios A–Z
            </button>
            <div id="scenarioform-form-scenario-order" class="list-group">
    `;

    ordered.forEach(function(item) {
        let checked = selectedIds.indexOf(String(item.id)) !== -1;
        let selectedItem = selectedById[String(item.id)] || {};
        let expectResult = !(['0', 'false', ''].includes(String(selectedItem.expect_result).toLowerCase()) || selectedItem.expect_result === false);
        html += `
            <div class="list-group-item scenarioform-scenario-order-item"
                 draggable="true" data-scenario-id="${parseInt(item.id, 10)}">
                <i class="fas fa-grip-vertical" aria-hidden="true"></i>
                <label class="scenarioform-scenario-label">
                    <input type="checkbox" class="form-scenario-enabled" ${checked ? 'checked' : ''}>
                    ${scenarioformEscapeHtml(item.name)}
                </label>
                <label class="scenarioform-scenario-return-option">
                    <input type="checkbox" class="form-scenario-expect-result" ${expectResult ? 'checked' : ''}>
                    Attendre un retour métier
                </label>
                <span class="pull-right">
                    <button type="button" class="btn btn-default btn-xs bt_scenario_up" title="Monter" aria-label="Monter ce scénario">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" class="btn btn-default btn-xs bt_scenario_down" title="Descendre" aria-label="Descendre ce scénario">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </span>
            </div>
        `;
    });

    return html + '</div></div>';
}

function collectFormScenarioIds()
{
    let ids = [];
    $('#scenarioform-form-scenario-order .scenarioform-scenario-order-item').each(function() {
        if ($(this).find('.form-scenario-enabled').prop('checked')) {
            ids.push({
                id: parseInt($(this).attr('data-scenario-id'), 10),
                expect_result: $(this).find('.form-scenario-expect-result').prop('checked') ? 1 : 0
            });
        }
    });
    return ids;
}

function loadFormEdit(formId)
{

    $('#scenarioform-fields-management').hide();

    $.ajax({

        type:'POST',

        url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data:{
            action:'getFormDetail',
            id:formId
        },

        dataType:'json',

        success:function(data){

            if(data.state !== 'ok'){

                jeedomUtils.showAlert({
                    message:data.result,
                    level:'danger'
                });

                return;
            }

            let form = data.result;
       
            $('#div_scenarioform-form')
                .attr(
                    'data-form-id',
                    form.id
                );


            let html = '';

            html += '<div class="scenarioform-form-editor">';
            html += '<h3 class="scenarioform-page-title">Modifier le formulaire</h3>';
            html += '<p class="scenarioform-page-description">Configurez son contenu et les scénarios à exécuter.</p>';

            html += `
            <div class="form-group">
                <label>Nom</label>

                <input type="text"
                       class="form-control"
                       id="edit_form_name"
                       value="${scenarioformEscapeHtml(form.name)}">
            </div>
            `;

            html += `
            <div class="form-group">
                <label>Description</label>

                <textarea
                    class="form-control"
                    id="edit_form_description">${scenarioformEscapeHtml(form.description || '')}</textarea>
            </div>
            `;

            let historyTitleFields = Array.isArray(form.fields) ? form.fields : [];
            html += `
            <div class="form-group">
                <label for="edit_form_history_title_field">Champ utilisé comme titre dans l’historique</label>
                <select class="form-control" id="edit_form_history_title_field">
                    <option value="0">Automatique (premier champ renseigné)</option>
                    ${historyTitleFields.map(function(field) {
                        let selected = parseInt(form.history_title_field_id, 10) === parseInt(field.id, 10) ? ' selected' : '';
                        return `<option value="${parseInt(field.id, 10)}"${selected}>${scenarioformEscapeHtml(field.label || field.name || ('Champ #' + field.id))}</option>`;
                    }).join('')}
                </select>
                <p class="help-block">Ce choix s’applique aussi aux réponses déjà présentes dans l’historique. Si la valeur est absente d’une ancienne réponse, aucun titre complémentaire n’est affiché.</p>
            </div>
            `;

            html += renderFormScenarioEditor(
                form.scenariosAvailable,
                form.scenarios
            );


            html += `
            <div class="scenarioform-editor-actions">
            <button class="btn btn-success"
                    id="bt_saveForm">

                <i class="fas fa-save"></i>
                Valider

            </button>


            <button class="btn btn-default"
                    id="bt_backForm">

                Retour

            </button>
            </div>
            </div>
            `;

            $('#div_scenarioform-form')
                .html(html);


        },


        error:function(xhr,status,error){

            console.error(
                'Erreur AJAX loadFormEdit',
                error
            );

        }

    });

}

function saveRequest() {



    let id = $('#div_scenarioformEdition')
        .data('request-id');




    $.ajax({

        type:'POST',

        url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data:{

            action:'saveRequest',

            id:id,

            name:
                $('#edit_request_name').val(),

            description:
                $('#edit_request_description').val()

        },

        dataType:'json',


        success:function(data){



            if (data.state !== 'ok') {


                jeedomUtils.showAlert({

                    message:data.result,

                    level:'danger'

                });


                return;

            }


            // Actualisation liste requêtes
            loadRequestList();


            // Retour sur le détail de la requête
            loadRequestDetail(data.result.id);


        },


        error:function(xhr,status,error){


        }

    });

}

function saveForm() {

    let formId =
    $('#div_scenarioform-form')
    .attr('data-form-id') || 0;


    let action =
        (formId == 0)
        ? 'createForm'
        : 'saveForm';




    $.ajax({

        type:'POST',

        url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data:{

            action: action,

            id: formId,

            request_id:
                $('#div_scenarioformEdition')
                .data('request-id'),

            name:
                $('#edit_form_name').val(),

            description:
                $('#edit_form_description').val(),

            history_title_field_id:
                $('#edit_form_history_title_field').val() || 0,

            scenarios: collectFormScenarioIds()

        },

        dataType:'json',


        success:function(data){

            if(data.state !== 'ok'){

                jeedomUtils.showAlert({

                    message:data.result,

                    level:'danger'

                });

                return;

            }


            let requestId =
                $('#div_scenarioformEdition')
                .data('request-id');


            let savedFormId = parseInt(data.result.id, 10);
            if (data.result.field_transfer && parseInt(data.result.field_transfer.count, 10) > 0) {
                jeedomUtils.showAlert({
                    message: data.result.field_transfer.count +
                        ' champ(s) ont été transférés vers le nouveau scénario.',
                    level: 'success'
                });
            }
            loadRequestDetail(requestId, savedFormId);

        },


        error:function(xhr){


        }

    });

}

function loadFieldEdit(fieldId, formId, scenarioId)
{



        /*
        * ==========================================
        * RÉCUPÉRATION DU CHAMP
        * ==========================================
        */

        $.ajax({

            type: 'POST',

            url:
                'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

            data: {

                action: 'getField',

                id: fieldId || 0,

                form_id: formId
                ,scenario_id: scenarioId || parseInt($('#scenarioform-field-scenario').val(), 10)

            },

            dataType: 'json',


            success: function(data)
            {







                if (data.state !== 'ok') {

                    jeedomUtils.showAlert({

                        message: data.result,

                        level: 'danger'

                    });

                    return;

                }


                /*
                * ======================================
                * DONNÉES DU CHAMP
                * ======================================
                */

                let field =
                    data.result;


                /*
                * Sécurité
                */

                if (!field) {

                    console.error(
                        'Aucune donnée champ reçue'
                    );

                    return;

                }




                /*
                * ======================================
                * HTML
                * ======================================
                */

                let html = '';


                html += `

                    <h4>

                        <i class="fas fa-edit"></i>

                        ${fieldId
                            ? 'Edition champ'
                            : 'Nouveau champ'
                        }

                    </h4>

                `;


                /*
                * ======================================
                * NOM / TAG
                * ======================================
                */

                html += `

                    <div class="form-group">

                        <label for="edit_field_name">

                            Nom du tag

                        </label>


                        <input
                            type="text"
                            class="form-control"
                            id="edit_field_name"
                            value="${field.name || ''}">

                    </div>

                `;


                /*
                * ======================================
                * LABEL
                * ======================================
                */

                html += `

                    <div class="form-group">

                        <label for="edit_field_label">

                            Label

                        </label>


                        <input
                            type="text"
                            class="form-control"
                            id="edit_field_label"
                            value="${field.label || ''}">

                    </div>

                `;


                /*
                * ======================================
                * TYPE
                * ======================================
                */

                html += `

                    <div class="form-group">

                        <label for="field_type">

                            Type

                        </label>


                        <select
                            class="form-control"
                            id="field_type">


                            <option value="text">

                                Texte

                            </option>


                            <option value="date">

                                Date

                            </option>


                            <option value="time">

                                Heure

                            </option>


                            <option value="datetime">

                                Date et heure

                            </option>

                            <option value="textarea">

                                Texte long

                            </option>

                            <option value="integer">

                                Nombre entier

                            </option>

                            <option value="decimal">

                                Nombre décimal

                            </option>

                            <option value="select">

                                Liste de choix

                            </option>

                            <option value="email">

                                Adresse e-mail

                            </option>


                            <option value="boolean">

                                Booléen

                            </option>


                        </select>

                    </div>

                `;

                html += `
                    <div id="field-text-constraints">
                        <div class="form-group">
                            <label for="edit_field_min_length">Longueur minimale</label>
                            <input type="number" min="0" class="form-control"
                                   id="edit_field_min_length">
                            <p
                                id="field-required-min-length-help"
                                class="help-block"
                                role="status"
                                aria-live="polite"
                                style="display:none;">
                                Pour un champ obligatoire, une valeur vide reste interdite :
                                la longueur minimale effective est donc 1.
                            </p>
                        </div>
                        <div class="form-group">
                            <label for="edit_field_max_length">Longueur maximale</label>
                            <input type="number" min="1" class="form-control"
                                   id="edit_field_max_length">
                        </div>
                    </div>

                    <div id="field-number-constraints">
                        <div class="form-group">
                            <label for="edit_field_min">Valeur minimale</label>
                            <input type="number" step="any" class="form-control"
                                   id="edit_field_min">
                        </div>
                        <div class="form-group">
                            <label for="edit_field_max">Valeur maximale</label>
                            <input type="number" step="any" class="form-control"
                                   id="edit_field_max">
                        </div>
                        <div class="form-group" id="field-step-constraint">
                            <label for="edit_field_step">Pas</label>
                            <input type="number" min="0.0000001" step="any"
                                   class="form-control" id="edit_field_step">
                        </div>
                    </div>

                    <div id="field-select-constraints" class="form-group">
                        <label for="edit_field_options">Choix (un par ligne)</label>
                        <textarea class="form-control" rows="5"
                                  id="edit_field_options"></textarea>
                        <label for="edit_field_parent">Liste de choix parente (facultatif)</label>
                        <select class="form-control" id="edit_field_parent"><option value="">— Aucune —</option></select>
                        <label for="edit_field_child_options">Choix selon la valeur parente</label>
                        <textarea class="form-control" rows="5" id="edit_field_child_options"
                                  placeholder="Option parente : choix 1 | choix 2"></textarea>
                        <p class="help-block">Une ligne par valeur de la liste parente. Les choix simples ci-dessus restent disponibles sans parent.</p>
                    </div>

                    <div id="field-initial-value" class="form-group">
                        <hr>
                        <h5>Valeur initiale</h5>
                        <label for="edit_field_initial_variable">Variable Jeedom (facultatif)</label>
                        <input type="text" class="form-control"
                               id="edit_field_initial_variable"
                               placeholder="Ex. Chauffage_Pro">
                        <p class="help-block">
                            À l’ouverture normale du formulaire, le champ prend la valeur actuelle de cette variable.
                            Une valeur restaurée depuis l’historique reste prioritaire.
                        </p>
                        <label for="edit_field_variable_mode">Utilisation de la variable</label>
                        <select class="form-control" id="edit_field_variable_mode">
                            <option value="transmit">Modifiable : transmettre au scénario (par défaut)</option>
                            <option value="readonly">Lecture seule : afficher sans modifier</option>
                            <option value="write">Modifiable : enregistrer aussi dans la variable Jeedom</option>
                        </select>
                        <p class="help-block">L’écriture s’effectue après validation du formulaire, avant le lancement du scénario. Une variable doit être indiquée ci-dessus.</p>
                    </div>

                    <div id="field-comparison-constraints">
                        <hr>
                        <h5>Comparaison avec un autre champ</h5>
                        <div class="form-group">
                            <label for="edit_field_comparison_field">Champ de référence</label>
                            <select class="form-control" id="edit_field_comparison_field"></select>
                            <p class="help-block">
                                Seuls les champs du même type temporel sont proposés.
                            </p>
                        </div>
                        <div class="form-group">
                            <label for="edit_field_comparison_operator">Règle</label>
                            <select class="form-control" id="edit_field_comparison_operator">
                                <option value="">— Aucune comparaison —</option>
                                <option value="gte">Supérieur ou égal à (≥)</option>
                                <option value="gt">Strictement supérieur à (&gt;)</option>
                                <option value="lte">Inférieur ou égal à (≤)</option>
                                <option value="lt">Strictement inférieur à (&lt;)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit_field_comparison_message">Message personnalisé</label>
                            <input type="text" class="form-control"
                                   id="edit_field_comparison_message"
                                   placeholder="Ex. La date de fin doit suivre la date de début">
                        </div>
                        <div
                            id="field-comparison-warning"
                            class="alert alert-warning"
                            role="alert"
                            style="display:none;">
                        </div>
                    </div>
                `;


                /*
                * ======================================
                * OBLIGATOIRE
                * ======================================
                */

                html += `

                    <div class="form-group">

                        <div class="checkbox">

                            <label>

                                <input
                                    type="checkbox"
                                    id="edit_field_required">

                                Champ obligatoire

                            </label>

                        </div>

                    </div>

                `;


                /*
                * ======================================
                * ORDRE
                * ======================================
                */

                html += `

                    <div class="form-group">

                        <label for="edit_field_order">

                            Ordre

                        </label>


                        <input
                            type="number"
                            class="form-control"
                            id="edit_field_order"
                            value="${field.displayOrder || 0}">

                    </div>

                `;


                /*
                * ======================================
                * BOUTONS
                * ======================================
                */

                html += `

                    <button
                        class="btn btn-success"
                        id="bt_saveField"
                        data-id="${field.id || ''}"
                        data-form="${formId}">

                        <i class="fas fa-save"></i>

                        Valider

                    </button>


                    <button
                        class="btn btn-secondary"
                        id="bt_cancelField">

                        Retour

                    </button>

                `;


                /*
                * ======================================
                * AFFICHAGE
                * ======================================
                */



                $('#scenarioform-fields-list')
                    .html(html);


                /*
                * ======================================
                * VALEURS DES CONTRÔLES
                * ======================================
                */

                $('#field_type')
                    .val(
                        field.type || 'text'
                    );

                let configuration = field.configuration || {};
                $('#edit_field_min_length').val(
                    configuration.minLength !== undefined ? configuration.minLength : ''
                );
                $('#edit_field_max_length').val(
                    configuration.maxLength !== undefined ? configuration.maxLength : ''
                );
                $('#edit_field_min').val(
                    configuration.min !== undefined ? configuration.min : ''
                );
                $('#edit_field_max').val(
                    configuration.max !== undefined ? configuration.max : ''
                );
                $('#edit_field_step').val(
                    configuration.step !== undefined ? configuration.step : '0.01'
                );
                $('#edit_field_options').val(
                    Array.isArray(configuration.options)
                        ? configuration.options.join('\n')
                        : ''
                );
                $('#edit_field_initial_variable').val(
                    configuration.initialVariable !== undefined ? configuration.initialVariable : ''
                );
                $('#edit_field_variable_mode').val(configuration.variableMode || 'transmit');
                $('#edit_field_child_options').val(
                    Object.keys(configuration.optionsByParent || {}).map(function(key) {
                        return key + ' : ' + configuration.optionsByParent[key].join(' | ');
                    }).join('\n')
                );
                $.post('plugins/scenarioform/core/ajax/scenarioform.ajax.php', {
                    action: 'getFieldList', form_id: formId,
                    scenario_id: scenarioId || parseInt($('#scenarioform-field-scenario').val(), 10)
                }, function(response) {
                    if (response.state !== 'ok') return;
                    (response.result || []).filter(function(candidate) {
                        return candidate.type === 'select' && String(candidate.id) !== String(field.id);
                    }).forEach(function(candidate) {
                        $('#edit_field_parent').append($('<option></option>').val(candidate.id).text(candidate.label));
                    });
                    $('#edit_field_parent').val(configuration.parentFieldId || '');
                }, 'json');
                $('#edit_field_comparison_operator').val(
                    configuration.comparisonOperator || ''
                );
                $('#edit_field_comparison_message').val(
                    configuration.comparisonMessage || ''
                );

                function updateComparisonFieldOptions()
                {
                    let selectedType = $('#field_type').val();
                    let selectedFieldId = String(
                        $('#edit_field_comparison_field').val() ||
                        configuration.comparisonFieldId ||
                        ''
                    );
                    let options = '<option value="">— Sélectionner un champ —</option>';
                    let compatibleFields = (field.comparisonFields || []).filter(
                        function(candidate) {
                            return candidate.type === selectedType;
                        }
                    );
                    let configuredTargetExists = selectedFieldId === '';

                    compatibleFields.forEach(function(candidate) {
                        let candidateId = String(candidate.id);
                        let selected = candidateId === selectedFieldId ? ' selected' : '';
                        if (selected !== '') {
                            configuredTargetExists = true;
                        }
                        options += '<option value="' + parseInt(candidate.id, 10) + '"' + selected + '>' +
                            scenarioformEscapeHtml(candidate.label || candidate.name) +
                            ' (' + scenarioformEscapeHtml(candidate.name) + ')</option>';
                    });

                    $('#edit_field_comparison_field').html(options);

                    let hasConfiguredRule =
                        String(configuration.comparisonOperator || '') !== '' ||
                        selectedFieldId !== '';
                    let isTemporal = ['date', 'time', 'datetime'].indexOf(selectedType) !== -1;

                    $('#field-comparison-constraints').toggle(
                        isTemporal && (compatibleFields.length > 0 || hasConfiguredRule)
                    );

                    $('#field-comparison-warning')
                        .toggle(hasConfiguredRule && !configuredTargetExists)
                        .text(
                            hasConfiguredRule && !configuredTargetExists
                                ? 'Le champ de référence configuré n’est plus disponible. ' +
                                  'Choisissez un autre champ ou supprimez la comparaison.'
                                : ''
                        );
                }

                function updateFieldConstraintVisibility()
                {
                    let selectedType = $('#field_type').val();
                    $('#field-text-constraints').toggle(
                        ['text', 'textarea', 'email'].indexOf(selectedType) !== -1
                    );
                    $('#field-number-constraints').toggle(
                        ['integer', 'decimal'].indexOf(selectedType) !== -1
                    );
                    $('#field-step-constraint').toggle(selectedType === 'decimal');
                    $('#field-select-constraints').toggle(selectedType === 'select');
                    updateComparisonFieldOptions();
                }

                function updateRequiredMinLengthHelp()
                {
                    let selectedType = $('#field_type').val();
                    let minLength = $('#edit_field_min_length').val();
                    let isTextType =
                        ['text', 'textarea', 'email'].indexOf(selectedType) !== -1;
                    let effectiveMinimumIsOne =
                        minLength === '' || Number(minLength) === 0;

                    $('#field-required-min-length-help').toggle(
                        isTextType &&
                        $('#edit_field_required').is(':checked') &&
                        effectiveMinimumIsOne
                    );
                }

                $('#field_type').off('change.scenarioformConstraints')
                    .on('change.scenarioformConstraints', function() {
                        if (['date', 'time', 'datetime'].indexOf($(this).val()) === -1) {
                            $('#edit_field_comparison_field').val('');
                            $('#edit_field_comparison_operator').val('');
                            $('#edit_field_comparison_message').val('');
                            configuration.comparisonFieldId = '';
                            configuration.comparisonOperator = '';
                            configuration.comparisonMessage = '';
                        }
                        updateFieldConstraintVisibility();
                        updateRequiredMinLengthHelp();
                    });

                $('#edit_field_comparison_field')
                    .off('change.scenarioformComparisonEditor')
                    .on('change.scenarioformComparisonEditor', function() {
                        if ($(this).val()) {
                            $('#field-comparison-warning').hide().text('');
                        }
                    });
                updateFieldConstraintVisibility();


                /*
                * Required
                *
                * Compatible avec :
                *
                * true
                * false
                * 1
                * 0
                * "1"
                * "0"
                */

                $('#edit_field_required')
                    .prop(
                        'checked',

                        field.required === true ||
                        field.required === 1 ||
                        field.required === '1'
                    );

                $('#edit_field_required')
                    .off('change.scenarioformMinLengthHelp')
                    .on('change.scenarioformMinLengthHelp', updateRequiredMinLengthHelp);

                $('#edit_field_min_length')
                    .off('input.scenarioformMinLengthHelp change.scenarioformMinLengthHelp')
                    .on(
                        'input.scenarioformMinLengthHelp change.scenarioformMinLengthHelp',
                        updateRequiredMinLengthHelp
                    );

                updateRequiredMinLengthHelp();


                /*
                * ======================================
                * BOUTON SAUVEGARDER
                * ======================================
                */

                $('#bt_saveField')
                    .off('click')
                    .on(
                        'click',
                        function()
                        {

                            saveField(

                                $(this)
                                    .attr('data-id'),

                                $(this)
                                    .attr('data-form')

                            );

                        }
                    );


                /*
                * ======================================
                * BOUTON RETOUR
                * ======================================
                */

                $('#bt_cancelField')
                    .off('click')
                    .on(
                        'click',
                        function()
                        {

                            loadFieldList(
                                formId
                            );

                        }
                    );


            },


            error: function(xhr)
            {

                console.error(
                    'Erreur AJAX loadFieldEdit :',
                    xhr.responseText
                );

            }

        });

}

function saveField(fieldId, formId)
{

let optionsByParent = {};
let parentFieldId = $('#edit_field_parent').val() || '';
if (parentFieldId) {
    let invalidLine = false;
    $('#edit_field_child_options').val().split(/\r?\n/).forEach(function(line) {
        if (!line.trim()) return;
        let separator = line.indexOf(':');
        if (separator < 1) { invalidLine = true; return; }
        let key = line.slice(0, separator).trim();
        let choices = line.slice(separator + 1).split('|').map(function(value) { return value.trim(); }).filter(Boolean);
        if (!key || !choices.length || optionsByParent[key]) { invalidLine = true; return; }
        optionsByParent[key] = choices;
    });
    if (invalidLine || !Object.keys(optionsByParent).length) {
        jeedomUtils.showAlert({message: 'Indiquez une ligne « option parente : choix 1 | choix 2 » pour chaque valeur.', level: 'warning'});
        return;
    }
}

let comparisonFieldId = $('#edit_field_comparison_field').val() || '';
let comparisonOperator = $('#edit_field_comparison_operator').val() || '';

if ((comparisonFieldId === '') !== (comparisonOperator === '')) {
    jeedomUtils.showAlert({
        message: 'Choisissez à la fois un champ de référence et une règle de comparaison, ou supprimez les deux.',
        level: 'warning'
    });
    return;
}


$.ajax({

    type: 'POST',

    url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

    data: {

        action: 'saveField',

        id: fieldId,

        form_id: formId,

        scenario_id: parseInt($('#scenarioform-field-scenario').val(), 10),

        name: $('#edit_field_name').val(),

        label: $('#edit_field_label').val(),

        type: $('#field_type').val(),

        displayOrder: $('#edit_field_order').val(),

        required: $('#edit_field_required').is(':checked') ? 1 : 0,

        configuration: JSON.stringify({
            minLength: $('#edit_field_min_length').val(),
            maxLength: $('#edit_field_max_length').val(),
            min: $('#edit_field_min').val(),
            max: $('#edit_field_max').val(),
            step: $('#edit_field_step').val(),
            options: $('#edit_field_options').val(),
            parentFieldId: parentFieldId,
            optionsByParent: optionsByParent,
            comparisonFieldId: comparisonFieldId,
            comparisonOperator: comparisonOperator,
            comparisonMessage: $('#edit_field_comparison_message').val(),
            initialVariable: $('#edit_field_initial_variable').val(),
            variableMode: $('#edit_field_variable_mode').val()
        })

    },

    dataType: 'json',


    success: function(data)
    {



        if (data.state !== 'ok') {

            jeedomUtils.showAlert({

                message: data.result,

                level: 'danger'

            });

            return;

        }

        if (typeof jeedomUtils.hideAlert === 'function') {
            jeedomUtils.hideAlert();
        }

        loadFieldList(formId);

    },


    error: function(xhr)
    {


    }

});


}

function renderFields(fields) {

    let html = '';


    /*
     * Affichage de la liste des champs
     */

    if (fields.length === 0) {

        html += `
            <div class="alert alert-info">
                Aucun champ.
            </div>
        `;

    } else {

        html += `
            <div class="table-responsive">
            <table class="table table-condensed scenarioform-fields-table">

                <thead>
                    <tr>
                        <th>Ordre</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th>Tag</th>
                        <th>Obligatoire</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
        `;


        fields.forEach(function(field) {

            let typeLabels = {
                text: 'Texte',
                textarea: 'Texte long',
                integer: 'Nombre entier',
                decimal: 'Nombre décimal',
                select: 'Liste de choix',
                email: 'Adresse e-mail',
                date: 'Date',
                time: 'Heure',
                datetime: 'Date et heure',
                boolean: 'Booléen'
            };

            html += `
                <tr data-id="${field.id}"
                    data-field-label="${scenarioformEscapeHtml(field.label)}">

                    <td>
                        ${field.displayOrder}
                    </td>

                    <td>
                        ${scenarioformEscapeHtml(field.label)}
                    </td>

                    <td>
                        ${scenarioformEscapeHtml(typeLabels[field.type] || field.type)}
                    </td>

                    <td>
                        <code>${scenarioformEscapeHtml(field.name)}</code>
                    </td>

                    <td>
                    ${field.required === 1 || field.required === '1' ? '✓' : '—'}
                    </td>

                    <td class="text-right">

                        <a class="btn btn-xs btn-default bt_editField">

                            <i class="fas fa-edit"></i>

                        </a>

                        <a class="btn btn-xs btn-danger bt_removeField">

                            <i class="fas fa-trash"></i>

                        </a>

                    </td>

                </tr>
            `;

        });


        html += `
                </tbody>

            </table>
            </div>
        `;

    }



    /*
     * Injection de la liste
     */

    $('#scenarioform-fields-list').html(html);



    // -------------------------
    // Modification variable
    // -------------------------

    $('#scenarioform-fields-list')
        .off('click', '.bt_editField')
        .on('click', '.bt_editField', function() {

            let fieldId = $(this)
                .closest('tr')
                .data('id');

            let fieldLabel = $(this)
                .closest('tr')
                .attr('data-field-label') || ('#' + fieldId);

            let formId = $('#div_scenarioform-form')
                .attr('data-form-id');




            loadFieldEdit(
                fieldId,
                formId
            );

        });



    // -------------------------
    // Suppression variable
    // -------------------------

    $('#scenarioform-fields-list')
        .off('click', '.bt_removeField')
        .on('click', '.bt_removeField', function() {

            let fieldId = $(this)
                .closest('tr')
                .data('id');

            let fieldLabel = $(this)
                .closest('tr')
                .attr('data-field-label') || ('#' + fieldId);




            bootbox.confirm(
                'Supprimer le champ « ' + scenarioformEscapeHtml(fieldLabel) + ' » ? ' +
                'Les valeurs enregistrées pour ce champ seront également supprimées.',
                function(result) {

                    if (!result) {
                        return;
                    }


                    $.ajax({

                        type: 'POST',

                        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

                        data: {

                            action: 'removeField',

                            id: fieldId

                        },

                        dataType: 'json',


                        success: function(data) {



                            if (data.state !== 'ok') {

                                jeedomUtils.showAlert({

                                    message: data.result,

                                    level: 'danger'

                                });

                                return;

                            }


                            let formId =
                                $('#div_scenarioform-form')
                                    .attr('data-form-id');


                            loadFieldList(formId);

                        },


                        error: function(xhr) {


                        }

                    });

                }

            );

        });

}

function loadFieldList(formId, scenarioId)
{
    $.ajax({

        type:'POST',

        url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data:{
            action:'getFieldList',
            form_id:formId,
            scenario_id: scenarioId || parseInt($('#scenarioform-field-scenario').val(), 10)
        },

        dataType:'json',

        success:function(data){

            if(data.state !== 'ok'){

                jeedomUtils.showAlert({
                    message:data.result,
                    level:'danger'
                });

                return;
            }

            let fields = Array.isArray(data.result) ? data.result : [];
            renderFields(fields);
            scenarioformRefreshTemplateButton(fields.length);

        }

    });
}

function scenarioformRefreshTemplateButton(fieldCount)
{
    let formContainer = $('#div_scenarioform-form');
    let actions = $('#scenarioform-selected-form .scenarioform-form-actions');
    let scenarioCount = parseInt(formContainer.attr('data-scenario-count') || '0', 10);
    let canEditScenarios = formContainer.attr('data-can-edit-scenarios') === '1';
    let canCreateTemplate = canEditScenarios && Number(fieldCount) > 0 && scenarioCount === 0;
    let existingButton = $('#bt_createScenarioTemplate');
    $('#bt_copyScenarioFields').toggle(Number(fieldCount) === 0);

    if (!canCreateTemplate) {
        existingButton.remove();
        return;
    }

    if (existingButton.length > 0 || actions.length === 0) {
        return;
    }

    let button = `
        <button class="btn btn-primary btn-sm scenarioform-mobile-admin-action"
                id="bt_createScenarioTemplate">
            <i class="fas fa-code"></i>
            Créer un scénario modèle
        </button>
    `;

    let historyButton = actions.find('#bt_historyForm');
    if (historyButton.length > 0) {
        historyButton.before(button);
    } else {
        actions.append(button);
    }
}
//
//                         Handlers
//
// ======================= Requête =========================
//
function scenarioformOpenGuidedAssistant()
{
    let dialog = bootbox.dialog({
        title: '<i class="fas fa-magic"></i> Assistant premier formulaire',
        message: `
            <p>Cet assistant crée un exemple indépendant et prêt à tester :</p>
            <ul>
                <li>une requête ;</li>
                <li>un formulaire avec une date de retour et un commentaire ;</li>
                <li>un scénario Jeedom associé avec retour métier.</li>
            </ul>
            <div class="alert alert-info">
                Aucun élément existant ne sera modifié.
            </div>
            <div class="form-group">
                <label for="scenarioform_assistant_request_name">Nom de la requête</label>
                <input class="form-control" id="scenarioform_assistant_request_name"
                       maxlength="255" value="Présence">
            </div>
            <div class="form-group">
                <label for="scenarioform_assistant_request_description">Description de la requête</label>
                <input class="form-control" id="scenarioform_assistant_request_description"
                       value="Préparer le logement avant mon retour.">
            </div>
            <div class="form-group">
                <label for="scenarioform_assistant_form_name">Nom du formulaire</label>
                <input class="form-control" id="scenarioform_assistant_form_name"
                       maxlength="255" value="Je rentre">
            </div>
            <div class="form-group">
                <label for="scenarioform_assistant_form_description">Description du formulaire</label>
                <input class="form-control" id="scenarioform_assistant_form_description"
                       value="Indiquer ma date de retour.">
            </div>
            <div class="form-group">
                <label for="scenarioform_assistant_scenario_name">Nom du scénario Jeedom</label>
                <input class="form-control" id="scenarioform_assistant_scenario_name"
                       maxlength="255" value="ScenarioForm — Je rentre">
            </div>
            <p class="text-muted">
                Vous pourrez modifier chaque élément après sa création.
            </p>
        `,
        buttons: {
            cancel: {
                label: 'Annuler',
                className: 'btn-default'
            },
            create: {
                label: '<i class="fas fa-magic"></i> Créer l’exemple',
                className: 'btn-primary',
                callback: function() {
                    let createButton = dialog.find('.btn-primary');
                    let payload = {
                        action: 'createGuidedExample',
                        request_name: $('#scenarioform_assistant_request_name').val().trim(),
                        request_description: $('#scenarioform_assistant_request_description').val().trim(),
                        form_name: $('#scenarioform_assistant_form_name').val().trim(),
                        form_description: $('#scenarioform_assistant_form_description').val().trim(),
                        scenario_name: $('#scenarioform_assistant_scenario_name').val().trim()
                    };

                    if (!payload.request_name || !payload.form_name || !payload.scenario_name) {
                        jeedomUtils.showAlert({
                            message: 'Les trois noms sont obligatoires.',
                            level: 'danger'
                        });
                        return false;
                    }

                    createButton.prop('disabled', true)
                        .html('<i class="fas fa-spinner fa-spin"></i> Création...');

                    $.ajax({
                        type: 'POST',
                        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
                        data: payload,
                        dataType: 'json',
                        success: function(data) {
                            if (data.state !== 'ok') {
                                jeedomUtils.showAlert({message: data.result, level: 'danger'});
                                return;
                            }

                            dialog.modal('hide');
                            loadRequestList();
                            loadRequestDetail(data.result.request_id, data.result.form_id);

                            bootbox.dialog({
                                title: 'Exemple créé',
                                message:
                                    '<p>La requête <strong>' + scenarioformEscapeHtml(data.result.request_name) +
                                    '</strong>, le formulaire <strong>' + scenarioformEscapeHtml(data.result.form_name) +
                                    '</strong> et le scénario <strong>' + scenarioformEscapeHtml(data.result.scenario_name) +
                                    '</strong> sont prêts.</p>' +
                                    '<p>Vous pouvez saisir une date, exécuter le formulaire et consulter son historique.</p>' +
                                    '<p>Pour un utilisateur limité, accordez <strong>Visualisation et exécution</strong> ' +
                                    'à ce scénario dans l’onglet <strong>Scénarios</strong> de ses droits.</p>',
                                buttons: {
                                    close: {label: 'Fermer', className: 'btn-default'},
                                    open: {
                                        label: '<i class="fas fa-external-link-alt"></i> Ouvrir le scénario',
                                        className: 'btn-primary',
                                        callback: function() {
                                            window.open(data.result.edit_url, '_blank');
                                        }
                                    }
                                }
                            });
                        },
                        error: function() {
                            jeedomUtils.showAlert({
                                message: 'Erreur technique pendant la création guidée.',
                                level: 'danger'
                            });
                        },
                        complete: function() {
                            createButton.prop('disabled', false)
                                .html('<i class="fas fa-magic"></i> Créer l’exemple');
                        }
                    });

                    return false;
                }
            }
        }
    });
}

$(document).on('click.scenarioform', '#bt_scenarioformAssistant', function() {
    scenarioformOpenGuidedAssistant();
});

// sélectionner les scenarios de la requête : bt_addScenarioForm
//


$(document).off('click', '#bt_addScenarioForm')
            .on(
        'click',
        '#bt_addScenarioForm',
        function(e)
        {
            e.preventDefault();




            /*
             * ==========================================
             * NETTOYAGE
             * ==========================================
             */

            resetScenarioFormScreen();


            /*
             * Message initial
             */

            $('#scenarioform-empty-message')
                .hide();


            /*
             * Toutes les zones qui concernent
             * le formulaire métier sont masquées.
             */

            $('#scenarioform-request-detail')
                .hide()
                .empty();

            $('#scenarioform-scenarios')
                .hide()
                .empty();

            $('#div_scenarioform-form')
                .hide()
                .empty();

            $('#scenarioform-fields-management')
                .hide()
                .empty();


            /*
             * ==========================================
             * EDITEUR DE REQUETE
             * ==========================================
             */

            $('#scenarioform-request-edit')
                .show()
                .html(`

                    <hr>

                    <h4>
                        <i class="fas fa-plus-circle"></i>
                        Nouvelle requête
                    </h4>


                    <div class="form-group">

                        <label for="create_request_name">
                            Nom
                        </label>

                        <input
                            type="text"
                            class="form-control"
                            id="create_request_name"
                            placeholder="Nom de la requête">

                    </div>


                    <div class="form-group">

                        <label for="create_request_description">
                            Description
                        </label>

                        <textarea
                            class="form-control"
                            id="create_request_description"
                            rows="3"
                            placeholder="Description de la requête"></textarea>

                    </div>


                    <br>


                    <button
                        type="button"
                        class="btn btn-success"
                        id="bt_createRequest">

                        <i class="fas fa-save"></i>
                        Créer la requête

                    </button>


                    <button
                        type="button"
                        class="btn btn-default"
                        id="bt_cancelCreateRequest">

                        <i class="fas fa-times"></i>
                        Annuler

                    </button>

                `);


        }
    );

$(document).on('click.scenarioform', '#bt_createRequest',
    function(){

        $.ajax({

            type:'POST',

            url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

            data:{

                action:'createRequest',

                name:$('#create_request_name').val(),

                description:
                    $('#create_request_description').val()

            },


            dataType:'json',


            success:function(data){

                if(data.state !== 'ok'){

                    jeedomUtils.showAlert({

                        message:data.result,

                        level:'danger'

                    });

                    return;

                }


            loadRequestList();

            resetScenarioFormScreen();

            },


            error:function(xhr){


            }


        });


    }
);

$(document).on('click.scenarioform', '#bt_cancelCreateRequest',
    function (e) {

        e.preventDefault();



        resetScenarioFormScreen();

        loadRequestList();

    }
);

$(document).on('click.scenarioform', '#bt_editRequest',
    function () {

    let requestId = $('#div_scenarioformEdition')
        .data('request-id');

    $('#div_scenarioform-form').hide();

    $('#scenarioform-request-edit').show();

    editRequest(requestId);

});

$(document).on('click.scenarioform', '#bt_saveRequest',
    function(){

        saveRequest();

    }
);

$(document).on('click.scenarioform', '#bt_backRequest', 
    function () {

    const requestId = $(this).data('request-id');


    if (!requestId) {
        console.error(
            'ID requête manquant pour le retour'
        );
        return;
    }

    loadRequestDetail(requestId);

});

$(document).on('click.scenarioform', '#bt_removeRequest',
        function () {



            /*
            * Récupération de l'ID de la requête
            */

            let requestId = $(
                '#div_scenarioformEdition'
            ).attr('data-request-id');




            /*
            * Conversion numérique
            */

            requestId = parseInt(
                requestId,
                10
            );

            let requestName = $('.scenarioform-request.active')
                .attr('data-request-name') || ('#' + requestId);


            /*
            * Vérification
            */

            if (!requestId) {

                console.error(
                    'ID requête manquant'
                );

                jeedomUtils.showAlert({

                    message:
                        'Impossible de supprimer la requête : ID requête manquant',

                    level:
                        'danger'

                });

                return;
            }


            /*
            * Confirmation
            */


            bootbox.confirm(

                'Supprimer la requête « ' + scenarioformEscapeHtml(requestName) + ' » ? ' +
                'Ses formulaires, champs, associations aux scénarios, réponses et valeurs seront également supprimés. ' +
                'Les scénarios Jeedom eux-mêmes seront conservés.',

                function(result) {

                    if (!result) {
                        return;
                    }




                    /*
                    * Suppression AJAX
                    */

                    $.ajax({

                        type:
                            'POST',

                        url:
                            'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

                        data: {

                            action:
                                'removeRequest',

                            id:
                                requestId

                        },

                        dataType:
                            'json',


                        success:
                            function(data)
                            {



                                if (
                                    data.state !== 'ok'
                                ) {

                                    jeedomUtils.showAlert({

                                        message:
                                            data.result,

                                        level:
                                            'danger'

                                    });

                                    return;
                                }


                                /*
                                * Suppression réussie
                                */

                                loadRequestList();

                                resetScenarioFormScreen();

                            },


                        error:
                            function(xhr)
                            {

                                console.error(
                                    'Erreur AJAX suppression requête :',
                                    xhr.responseText
                                );

                            }

                    });

                }
            );

        }
);

$(document).on('click.scenarioform', '#bt_backScenarioForm',
    function () {

        resetScenarioFormScreen();

        loadRequestList();

    }
);
//
// =======================   Variable   =========================
// 

$(document).on('click.scenarioform', '.scenarioform-request',
    function (e) {

        e.preventDefault();


        /*
         * Sélection visuelle
         */

        $('.scenarioform-request')
            .removeClass('active');

        $(this)
            .addClass('active');


        /*
         * Récupération de l'ID
         */

        let id = $(this)
            .data('id');




        /*
         * Mémorisation de l'ID requête
         */

        $('#scenarioform-request-edit')
            .attr(
                'data-request-id',
                id
            );




        /*
         * Chargement du détail
         */

        loadRequestDetail(id);

    }
);

$(document).on('click.scenarioform', '#bt_createForm',
function(){

    $('#bt_editForm, #bt_removeForm').prop('disabled', true);


    $('#div_scenarioform-form')
        .attr('data-form-id', '0');


    let html = '';

    html += '<h3>Nouveau formulaire</h3>';

    html += `
    <div class="form-group">
        <label>Nom</label>

        <input type="text"
               class="form-control"
               id="edit_form_name"
               value="">
    </div>
    `;

    html += `
    <div class="form-group">
        <label>Description</label>

        <textarea
            class="form-control"
            id="edit_form_description"></textarea>
    </div>
    `;

    html += '<div id="create-form-scenarios"><div class="text-muted">Chargement des scénarios...</div></div>';

    html += `

    <button class="btn btn-success"
            id="bt_saveForm">

        <i class="fas fa-save"></i>
        Valider

    </button>


    <button class="btn btn-secondary"
            id="bt_backForm">

        Retour

    </button>

    `;


    $('#div_scenarioform-form')
        .html(html);

    $.ajax({
        type: 'POST',
        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
        data: { action: 'getScenarioList' },
        dataType: 'json',
        success: function(data) {
            if (data.state !== 'ok') {
                $('#create-form-scenarios').html('<div class="alert alert-danger">' + scenarioformEscapeHtml(data.result) + '</div>');
                return;
            }
            $('#create-form-scenarios').html(renderFormScenarioEditor(data.result, []));
        },
        error: function() {
            $('#create-form-scenarios').html('<div class="alert alert-danger">Erreur de chargement des scénarios.</div>');
        }
    });

});

$(document).on('click.scenarioform', '.scenarioform-form-choice', function() {
    let requestId = $('#div_scenarioformEdition').data('request-id');
    let formId = parseInt($(this).attr('data-form-id'), 10);
    loadRequestForm(requestId, formId);
});

$(document).on('keydown.scenarioform', '.scenarioform-form-choice', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        $(this).trigger('click');
    }
});

function saveFormOrder() {
    let requestId = parseInt($('#div_scenarioformEdition').data('request-id'), 10);
    let formIds = [];
    $('.scenarioform-form-choice').each(function() {
        formIds.push(parseInt($(this).attr('data-form-id'), 10));
    });

    $.ajax({
        type: 'POST',
        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
        data: {action: 'reorderForms', request_id: requestId, forms: formIds},
        dataType: 'json',
        success: function(data) {
            if (data.state !== 'ok') {
                jeedomUtils.showAlert({message: data.result, level: 'danger'});
            }
        },
        error: function() {
            jeedomUtils.showAlert({message: 'Impossible de sauvegarder l\'ordre des formulaires.', level: 'danger'});
        }
    });
}

$(document).on('click.scenarioform', '.bt_form_up, .bt_form_down', function(event) {
    event.preventDefault();
    event.stopPropagation();
    let item = $(this).closest('.scenarioform-form-choice');
    if ($(this).hasClass('bt_form_up')) {
        let previous = item.prev('.scenarioform-form-choice');
        if (previous.length) item.insertBefore(previous);
    } else {
        let next = item.next('.scenarioform-form-choice');
        if (next.length) item.insertAfter(next);
    }
    saveFormOrder();
});

var scenarioformDraggedForm = null;
$(document).on('dragstart.scenarioform', '.scenarioform-form-choice', function(event) {
    scenarioformDraggedForm = this;
    event.originalEvent.dataTransfer.effectAllowed = 'move';
    $(this).addClass('is-dragging');
});
$(document).on('dragover.scenarioform', '.scenarioform-form-choice', function(event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
});
$(document).on('drop.scenarioform', '.scenarioform-form-choice', function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (scenarioformDraggedForm && scenarioformDraggedForm !== this) {
        let targetBox = this.getBoundingClientRect();
        if (event.originalEvent.clientY > targetBox.top + targetBox.height / 2) {
            $(scenarioformDraggedForm).insertAfter(this);
        } else {
            $(scenarioformDraggedForm).insertBefore(this);
        }
        saveFormOrder();
    }
});
$(document).on('dragend.scenarioform', '.scenarioform-form-choice', function() {
    $(this).removeClass('is-dragging');
    scenarioformDraggedForm = null;
});

$(document).on('click.scenarioform', '.bt_scenario_up', function() {
    let item = $(this).closest('.scenarioform-scenario-order-item');
    let previous = item.prev('.scenarioform-scenario-order-item');
    if (previous.length) {
        item.insertBefore(previous);
    }
});

$(document).on('click.scenarioform', '.bt_scenario_down', function() {
    let item = $(this).closest('.scenarioform-scenario-order-item');
    let next = item.next('.scenarioform-scenario-order-item');
    if (next.length) {
        item.insertAfter(next);
    }
});

$(document).on('click.scenarioform', '#bt_sortFormScenarios', function() {
    let list = $('#scenarioform-form-scenario-order');
    list.children('.scenarioform-scenario-order-item').sort(function(a, b) {
        let aName = $(a).find('.scenarioform-scenario-label').text().trim();
        let bName = $(b).find('.scenarioform-scenario-label').text().trim();
        return aName.localeCompare(bName, 'fr', {sensitivity: 'base'});
    }).appendTo(list);
});

var scenarioformDraggedScenario = null;
$(document).on('dragstart.scenarioform', '.scenarioform-scenario-order-item', function(event) {
    scenarioformDraggedScenario = this;
    event.originalEvent.dataTransfer.effectAllowed = 'move';
});
$(document).on('dragover.scenarioform', '.scenarioform-scenario-order-item', function(event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
});
$(document).on('drop.scenarioform', '.scenarioform-scenario-order-item', function(event) {
    event.preventDefault();
    if (scenarioformDraggedScenario && scenarioformDraggedScenario !== this) {
        $(scenarioformDraggedScenario).insertBefore(this);
    }
    scenarioformDraggedScenario = null;
});
 
$(document).on('click.scenarioform', '#bt_editForm',
    function(){

        let formId =
            $('#div_scenarioform-form')
            .attr('data-form-id');


        loadFormEdit(formId);

    }
);

$(document).on('click.scenarioform', '#bt_backForm',
    function(){

        let requestId =
            $('#div_scenarioformEdition')
            .data('request-id');

         loadRequestDetail(requestId); // loadRequestForm(requestId);

    }
);

$(document).on('click.scenarioform', '#bt_saveForm',
    function(){

        saveForm();

    }
);

$(document).on('click.scenarioform', '#bt_removeForm',
    function(){

        let formId =
            $('#div_scenarioform-form')
            .attr('data-form-id');

        let requestId =
            $('#div_scenarioformEdition')
            .data('request-id');

        let formName = $('.scenarioform-form-choice.active')
            .attr('data-form-name') || ('#' + formId);


        bootbox.confirm(
            'Supprimer le formulaire « ' + scenarioformEscapeHtml(formName) + ' » ? ' +
            'Ses champs, associations aux scénarios, réponses et valeurs seront également supprimés. ' +
            'Les scénarios Jeedom eux-mêmes seront conservés.',
            function(result){

                if (!result) {
                    return;
                }


                $.ajax({

                    type:'POST',

                    url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

                    data:{
                        action:'removeForm',
                        id:formId
                    },

                    dataType:'json',


                    success:function(data){



                        if(data.state !== 'ok'){

                            jeedomUtils.showAlert({
                                message:data.result,
                                level:'danger'
                            });

                            return;

                        }
            // Nettoyage immédiat de l'ancien affichage

                $('#div_scenarioform-form')
                    .removeAttr('data-form-id')
                    .html('');


                $('#scenarioform-fields-management')
                    .html('')
                    .hide();


                    loadRequestDetail(requestId);

                },


                error:function(xhr){


                }

            });

        }
    );

});
//
// ======================== Champ ===============================
//

$(document).on('click.scenarioform', '#bt_addField',
function(){

    let formId =
        $('#div_scenarioform-form')
        .attr('data-form-id');


    loadFieldEdit(
        null,
        formId,
        parseInt($('#scenarioform-field-scenario').val(), 10)
    );

});

$(document).on('change.scenarioform', '#scenarioform-field-scenario', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    loadFieldList(formId, parseInt($(this).val(), 10));
});

$(document).on('click.scenarioform', '#bt_copyScenarioFields', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    let targetScenarioId = parseInt($('#scenarioform-field-scenario').val(), 10);
    let choices = scenarioformCopySources.map(function(source, index) {
        return {
            text: source.form_name + ' / ' + source.scenario_name +
                ' (' + source.field_count + ' champ' + (source.field_count > 1 ? 's' : '') + ')',
            value: String(index)
        };
    });
    if (choices.length === 0) {
        jeedomUtils.showAlert({
            message: 'Aucun autre binôme formulaire/scénario de cette requête ne possède de champs à copier.',
            level: 'warning'
        });
        return;
    }
    bootbox.prompt({
        title: 'Copier les champs depuis un formulaire / scénario',
        inputType: 'select',
        inputOptions: choices,
        callback: function(value) {
            if (value === null || value === undefined || value === '') {
                return;
            }
            let source = scenarioformCopySources[parseInt(value, 10)];
            if (!source) {
                return;
            }
            $.ajax({
                type: 'POST',
                url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
                dataType: 'json',
                data: {
                    action: 'copyScenarioFields',
                    form_id: formId,
                    source_form_id: parseInt(source.form_id, 10),
                    source_scenario_id: parseInt(source.scenario_id, 10),
                    target_scenario_id: targetScenarioId
                },
                success: function(data) {
                    if (!data || data.state !== 'ok') {
                        jeedomUtils.showAlert({message: data && data.result ? data.result : 'Copie impossible', level: 'danger'});
                        return;
                    }
                    loadFieldList(formId, targetScenarioId);
                    jeedomUtils.showAlert({message: data.result.copied + ' champ(s) copié(s)', level: 'success'});
                }
            });
        }
    });
});

$(document).on('click.scenarioform', '#bt_enterFormValues',
    function()
    {
        let formId = $('#div_scenarioform-form').attr('data-form-id');

        if (!formId) {
            jeedomUtils.showAlert({
                message: 'Aucun formulaire sélectionné',
                level: 'warning'
            });
            return;
        }

        scenarioformViewMode = 'entry';
        if (scenarioformHistoryPollTimer) {
            clearTimeout(scenarioformHistoryPollTimer);
            scenarioformHistoryPollTimer = null;
        }
        $('#scenarioform-history-zone').hide();
        showFormValues(formId, false);
    }
);

$(document).on('change.scenarioform', '#scenarioform-entry-scenario', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    let scenarioId = parseInt($(this).val(), 10);
    if (formId && scenarioId) {
        showFormValues(formId, false, scenarioId);
    }
});

$(document).on('click.scenarioform', '#bt_toggleMobileManagement',
    function()
    {
        let app = $('.scenarioform-app');
        let isOpen = !app.hasClass('scenarioform-mobile-management-open');

        app.toggleClass('scenarioform-mobile-management-open', isOpen);

        $(this)
            .attr('aria-expanded', isOpen ? 'true' : 'false')
            .find('span')
            .text(isOpen ? 'Fermer la gestion' : 'Gérer');
    }
);

$(document).on('click.scenarioform', '#bt_manageFields',
    function()
    {
        scenarioformViewMode = 'management';
        if (scenarioformHistoryPollTimer) {
            clearTimeout(scenarioformHistoryPollTimer);
            scenarioformHistoryPollTimer = null;
        }
        if (scenarioformValuesRequest) {
            scenarioformValuesRequest.abort();
            scenarioformValuesRequest = null;
        }
        if (scenarioformHistoryRequest) {
            scenarioformHistoryRequest.abort();
            scenarioformHistoryRequest = null;
        }
        $('#scenarioform-execute-zone').empty();
        $('#scenarioform-fields-management').show();
    }
);

//
// ========================Excution Lancement===================
//

function scenarioformBuildExecutionHeader(launched) {
    let safeLaunched = Array.isArray(launched) ? launched : [];
    let scenarioNames = safeLaunched.map(function(scenario) {
        return '<strong>' + scenarioformEscapeHtml(scenario.name) + '</strong>';
    }).join(', ');
    let scenarioLabel = safeLaunched.length > 1 ? 'Scénarios lancés :' : 'Scénario lancé :';

    return `
        <div class="scenarioform-execution-summary" role="status">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <strong>Formulaire validé</strong>
            ${scenarioNames ? `
                <span class="scenarioform-execution-summary-separator" aria-hidden="true">·</span>
                <span>${scenarioLabel} ${scenarioNames}</span>
            ` : ''}
        </div>
    `;
}

function scenarioformShowPendingExecution(formId, responseId, launched, results) {
    scenarioformPendingExecution = {
        formId: parseInt(formId, 10),
        responseId: parseInt(responseId, 10),
        launched: Array.isArray(launched) ? launched : []
    };

    $('#scenarioform-execution-waiting').remove();
    $('#scenarioform-execute-zone').prepend(`
        <div id="scenarioform-execution-waiting" class="scenarioform-execution-waiting" aria-live="polite">
            ${scenarioformBuildExecutionHeader(launched)}
            <div class="alert alert-info">
                <i class="fas fa-spinner fa-spin"></i>
                Traitement en cours — attente du retour métier…
            </div>
            <div id="scenarioform-live-results" class="scenarioform-live-results"></div>
            <div class="scenarioform-entry-actions scenarioform-waiting-actions">
                <button type="button" class="btn btn-default" id="bt_leaveResultWaiting">
                    <i class="fas fa-arrow-left"></i>
                    Retour — continuer en arrière-plan
                </button>
            </div>
        </div>
    `);

    $('#scenarioform-execute-zone')
        .find('input, textarea, select, button')
        .prop('disabled', true);
    $('#bt_leaveResultWaiting').prop('disabled', false);
    scenarioformRenderLiveResults(results);
}

function scenarioformShowFinalExecutionResult(formId, responseId, launched, results) {
    scenarioformPendingExecution = null;
    let message = scenarioformBuildExecutionHeader(launched);

    message += `
        <div id="scenarioform-live-results" class="scenarioform-live-results" aria-live="polite"></div>
        <div class="scenarioform-entry-actions scenarioform-result-actions">
            <span id="scenarioform-latest-response-actions"></span>
            <button type="button" class="btn btn-success" id="bt_newEntryAfterExecution"
                    data-form-id="${parseInt(formId, 10)}">
                <i class="fas fa-keyboard"></i>
                Nouvelle saisie
            </button>
            <button type="button" class="btn btn-default" id="bt_historyAfterExecution"
                    data-form-id="${parseInt(formId, 10)}">
                <i class="fas fa-history"></i>
                Voir l’historique
            </button>
        </div>
    `;

    $('#scenarioform-execute-zone').html(message);
    scenarioformRenderLiveResults(results);
    scenarioformLoadLatestResponseActions(formId, responseId);
}

function scenarioformRenderLatestResponseDetails(response) {
    let html = '<div class="scenarioform-history-details scenarioform-latest-response-details" ' +
        'data-response-id="' + parseInt(response.id, 10) + '" hidden>';

    if (Array.isArray(response.values) && response.values.length > 0) {
        html += '<div class="scenarioform-history-subtitle"><strong>Valeurs saisies</strong></div>';
        html += '<ul class="scenarioform-history-values">';
        response.values.forEach(function(value) {
            let label = value.label || value.name || ('Champ #' + value.field_id);
            let displayValue = value.value === null || value.value === undefined ? '' : value.value;
            html += '<li><strong>' + scenarioformEscapeHtml(label) + '</strong> : ' +
                scenarioformEscapeHtml(displayValue) + '</li>';
        });
        html += '</ul>';
    }

    html += '<div class="scenarioform-history-subtitle"><strong>Exécution</strong></div>';
    html += '<ul class="scenarioform-history-results">';
    (Array.isArray(response.scenario_results) ? response.scenario_results : []).forEach(function(result) {
        let statusLabels = {
            pending: 'En attente', accepted: 'Accepté', rejected: 'Refusé',
            warning: 'Terminé avec avertissement', error: 'Erreur',
            timeout: 'Aucun retour reçu — consultez le journal Jeedom du scénario',
            not_expected: 'Scénario lancé — aucun retour attendu'
        };
        let status = result.status || 'pending';
        html += '<li class="scenarioform-result-' + scenarioformEscapeAttribute(status) + '"><strong>' +
            scenarioformEscapeHtml(result.name || ('Scénario #' + result.scenario_id)) + '</strong> : ' +
            scenarioformEscapeHtml(statusLabels[status] || status) +
            (result.message ? ' — ' + scenarioformEscapeHtml(result.message) : '') + '</li>';
    });
    html += '</ul></div>';
    return html;
}

function scenarioformLoadLatestResponseActions(formId, responseId) {
    responseId = parseInt(responseId, 10);
    if (!responseId) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
        data: {action: 'getHistory', form_id: parseInt(formId, 10)},
        dataType: 'json',
        success: function(data) {
            if (!data || data.state !== 'ok' || !data.result ||
                !Array.isArray(data.result.history)) {
                return;
            }
            let response = data.result.history.find(function(item) {
                return parseInt(item.id, 10) === responseId;
            });
            if (!response || $('#scenarioform-latest-response-actions').length === 0) {
                return;
            }

            scenarioformHistory = scenarioformHistory.filter(function(item) {
                return parseInt(item.id, 10) !== responseId;
            });
            scenarioformHistory.push(response);

            let firstDocument = Array.isArray(response.documents) ? response.documents[0] : null;
            let actions = firstDocument ? `
                <button type="button" class="btn btn-info scenarioform-history-document"
                        data-response-id="${response.id}" data-document-id="${firstDocument.id}">
                    <i class="fas fa-file-alt"></i> Compte rendu
                </button>
            ` : '';
            actions += `
                <button type="button" class="btn btn-default scenarioform-history-toggle"
                        data-response-id="${response.id}" aria-expanded="false">
                    <i class="fas fa-chevron-down"></i> Détails
                </button>
            `;
            $('#scenarioform-latest-response-actions').html(actions);
            $('.scenarioform-result-actions').after(scenarioformRenderLatestResponseDetails(response));
        }
    });
}


$(document).on('click.scenarioform', '#bt_executeForm',
        function () {

            let executeButton = $(this);

            if (executeButton.prop('disabled')) {
                return;
            }



            let formId =
                $('#div_scenarioform-form')
                    .attr('data-form-id');


            if (!formId) {

                console.error(
                    'Aucun formulaire sélectionné'
                );

                return;

            }

            let scenarioId = parseInt($('#scenarioform-execute-zone').attr('data-scenario-id'), 10);
            let editingHistory = !!executeButton.attr('data-edit-response-id');
            if (!scenarioId && !editingHistory) {
                jeedomUtils.showAlert({message: 'Choisissez le scénario à exécuter', level: 'warning'});
                return;
            }


            /*
            * ==========================================
            * VALIDATION DES CHAMPS OBLIGATOIRES
            * ==========================================
            */

            let valid = true;

            let firstInvalid = null;


            $('#div_scenarioform-form')
                .find(
                    '#scenarioform-execute-zone input, ' +
                    '#scenarioform-execute-zone textarea, ' +
                    '#scenarioform-execute-zone select'
                )
                .each(function () {

                    let field = $(this);
                    field.closest('.form-group').removeClass('has-error');
                    field.closest('.form-group')
                        .find('.scenarioform-field-error')
                        .remove();

                    let validationError = scenarioformValidateInput(field);

                    if (validationError !== null) {
                        valid = false;
                        field.closest('.form-group').addClass('has-error');
                        field.closest('.form-group').append(
                            '<div class="help-block scenarioform-field-error" role="alert">' +
                            scenarioformEscapeHtml(validationError.message) +
                            '</div>'
                        );

                        if (firstInvalid === null) {
                            firstInvalid = field;
                            firstInvalid.data('validation-error', validationError);
                        }
                    }

                });


            if (!valid) {

                /*
                * Message sans détruire les champs
                */

                $('#scenarioform-validation-message')
                    .remove();


                let firstError = firstInvalid
                    ? firstInvalid.data('validation-error')
                    : null;
                let summary = firstError
                    ? 'Vérifiez le champ « ' + firstError.label + ' » : ' + firstError.message
                    : 'Vérifiez les champs signalés.';

                $('#scenarioform-execute-zone')
                    .prepend(`

                        <div
                            id="scenarioform-validation-message"
                            class="alert alert-warning">

                            <i class="fas fa-exclamation-triangle"></i>

                            ${scenarioformEscapeHtml(summary)}

                        </div>

                    `);


                /*
                * Positionnement sur le premier champ
                */

                if (firstInvalid) {

                    firstInvalid.trigger('focus');

                    $('html, body')
                        .animate({

                            scrollTop:
                                firstInvalid.offset().top - 100

                        }, 300);

                }


                return;

            }


            /*
            * ==========================================
            * SUPPRESSION ANCIEN MESSAGE
            * ==========================================
            */

            $('#scenarioform-validation-message')
                .remove();


            /*
            * ==========================================
            * CONSTRUCTION DES VALEURS
            * ==========================================
            */

            let values = {};


            $('#div_scenarioform-form')
                .find(
                    '#scenarioform-execute-zone input, ' +
                    '#scenarioform-execute-zone textarea, ' +
                    '#scenarioform-execute-zone select'
                )
                .each(function () {

                    let field = $(this);

                    let name =
                        field.attr('name');


                    if (!name) {

                        return;

                    }


                    /*
                    * Booléen
                    */

                    if (
                        field.attr('type') === 'checkbox'
                    ) {

                        values[name] = {

                            value:
                                field.prop('checked')
                                    ? 1
                                    : 0,

                            tag:
                                field.data('tag')

                        };

                        return;

                    }


                    /*
                    * Autres types
                    */

                    values[name] = {

                        value:
                            field.val(),

                        tag:
                            field.data('tag')

                    };

                });




            /*
            * ==========================================
            * AJAX
            * ==========================================
            */

            $.ajax({

                type: 'POST',

                url:
                    'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

                data: {

                    action: executeButton.attr('data-edit-response-id') ? 'updateHistoryResponse' : 'executeForm',

                    form_id:
                        formId,

                    scenario_id:
                        scenarioId,

                    response_id: parseInt(executeButton.attr('data-edit-response-id'), 10) || 0,

                    values:
                        JSON.stringify(values)

                },

                dataType: 'json',

                beforeSend:
                    function()
                    {
                        executeButton
                            .prop('disabled', true)
                            .html(
                                '<i class="fas fa-spinner fa-spin"></i> Exécution...'
                            );
                    },


                success:
                    function(data)
                    {



                        /*
                        * ==================================
                        * ERREUR SERVEUR
                        * ==================================
                        */

                        if (data.state !== 'ok') {

                            /*
                            * IMPORTANT :
                            *
                            * On ne fait PAS :
                            *
                            * $('#scenarioform-execute-zone')
                            *     .html(...)
                            *
                            * car cela détruirait les champs.
                            */

                            $('#scenarioform-validation-message')
                                .remove();


                            $('#scenarioform-execute-zone')
                                .prepend(`

                                    <div
                                        id="scenarioform-validation-message"
                                        class="alert alert-danger">

                                        <i class="fas fa-exclamation-triangle"></i>

                                        ${scenarioformEscapeHtml(
                                            data.result ||
                                            'Erreur lors de l’exécution'
                                        )}

                                    </div>

                                `);


                            return;

                        }


                        /*
                        * ==================================
                        * SUCCÈS
                        * ==================================
                        */

                        if (executeButton.attr('data-edit-response-id')) {
                            executeButton.removeAttr('data-edit-response-id');
                            jeedomUtils.showAlert({message: 'Réponse historique mise à jour.', level: 'success'});
                            showFormHistory(formId);
                            return;
                        }

                        let executionResult = data.result || {};
                        let launched = executionResult.launched || [];
                        let scenarioResults = executionResult.scenario_results || [];
                        let hasPendingResult = scenarioResults.some(function(result) {
                            return (result.status || 'pending') === 'pending';
                        });

                        if (hasPendingResult) {
                            scenarioformShowPendingExecution(
                                formId,
                                executionResult.response_id,
                                launched,
                                scenarioResults
                            );
                            scenarioformStartResultPolling(
                                formId,
                                executionResult.response_id
                            );
                        } else {
                            scenarioformShowFinalExecutionResult(
                                formId,
                                executionResult.response_id,
                                launched,
                                scenarioResults
                            );
                        }



                    },


                error:
                    function(xhr)
                    {

                        console.error(
                            'Erreur AJAX executeForm :',
                            xhr.responseText
                        );


                        /*
                        * Même principe :
                        * les champs restent présents.
                        */

                        $('#scenarioform-validation-message')
                            .remove();


                        $('#scenarioform-execute-zone')
                            .prepend(`

                                <div
                                    id="scenarioform-validation-message"
                                    class="alert alert-danger">

                                    <i class="fas fa-exclamation-triangle"></i>

                                    Une erreur technique est survenue.

                                </div>

                            `);

                    },

                complete:
                    function()
                    {
                        if ($.contains(document, executeButton[0])) {
                            if (scenarioformPendingExecution !== null) {
                                executeButton
                                    .prop('disabled', true)
                                    .html('<i class="fas fa-spinner fa-spin"></i> Traitement en cours...');
                                return;
                            }
                            executeButton.prop('disabled', false);
                            executeButton.html(executeButton.attr('data-edit-response-id')
                                ? '<i class="fas fa-save"></i> Enregistrer la modification'
                                : '<i class="fas fa-play"></i> Valider et exécuter');
                        }
                    }

            });

        }
);

function scenarioformStopResultPolling() {
    if (scenarioformResultRequest) {
        scenarioformResultRequest.abort();
        scenarioformResultRequest = null;
    }
    if (scenarioformResultPollTimer) {
        clearTimeout(scenarioformResultPollTimer);
        scenarioformResultPollTimer = null;
    }
}

$(document).on('click.scenarioform', '#bt_leaveResultWaiting', function() {
    let requestId = parseInt(
        $('#div_scenarioformEdition').data('request-id'),
        10
    );

    scenarioformStopResultPolling();
    scenarioformPendingExecution = null;

    if (requestId) {
        scenarioformReturnToRequestDetail(requestId);
    }
});

$(document).on('click.scenarioform', '#bt_newEntryAfterExecution', function() {
    let formId = parseInt($(this).attr('data-form-id'), 10);
    scenarioformStopResultPolling();
    if (formId) {
        showFormValues(formId, false);
    }
});

$(document).on('click.scenarioform', '#bt_historyAfterExecution', function() {
    let formId = parseInt($(this).attr('data-form-id'), 10);
    scenarioformStopResultPolling();
    if (formId) {
        showFormHistory(formId);
    }
});

$(document).on('click.scenarioform', '#bt_backExecuteForm',
function () {

    const requestId =
        $('#div_scenarioformEdition')
            .data('request-id');


    if (!requestId) {

        console.error(
            'ID requête manquant pour le retour'
        );

        return;
    }

    scenarioformReturnToRequestDetail(requestId);

            });

function scenarioformRenderLiveResults(results) {
    let container = $('#scenarioform-live-results');
    if (container.length === 0) {
        return false;
    }

    let statusLabels = {
        pending: 'En attente',
        accepted: 'Accepté',
        rejected: 'Refusé',
        warning: 'Terminé avec avertissement',
        error: 'Erreur',
        timeout: 'Aucun retour reçu — consultez le journal Jeedom du scénario',
        not_expected: 'Scénario lancé — aucun retour attendu'
    };
    let safeResults = Array.isArray(results) ? results : [];
    let html = '<div class="scenarioform-live-results-title"><strong>Compte rendu et détails</strong></div>';

    if (safeResults.length === 0) {
        html += '<div>Retour métier non activé.</div>';
        container.html(html);
        return false;
    }

    html += '<ul class="scenarioform-history-results">';
    safeResults.forEach(function(result) {
        let status = result.status || 'pending';
        html += `
            <li class="scenarioform-result-${scenarioformEscapeAttribute(status)}">
                <strong>${scenarioformEscapeHtml(result.name || ('Scénario #' + result.scenario_id))}</strong>
                : ${scenarioformEscapeHtml(statusLabels[status] || status)}
                ${result.message ? ' — ' + scenarioformEscapeHtml(result.message) : ''}
            </li>
        `;
    });
    html += '</ul>';
    container.html(html);

    return safeResults.some(function(result) {
        return (result.status || 'pending') === 'pending';
    });
}

function scenarioformStartResultPolling(formId, responseId) {
    if (scenarioformResultRequest) {
        scenarioformResultRequest.abort();
        scenarioformResultRequest = null;
    }
    if (scenarioformResultPollTimer) {
        clearTimeout(scenarioformResultPollTimer);
        scenarioformResultPollTimer = null;
    }
    if (!responseId || $('#scenarioform-live-results').length === 0) {
        return;
    }

    scenarioformResultPollTimer = setTimeout(function pollResult() {
        scenarioformResultPollTimer = null;
        if ($('#scenarioform-live-results').length === 0) {
            return;
        }

        scenarioformResultRequest = $.ajax({
            type: 'POST',
            url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
            data: {
                action: 'getScenarioResults',
                form_id: formId,
                response_id: responseId
            },
            dataType: 'json',
            success: function(data) {
                if (!data || data.state !== 'ok') {
                    return;
                }
                let hasPending = scenarioformRenderLiveResults(
                    data.result.scenario_results || []
                );
                if (hasPending && $('#scenarioform-live-results').length > 0) {
                    scenarioformResultPollTimer = setTimeout(pollResult, 4000);
                } else if (!hasPending && scenarioformPendingExecution !== null) {
                    let pendingExecution = scenarioformPendingExecution;
                    scenarioformShowFinalExecutionResult(
                        pendingExecution.formId,
                        pendingExecution.responseId,
                        pendingExecution.launched,
                        data.result.scenario_results || []
                    );
                }
            },
            complete: function() {
                scenarioformResultRequest = null;
            }
        });
    }, 4000);
}

// ==========================HISTORIQUE=========================

var scenarioformHistory = [];
var scenarioformHistorySort = 'newest';
var scenarioformHistorySortDefaultPending = true;
var scenarioformHistoryLastFormId = null;
var scenarioformHistoryPeriod = '30d';
var scenarioformHistoryFilter = 'all';
var scenarioformHistoryCustomStart = '';
var scenarioformHistoryCustomEnd = '';
var scenarioformHistoryPendingOpenId = null;
var scenarioformHistoryStatus = 'all';
var scenarioformHistorySearch = '';
var scenarioformHistorySearchTimer = null;
var scenarioformHistorySection = 'list';
var scenarioformHistoryOverview = null;
var scenarioformHistoryOverviewRequest = null;


function scenarioformHistorySortValue(response, fieldKey) {
    let values = Array.isArray(response && response.values) ? response.values : [];
    let key = String(fieldKey || '');
    return values.find(function(item) {
        if (!item) return false;
        if (key.indexOf('id:') === 0) {
            return parseInt(item.field_id, 10) === parseInt(key.substring(3), 10);
        }
        if (key.indexOf('name:') === 0) {
            return String(item.name || '') === key.substring(5);
        }
        return parseInt(item.field_id, 10) === parseInt(key, 10);
    }) || null;
}

function scenarioformHistoryComparableValue(item) {
    if (!item || item.value === null || item.value === undefined || String(item.value).trim() === '') return null;
    let type = String(item.type || 'text');
    let raw = item.value;
    if (type === 'integer' || type === 'decimal') {
        let number = Number(String(raw).replace(',', '.'));
        return Number.isFinite(number) ? { kind: 'number', value: number } : null;
    }
    if (type === 'date' || type === 'datetime') {
        let date = new Date(String(raw).replace(' ', 'T'));
        return isNaN(date.getTime()) ? null : { kind: 'number', value: date.getTime() };
    }
    if (type === 'boolean') {
        let yes = ['1', 'true', 'oui', 'yes', 'on'].indexOf(String(raw).toLowerCase()) !== -1;
        return { kind: 'number', value: yes ? 1 : 0 };
    }
    return { kind: 'text', value: String(raw) };
}

function scenarioformCompareHistory(a, b) {
    let sort = String(scenarioformHistorySort || 'newest');
    if (sort === 'newest' || sort === 'oldest') {
        let aDate = scenarioformHistoryDate(a);
        let bDate = scenarioformHistoryDate(b);
        let av = aDate ? aDate.getTime() : 0;
        let bv = bDate ? bDate.getTime() : 0;
        return (sort === 'oldest' ? av - bv : bv - av) || ((parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));
    }
    if (sort === 'number-asc' || sort === 'number-desc') {
        let av = parseInt(a.history_id || a.id, 10) || 0;
        let bv = parseInt(b.history_id || b.id, 10) || 0;
        return (sort === 'number-asc' ? av - bv : bv - av) || ((parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));
    }
    let match = sort.match(/^field:(.+):(asc|desc)$/);
    if (!match) return 0;
    let direction = match[2] === 'desc' ? -1 : 1;
    let av = scenarioformHistoryComparableValue(scenarioformHistorySortValue(a, decodeURIComponent(match[1])));
    let bv = scenarioformHistoryComparableValue(scenarioformHistorySortValue(b, decodeURIComponent(match[1])));
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    let result = av.kind === 'number' && bv.kind === 'number' ? av.value - bv.value :
        String(av.value).localeCompare(String(bv.value), 'fr', { numeric: true, sensitivity: 'base' });
    if (result === 0) {
        result = (parseInt(a.history_id || a.id, 10) || 0) - (parseInt(b.history_id || b.id, 10) || 0);
    }
    return result * direction;
}

function scenarioformPopulateHistorySortFields(history) {
    let select = $('#scenarioform-history-sort');
    if (select.length === 0) return;
    let requestedSort = String(scenarioformHistorySort || 'newest');
    select.find('option[data-field-sort="1"]').remove();

    // r105 : l'ID du champ est la clé primaire de tri. Le nom n'est utilisé qu'en
    // secours pour les anciens instantanés. Cela évite de fabriquer une clé name:
    // quand les valeurs historiques ne contiennent pas de propriété "name".
    let fields = {};
    let configuredFieldId = 0;
    (Array.isArray(history) ? history : []).forEach(function(response) {
        if (!configuredFieldId) {
            configuredFieldId = parseInt(response && response.history_title_field_id, 10) || 0;
        }
        (Array.isArray(response.values) ? response.values : []).forEach(function(value) {
            if (!value) return;
            let id = parseInt(value.field_id, 10) || 0;
            if (!id) return;
            if (!fields[id]) {
                fields[id] = {
                    id: id,
                    name: String(value.name || '').trim(),
                    label: value.label || value.name || ('Champ #' + id)
                };
            }
        });
    });

    Object.keys(fields).sort(function(a, b) {
        return String(fields[a].label).localeCompare(String(fields[b].label), 'fr', { sensitivity: 'base' });
    }).forEach(function(id) {
        let field = fields[id];
        let encoded = encodeURIComponent('id:' + field.id);
        // r106 : créer les options en DOM natif. Sur Jeedom, la construction jQuery
        // $('<option>', { value: ..., text: ... }) pouvait aboutir à une option dont
        // la valeur effective était son libellé visible. Le comparateur recevait alors
        // "Prestation — A → Z / croissant" au lieu de "field:id%3A143:asc".
        let ascOption = document.createElement('option');
        ascOption.value = 'field:' + encoded + ':asc';
        ascOption.textContent = field.label + ' — A → Z / croissant';
        ascOption.setAttribute('data-field-sort', '1');
        select[0].appendChild(ascOption);

        let descOption = document.createElement('option');
        descOption.value = 'field:' + encoded + ':desc';
        descOption.textContent = field.label + ' — Z → A / décroissant';
        descOption.setAttribute('data-field-sort', '1');
        select[0].appendChild(descOption);
    });

    // Convertit les formats r100-r103 vers la clé ID lorsque c'est possible.
    let oldIdMatch = requestedSort.match(/^field:(\d+):(asc|desc)$/);
    if (oldIdMatch && fields[parseInt(oldIdMatch[1], 10)]) {
        requestedSort = 'field:' + encodeURIComponent('id:' + parseInt(oldIdMatch[1], 10)) + ':' + oldIdMatch[2];
    }
    let oldNameMatch = requestedSort.match(/^field:(.+):(asc|desc)$/);
    if (oldNameMatch) {
        let decoded = decodeURIComponent(oldNameMatch[1]);
        if (decoded.indexOf('name:') === 0) {
            let wantedName = decoded.substring(5);
            let foundId = Object.keys(fields).find(function(id) { return fields[id].name === wantedName; });
            if (foundId) requestedSort = 'field:' + encodeURIComponent('id:' + foundId) + ':' + oldNameMatch[2];
        }
    }

    // Le champ configuré "Champ utilisé comme titre dans l’historique" est aussi
    // le tri par défaut. Ainsi la configuration du formulaire a un effet concret.
    if (scenarioformHistorySortDefaultPending) {
        if (configuredFieldId > 0 && fields[configuredFieldId]) {
            requestedSort = 'field:' + encodeURIComponent('id:' + configuredFieldId) + ':asc';
        }
        scenarioformHistorySortDefaultPending = false;
    }

    let optionExists = Array.prototype.some.call(select[0].options, function(option) {
        return option.value === requestedSort;
    });
    if (!optionExists) requestedSort = 'newest';
    scenarioformHistorySort = requestedSort;
    select[0].value = requestedSort;
}

function scenarioformHistoryDate(response) {
    let raw = response && (response.created || response.updated);
    if (!raw) return null;
    let parsed = new Date(String(raw).replace(' ', 'T'));
    return isNaN(parsed.getTime()) ? null : parsed;
}

function scenarioformHistoryInPeriod(response) {
    let date = scenarioformHistoryDate(response);
    if (!date) return scenarioformHistoryPeriod === 'all';
    let now = new Date();
    if (scenarioformHistoryPeriod === '24h') return date >= new Date(now.getTime() - 86400000);
    if (scenarioformHistoryPeriod === '7d') return date >= new Date(now.getTime() - 7 * 86400000);
    if (scenarioformHistoryPeriod === '30d') return date >= new Date(now.getTime() - 30 * 86400000);
    if (scenarioformHistoryPeriod === 'custom') {
        let start = scenarioformHistoryCustomStart ? new Date(scenarioformHistoryCustomStart + 'T00:00:00') : null;
        let end = scenarioformHistoryCustomEnd ? new Date(scenarioformHistoryCustomEnd + 'T23:59:59') : null;
        return (!start || date >= start) && (!end || date <= end);
    }
    return true;
}

function scenarioformHistoryCategories(response) {
    let launchResults = Array.isArray(response.launch_results) ? response.launch_results : [];
    let results = Array.isArray(response.scenario_results) ? response.scenario_results : [];
    let statuses = results.map(function(result) { return result.status || 'pending'; });
    let launchSuccess = launchResults.length > 0 ? launchResults.every(function(item) {
        return item.result === true;
    }) : null;
    let incidentStatuses = ['warning', 'rejected', 'error', 'timeout'];
    return {
        launchSuccess: launchSuccess,
        accepted: statuses.indexOf('accepted') !== -1,
        pending: statuses.indexOf('pending') !== -1,
        incident: launchSuccess === false || statuses.some(function(status) {
            return incidentStatuses.indexOf(status) !== -1;
        }),
        statuses: statuses
    };
}

function scenarioformHistoryMatchesFilter(response) {
    let categories = scenarioformHistoryCategories(response);
    if (scenarioformHistoryFilter === 'launch-success') return categories.launchSuccess === true;
    if (scenarioformHistoryFilter === 'accepted') return categories.accepted;
    if (scenarioformHistoryFilter === 'incident') return categories.incident;
    if (scenarioformHistoryFilter === 'pending') return categories.pending;
    return true;
}

function scenarioformHistoryMatchesStatus(response) {
    if (scenarioformHistoryStatus === 'all') return true;
    let statuses = scenarioformHistoryCategories(response).statuses;
    if (scenarioformHistoryStatus === 'no-return') return statuses.indexOf('timeout') !== -1;
    return statuses.indexOf(scenarioformHistoryStatus) !== -1;
}

function scenarioformHistorySearchText(response) {
    let parts = [
        response && response.request && response.request.name,
        response && response.form && response.form.name,
        response && response.overall_status
    ];
    ['values', 'requested_scenarios', 'launch_results', 'scenario_results'].forEach(function(key) {
        (Array.isArray(response && response[key]) ? response[key] : []).forEach(function(item) {
            parts.push(item.label, item.name, item.tag, item.value, item.message, item.status);
        });
    });
    return parts.filter(function(value) { return value !== null && value !== undefined; })
        .join(' ').toLocaleLowerCase('fr-FR');
}

function scenarioformHistoryMatchesSearch(response) {
    let query = String(scenarioformHistorySearch || '').trim().toLocaleLowerCase('fr-FR');
    return query === '' || scenarioformHistorySearchText(response).indexOf(query) !== -1;
}

function scenarioformHistoryDuration(response, result) {
    let start = scenarioformHistoryDate(response);
    let rawEnd = result && result.updated_at;
    let end = rawEnd ? new Date(String(rawEnd).replace(' ', 'T')) : null;
    if (!start || !end || isNaN(end.getTime()) || end < start) {
        return result && (result.status || 'pending') === 'pending' ? 'En cours' : 'Non disponible';
    }
    let seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return seconds + ' s';
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    if (minutes < 60) return minutes + ' min ' + remainingSeconds + ' s';
    let hours = Math.floor(minutes / 60);
    return hours + ' h ' + (minutes % 60) + ' min';
}

function scenarioformHistoryDurationSeconds(response, result) {
    let start = scenarioformHistoryDate(response);
    let rawEnd = result && result.updated_at;
    let end = rawEnd ? new Date(String(rawEnd).replace(' ', 'T')) : null;
    if (!start || !end || isNaN(end.getTime()) || end < start) return null;
    return Math.round((end.getTime() - start.getTime()) / 1000);
}

function scenarioformFormatDurationSeconds(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '—';
    seconds = Math.max(0, Math.round(seconds));
    if (seconds < 60) return seconds + ' s';
    let minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' min ' + (seconds % 60) + ' s';
    return Math.floor(minutes / 60) + ' h ' + (minutes % 60) + ' min';
}

function scenarioformHistoryDurationStatistics(history) {
    let durations = [];
    history.forEach(function(response) {
        (Array.isArray(response.scenario_results) ? response.scenario_results : []).forEach(function(result) {
            let duration = scenarioformHistoryDurationSeconds(response, result);
            if (duration !== null) durations.push(duration);
        });
    });
    if (durations.length === 0) return null;
    let total = durations.reduce(function(sum, value) { return sum + value; }, 0);
    return {
        count: durations.length,
        average: total / durations.length,
        minimum: Math.min.apply(null, durations),
        maximum: Math.max.apply(null, durations)
    };
}

function scenarioformHistoryFrequency(values) {
    let counts = {};
    values.forEach(function(value) {
        let label = String(value === '' ? '(vide)' : value);
        counts[label] = (counts[label] || 0) + 1;
    });
    return Object.keys(counts).map(function(label) {
        return { label: label, count: counts[label] };
    }).sort(function(a, b) { return b.count - a.count || a.label.localeCompare(b.label, 'fr'); });
}

function scenarioformRenderHistoryFrequency(items, total) {
    return '<ul class="scenarioform-field-frequency">' + items.slice(0, 6).map(function(item) {
        let percent = total > 0 ? Math.round(item.count * 100 / total) : 0;
        return '<li><span title="' + scenarioformEscapeAttribute(item.label) + '">' +
            scenarioformEscapeHtml(item.label) + '</span><strong>' + item.count + ' (' + percent + ' %)</strong>' +
            '<i><span style="width:' + percent + '%"></span></i></li>';
    }).join('') + '</ul>';
}

function scenarioformRenderFieldStatistics(history) {
    let fields = {};
    history.forEach(function(response) {
        (Array.isArray(response.values) ? response.values : []).forEach(function(value) {
            let label = value.label || value.name || ('Champ #' + value.field_id);
            let key = value.field_id ? 'id:' + value.field_id : 'tag:' + (value.tag || label);
            if (!fields[key]) fields[key] = { label: label, type: value.type || 'text', values: [], observations: [] };
            if (value.value !== null && value.value !== undefined) {
                fields[key].values.push(value.value);
                fields[key].observations.push({ value: value.value, date: scenarioformHistoryDate(response) });
            }
        });
    });
    let cards = Object.keys(fields).map(function(key) {
        let field = fields[key];
        let type = field.type;
        let content = '';
        if (type === 'integer' || type === 'decimal') {
            let numbers = field.values.map(function(value) {
                return Number(String(value).replace(',', '.'));
            }).filter(function(value) { return Number.isFinite(value); });
            if (numbers.length > 0) {
                let average = numbers.reduce(function(sum, value) { return sum + value; }, 0) / numbers.length;
                let chronological = field.observations.map(function(observation) {
                    return { value: Number(String(observation.value).replace(',', '.')), date: observation.date };
                }).filter(function(observation) { return Number.isFinite(observation.value) && observation.date; })
                    .sort(function(a, b) { return a.date - b.date; });
                let evolution = null;
                if (chronological.length >= 2) {
                    let middle = Math.ceil(chronological.length / 2);
                    let firstHalf = chronological.slice(0, middle);
                    let secondHalf = chronological.slice(middle);
                    let firstAverage = firstHalf.reduce(function(sum, item) { return sum + item.value; }, 0) / firstHalf.length;
                    let secondAverage = secondHalf.reduce(function(sum, item) { return sum + item.value; }, 0) / secondHalf.length;
                    evolution = Math.round((secondAverage - firstAverage) * 100) / 100;
                }
                content = '<dl><div><dt>Minimum</dt><dd>' + scenarioformEscapeHtml(numbers.reduce(function(a, b) { return Math.min(a, b); })) + '</dd></div>' +
                    '<div><dt>Moyenne</dt><dd>' + scenarioformEscapeHtml(Math.round(average * 100) / 100) + '</dd></div>' +
                    '<div><dt>Maximum</dt><dd>' + scenarioformEscapeHtml(numbers.reduce(function(a, b) { return Math.max(a, b); })) + '</dd></div>' +
                    '<div><dt>Évolution</dt><dd class="' + (evolution > 0 ? 'is-up' : (evolution < 0 ? 'is-down' : '')) + '">' +
                    (evolution === null ? '—' : scenarioformEscapeHtml((evolution > 0 ? '+' : '') + evolution)) + '</dd></div></dl>';
            }
        } else if (type === 'boolean') {
            let normalized = field.values.map(function(value) {
                return ['1', 'true', 'oui', 'yes', 'on'].indexOf(String(value).toLowerCase()) !== -1 ? 'Oui' : 'Non';
            });
            content = scenarioformRenderHistoryFrequency(scenarioformHistoryFrequency(normalized), normalized.length);
        } else if (type === 'date' || type === 'datetime') {
            let dates = field.values.map(function(value) { return new Date(String(value)); })
                .filter(function(value) { return !isNaN(value.getTime()); });
            if (dates.length > 0) {
                let months = dates.map(function(date) {
                    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
                });
                content = scenarioformRenderHistoryFrequency(scenarioformHistoryFrequency(months), months.length);
            }
        } else {
            content = scenarioformRenderHistoryFrequency(scenarioformHistoryFrequency(field.values), field.values.length);
        }
        if (!content) content = '<p class="text-muted">Aucune valeur exploitable sur cette période.</p>';
        let labels = { integer: 'Entier', decimal: 'Décimal', boolean: 'Oui / Non', select: 'Choix', date: 'Date', datetime: 'Date et heure', text: 'Texte', textarea: 'Texte long', email: 'E-mail' };
        return '<article class="scenarioform-field-stat"><header><strong>' + scenarioformEscapeHtml(field.label) +
            '</strong><span>' + scenarioformEscapeHtml(labels[type] || type) + ' · ' + field.values.length +
            ' valeur' + (field.values.length > 1 ? 's' : '') + '</span></header>' + content + '</article>';
    });
    return cards.length > 0 ? '<div class="scenarioform-field-stat-grid">' + cards.join('') + '</div>' :
        '<p class="text-muted">Aucune valeur de champ disponible sur cette période.</p>';
}

function scenarioformRenderHistoryEvolution(history) {
    if (history.length === 0) return '<p class="text-muted">Aucune exécution sur cette période.</p>';
    let dates = history.map(scenarioformHistoryDate).filter(Boolean);
    let first = new Date(Math.min.apply(null, dates));
    let last = new Date(Math.max.apply(null, dates));
    let useMonths = (last.getTime() - first.getTime()) > 45 * 86400000;
    let buckets = {};
    history.forEach(function(response) {
        let date = scenarioformHistoryDate(response);
        if (!date) return;
        let key = useMonths ? date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') :
            date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
        if (!buckets[key]) buckets[key] = { executions: 0, incidents: 0 };
        buckets[key].executions++;
        if (scenarioformHistoryCategories(response).incident) buckets[key].incidents++;
    });
    let keys = Object.keys(buckets).sort().slice(-31);
    let maximum = Math.max.apply(null, keys.map(function(key) { return buckets[key].executions; }).concat([1]));
    return '<div class="scenarioform-stat-evolution" role="img" aria-label="Évolution des exécutions et incidents">' +
        keys.map(function(key) {
            let bucket = buckets[key];
            let height = Math.max(6, Math.round(bucket.executions * 100 / maximum));
            let incidentHeight = Math.round(bucket.incidents * 100 / bucket.executions);
            let title = key + ' : ' + bucket.executions + ' exécution(s), ' + bucket.incidents + ' incident(s)';
            return '<div title="' + scenarioformEscapeAttribute(title) + '"><i style="height:' + height + '%"><span style="height:' + incidentHeight + '%"></span></i><small>' +
                scenarioformEscapeHtml(useMonths ? key : key.slice(5)) + '</small></div>';
        }).join('') + '</div><div class="scenarioform-stat-legend"><span><i class="is-execution"></i> Exécutions</span>' +
        '<span><i class="is-incident"></i> Part avec incident</span></div>';
}

function scenarioformHistoryComparisonRanges() {
    let end = new Date();
    let start = null;
    if (scenarioformHistoryPeriod === '24h') start = new Date(end.getTime() - 86400000);
    if (scenarioformHistoryPeriod === '7d') start = new Date(end.getTime() - 7 * 86400000);
    if (scenarioformHistoryPeriod === '30d') start = new Date(end.getTime() - 30 * 86400000);
    if (scenarioformHistoryPeriod === 'custom' && scenarioformHistoryCustomStart && scenarioformHistoryCustomEnd) {
        start = new Date(scenarioformHistoryCustomStart + 'T00:00:00');
        end = new Date(scenarioformHistoryCustomEnd + 'T23:59:59.999');
    }
    if (!start || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;
    let duration = end.getTime() - start.getTime() + 1;
    return {
        current: { start: start, end: end },
        previous: { start: new Date(start.getTime() - duration), end: new Date(start.getTime() - 1) }
    };
}

function scenarioformHistoryComparisonStats(history, range) {
    let scoped = history.filter(function(response) {
        let date = scenarioformHistoryDate(response);
        return date && date >= range.start && date <= range.end;
    });
    let incidents = scoped.filter(function(response) { return scenarioformHistoryCategories(response).incident; }).length;
    let accepted = scoped.filter(function(response) {
        let categories = scenarioformHistoryCategories(response);
        return categories.accepted && !categories.incident;
    }).length;
    let timeouts = scoped.filter(function(response) {
        return scenarioformHistoryCategories(response).statuses.indexOf('timeout') !== -1;
    }).length;
    let durations = scenarioformHistoryDurationStatistics(scoped);
    return {
        executions: scoped.length,
        successRate: scoped.length > 0 ? Math.round(accepted * 100 / scoped.length) : null,
        incidentRate: scoped.length > 0 ? Math.round(incidents * 100 / scoped.length) : null,
        timeouts: timeouts,
        averageDuration: durations ? durations.average : null
    };
}

function scenarioformHistoryComparisonValue(current, previous, unit, inverse) {
    let currentLabel = current === null ? '—' : (unit === 'duration' ? scenarioformFormatDurationSeconds(current) : current + unit);
    let previousLabel = previous === null ? '—' : (unit === 'duration' ? scenarioformFormatDurationSeconds(previous) : previous + unit);
    let delta = current !== null && previous !== null ? current - previous : null;
    let deltaLabel = '—';
    let state = '';
    if (delta !== null) {
        deltaLabel = (delta > 0 ? '+' : (delta < 0 ? '−' : '')) +
            (unit === 'duration' ? scenarioformFormatDurationSeconds(Math.abs(delta)) : Math.abs(delta) + unit);
        state = delta === 0 ? '' : ((delta > 0) !== Boolean(inverse) ? 'is-up' : 'is-down');
    }
    return '<td>' + scenarioformEscapeHtml(currentLabel) + '</td><td>' + scenarioformEscapeHtml(previousLabel) +
        '</td><td class="' + state + '">' + scenarioformEscapeHtml(deltaLabel) + '</td>';
}

function scenarioformRenderHistoryComparison(history) {
    let ranges = scenarioformHistoryComparisonRanges();
    if (!ranges) return '<p class="text-muted">Choisissez 24 heures, 7 jours, 30 jours ou une période personnalisée complète pour comparer.</p>';
    let current = scenarioformHistoryComparisonStats(history, ranges.current);
    let previous = scenarioformHistoryComparisonStats(history, ranges.previous);
    let alert = '';
    if (current.incidentRate !== null && previous.incidentRate !== null) {
        let change = current.incidentRate - previous.incidentRate;
        alert = '<div class="scenarioform-trend-alert ' + (change > 0 ? 'is-warning' : 'is-stable') + '">' +
            '<i class="fas ' + (change > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle') + '"></i> ' +
            (change > 0 ? 'Hausse des incidents de ' + change + ' point' + (change > 1 ? 's' : '') + '.' :
                (change < 0 ? 'Baisse des incidents de ' + Math.abs(change) + ' point' + (Math.abs(change) > 1 ? 's' : '') + '.' : 'Taux d’incident stable.')) + '</div>';
    }
    return alert + '<div class="table-responsive"><table class="table table-condensed scenarioform-comparison-table"><thead><tr>' +
        '<th>Indicateur</th><th>Période actuelle</th><th>Période précédente</th><th>Écart</th></tr></thead><tbody>' +
        '<tr><th>Exécutions</th>' + scenarioformHistoryComparisonValue(current.executions, previous.executions, '', false) + '</tr>' +
        '<tr><th>Taux de succès</th>' + scenarioformHistoryComparisonValue(current.successRate, previous.successRate, ' %', false) + '</tr>' +
        '<tr><th>Taux d’incident</th>' + scenarioformHistoryComparisonValue(current.incidentRate, previous.incidentRate, ' %', true) + '</tr>' +
        '<tr><th>Absences de retour</th>' + scenarioformHistoryComparisonValue(current.timeouts, previous.timeouts, '', true) + '</tr>' +
        '<tr><th>Durée moyenne</th>' + scenarioformHistoryComparisonValue(current.averageDuration, previous.averageDuration, 'duration', true) + '</tr>' +
        '</tbody></table></div>';
}

function scenarioformRenderScenarioFailures(history) {
    let scenarios = {};
    history.forEach(function(response) {
        (Array.isArray(response.scenario_results) ? response.scenario_results : []).forEach(function(result) {
            let key = result.scenario_id || result.name || 'unknown';
            if (!scenarios[key]) scenarios[key] = {
                name: result.name || (result.scenario_id ? 'Scénario #' + result.scenario_id : 'Scénario non disponible'),
                total: 0,
                failures: 0
            };
            scenarios[key].total++;
            if (['warning', 'rejected', 'error', 'timeout'].indexOf(result.status || 'pending') !== -1) scenarios[key].failures++;
        });
    });
    let ranked = Object.keys(scenarios).map(function(key) { return scenarios[key]; })
        .filter(function(item) { return item.failures > 0; })
        .sort(function(a, b) { return b.failures - a.failures || b.failures / b.total - a.failures / a.total; }).slice(0, 5);
    if (ranked.length === 0) return '<p class="text-muted">Aucun scénario en échec sur cette période.</p>';
    return scenarioformRenderHistoryFrequency(ranked.map(function(item) {
        return { label: item.name, count: item.failures, detail: item.total };
    }), ranked.reduce(function(sum, item) { return sum + item.failures; }, 0));
}

function scenarioformRenderMostUsedForms(overview) {
    if (overview === null) return '<p class="text-muted"><i class="fas fa-spinner fa-spin"></i> Chargement du classement…</p>';
    let scoped = (Array.isArray(overview) ? overview : []).filter(scenarioformHistoryInPeriod);
    let forms = {};
    scoped.forEach(function(response) {
        let form = response.form || {};
        let key = form.id || form.name || 'unknown';
        if (!forms[key]) forms[key] = { label: form.name || 'Formulaire supprimé', count: 0 };
        forms[key].count++;
    });
    let ranked = Object.keys(forms).map(function(key) { return forms[key]; })
        .sort(function(a, b) { return b.count - a.count || a.label.localeCompare(b.label, 'fr'); }).slice(0, 5);
    return ranked.length > 0 ? scenarioformRenderHistoryFrequency(ranked, scoped.length) :
        '<p class="text-muted">Aucune exécution visible sur cette période.</p>';
}

function scenarioformCsvCell(value) {
    let text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
}

function scenarioformExportHistoryCsv(history) {
    let fields = [];
    history.forEach(function(response) {
        (Array.isArray(response.values) ? response.values : []).forEach(function(value) {
            let label = value.label || value.name || ('Champ #' + value.field_id);
            let key = value.field_id ? 'id:' + value.field_id : 'tag:' + (value.tag || label);
            if (!fields.some(function(field) { return field.key === key; })) {
                fields.push({ key: key, label: label, tag: value.tag || '' });
            }
        });
    });
    let duplicateLabels = fields.reduce(function(counts, field) {
        counts[field.label] = (counts[field.label] || 0) + 1;
        return counts;
    }, {});
    let headers = ['Réponse', 'Date', 'Requête', 'Formulaire'].concat(fields.map(function(field) {
        return duplicateLabels[field.label] > 1 && field.tag ? field.label + ' (' + field.tag + ')' : field.label;
    })).concat([
        'Scénarios demandés', 'Résultats du lancement', 'Statuts métier', 'Messages métier', 'Durées'
    ]);
    let rows = history.map(function(response) {
        let valuesByLabel = {};
        (Array.isArray(response.values) ? response.values : []).forEach(function(value) {
            let label = value.label || value.name || ('Champ #' + value.field_id);
            let key = value.field_id ? 'id:' + value.field_id : 'tag:' + (value.tag || label);
            valuesByLabel[key] = value.value;
        });
        let results = Array.isArray(response.scenario_results) ? response.scenario_results : [];
        return [
            response.id,
            response.created || '',
            response.request && response.request.name || '',
            response.form && response.form.name || ''
        ].concat(fields.map(function(field) { return valuesByLabel[field.key] === undefined ? '' : valuesByLabel[field.key]; })).concat([
            (Array.isArray(response.requested_scenarios) ? response.requested_scenarios : []).map(function(item) { return item.name || ('Scénario #' + item.id); }).join(' | '),
            (Array.isArray(response.launch_results) ? response.launch_results : []).map(function(item) { return (item.name || ('Scénario #' + item.id)) + ': ' + (item.result === true ? 'Succès' : 'Échec'); }).join(' | '),
            results.map(function(item) { return (item.name || ('Scénario #' + item.scenario_id)) + ': ' + (item.status || 'pending'); }).join(' | '),
            results.map(function(item) { return item.message || ''; }).filter(Boolean).join(' | '),
            results.map(function(item) { return (item.name || ('Scénario #' + item.scenario_id)) + ': ' + scenarioformHistoryDuration(response, item); }).join(' | ')
        ]);
    });
    let csv = '\ufeff' + [headers].concat(rows).map(function(row) {
        return row.map(scenarioformCsvCell).join(';');
    }).join('\r\n');
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, 'scenarioform-historique.csv');
        return;
    }
    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    let formName = history[0] && history[0].form && history[0].form.name
        ? history[0].form.name : 'formulaire';
    let formSlug = formName.normalize ? formName.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : formName;
    formSlug = formSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'formulaire';
    link.href = url;
    link.download = 'scenarioform-' + formSlug + '-selection-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.style.display = 'none';
    link.addEventListener('click', function(event) {
        // Jeedom ajaxifie sinon les liens et tente de charger le blob en HTML.
        event.stopImmediatePropagation();
    });
    document.body.appendChild(link);
    link.click();
    // WebView et certains navigateurs récupèrent le blob après le clic :
    // le libérer immédiatement provoque alors « Failed to fetch ».
    window.setTimeout(function() {
        if (link.parentNode) link.parentNode.removeChild(link);
        URL.revokeObjectURL(url);
    }, 30000);
}

function scenarioformRenderHistorySummary(history) {
    let scoped = (Array.isArray(history) ? history : []).filter(scenarioformHistoryInPeriod);
    let launched = scoped.filter(function(response) {
        return scenarioformHistoryCategories(response).launchSuccess !== null;
    });
    let launchSuccessCount = launched.filter(function(response) {
        return scenarioformHistoryCategories(response).launchSuccess === true;
    }).length;
    let incidents = scoped.filter(function(response) {
        return scenarioformHistoryCategories(response).incident;
    });
    let pendingCount = scoped.filter(function(response) {
        return scenarioformHistoryCategories(response).pending;
    }).length;
    let launchRate = launched.length > 0 ? Math.round(launchSuccessCount * 100 / launched.length) + ' %' : '—';
    let statusCounts = { accepted: 0, warning: 0, rejected: 0, error: 0, timeout: 0, pending: 0, not_expected: 0 };
    scoped.forEach(function(response) {
        scenarioformHistoryCategories(response).statuses.forEach(function(status) {
            if (statusCounts[status] !== undefined) statusCounts[status]++;
        });
    });
    let acceptedCount = statusCounts.accepted;
    let expectedTerminalCount = statusCounts.accepted + statusCounts.warning + statusCounts.rejected + statusCounts.error + statusCounts.timeout;
    let businessSuccessRate = expectedTerminalCount > 0 ? Math.round(statusCounts.accepted * 100 / expectedTerminalCount) : null;
    let businessErrorCount = statusCounts.warning + statusCounts.rejected + statusCounts.error + statusCounts.timeout;
    let businessErrorRate = expectedTerminalCount > 0 ? Math.round(businessErrorCount * 100 / expectedTerminalCount) : null;
    let durationStats = scenarioformHistoryDurationStatistics(scoped);
    let totalStatuses = Object.keys(statusCounts).reduce(function(total, status) {
        return total + statusCounts[status];
    }, 0);
    let statusLabels = {
        accepted: 'Acceptés', warning: 'Avertissements', rejected: 'Refusés',
        error: 'Erreurs', timeout: 'Délais dépassés', pending: 'En attente',
        not_expected: 'Sans retour attendu'
    };
    let distribution = totalStatuses === 0 ? '<span class="text-muted">Aucun retour métier sur cette période.</span>' :
        Object.keys(statusCounts).filter(function(status) { return statusCounts[status] > 0; }).map(function(status) {
            let percent = Math.round(statusCounts[status] * 100 / totalStatuses);
            return '<span class="scenarioform-summary-distribution-item is-' + status + '">' +
                scenarioformEscapeHtml(statusLabels[status]) + ' ' + percent + '%</span>';
        }).join('');
    let incidentRows = incidents.slice().sort(function(a, b) {
        return (scenarioformHistoryDate(b) || 0) - (scenarioformHistoryDate(a) || 0);
    }).slice(0, 5).map(function(response) {
        let formName = response.form && response.form.name ? response.form.name : 'Formulaire non disponible';
        let categories = scenarioformHistoryCategories(response);
        let label = categories.launchSuccess === false ? 'Échec du lancement' :
            (categories.statuses.indexOf('timeout') !== -1 ? 'Délai dépassé' :
            (categories.statuses.indexOf('error') !== -1 ? 'Erreur' :
            (categories.statuses.indexOf('rejected') !== -1 ? 'Refusé' : 'Avertissement')));
        return '<li><span><time>' + scenarioformEscapeHtml(response.created || '') + '</time> — ' +
            scenarioformEscapeHtml(formName) + ' — <strong>' + scenarioformEscapeHtml(label) + '</strong></span>' +
            '<button type="button" class="btn btn-default btn-xs scenarioform-summary-open" data-response-id="' +
            parseInt(response.id, 10) + '">Détails</button></li>';
    }).join('');

    $('#scenarioform-history-summary').html(`
        <div class="scenarioform-summary-toolbar">
            <strong><i class="fas fa-chart-bar"></i> Synthèse</strong>
        </div>
        <div class="scenarioform-summary-metrics">
            <button type="button" class="scenarioform-summary-metric ${scenarioformHistoryFilter === 'all' ? 'active' : ''}" data-filter="all"><strong>${scoped.length}</strong><span>Exécutions</span></button>
            <button type="button" class="scenarioform-summary-metric ${scenarioformHistoryFilter === 'launch-success' ? 'active' : ''}" data-filter="launch-success"><strong>${launchRate}</strong><span>Lancements réussis</span></button>
            <button type="button" class="scenarioform-summary-metric ${scenarioformHistoryFilter === 'accepted' ? 'active' : ''}" data-filter="accepted"><strong>${acceptedCount}</strong><span>Retours acceptés</span></button>
            <button type="button" class="scenarioform-summary-metric is-alert ${scenarioformHistoryFilter === 'incident' ? 'active' : ''}" data-filter="incident"><strong>${incidents.length}</strong><span>Incidents</span></button>
            <button type="button" class="scenarioform-summary-metric ${scenarioformHistoryFilter === 'pending' ? 'active' : ''}" data-filter="pending"><strong>${pendingCount}</strong><span>En attente</span></button>
        </div>
        <div class="scenarioform-summary-section"><strong>Comparaison avec la période précédente</strong>${scenarioformRenderHistoryComparison(history)}</div>
        <div class="scenarioform-summary-section">
            <strong>Résultats métier</strong>
            <div class="scenarioform-stat-kpis">
                <div><strong>${businessSuccessRate === null ? '—' : businessSuccessRate + ' %'}</strong><span>Taux de succès</span></div>
                <div><strong>${businessErrorRate === null ? '—' : businessErrorRate + ' %'}</strong><span>Taux d’incident</span></div>
                <div><strong>${statusCounts.timeout}</strong><span>Absences de retour</span></div>
            </div>
        </div>
        <div class="scenarioform-summary-section">
            <strong>Durées des scénarios</strong>
            ${durationStats ? `<div class="scenarioform-stat-kpis">
                <div><strong>${scenarioformEscapeHtml(scenarioformFormatDurationSeconds(durationStats.average))}</strong><span>Moyenne</span></div>
                <div><strong>${scenarioformEscapeHtml(scenarioformFormatDurationSeconds(durationStats.minimum))}</strong><span>Minimum</span></div>
                <div><strong>${scenarioformEscapeHtml(scenarioformFormatDurationSeconds(durationStats.maximum))}</strong><span>Maximum · ${durationStats.count} résultat${durationStats.count > 1 ? 's' : ''}</span></div>
            </div>` : '<p class="text-muted">Aucune durée complète disponible sur cette période.</p>'}
        </div>
        <div class="scenarioform-summary-section"><strong>Évolution dans le temps</strong>${scenarioformRenderHistoryEvolution(scoped)}</div>
        <div class="scenarioform-summary-section"><strong>Répartition des retours</strong><div class="scenarioform-summary-distribution">${distribution}</div></div>
        <div class="scenarioform-summary-section scenarioform-stat-rankings">
            <div><strong>Scénarios les plus souvent en échec</strong>${scenarioformRenderScenarioFailures(scoped)}</div>
            <div><strong>Formulaires les plus utilisés</strong>${scenarioformRenderMostUsedForms(scenarioformHistoryOverview)}</div>
        </div>
        <div class="scenarioform-summary-section"><strong>Analyse des champs</strong>${scenarioformRenderFieldStatistics(scoped)}</div>
        <div class="scenarioform-summary-section scenarioform-summary-alerts"><strong>À surveiller</strong>${incidentRows ? '<ul>' + incidentRows + '</ul>' : '<p class="text-muted">Aucun incident sur cette période.</p>'}</div>
    `);
}

function scenarioformApplyHistorySection() {
    let showStats = scenarioformHistorySection === 'stats';
    $('#scenarioform-history-summary').toggle(showStats);
    $('#scenarioform-history-content').toggle(!showStats);
    $('.scenarioform-history-list-control').toggle(!showStats);
    $('#bt_historyStats').toggle(!showStats);
    $('#bt_historyList').toggle(showStats);
    $('#scenarioform-history-count').toggle(!showStats);
}

function scenarioformLoadHistoryOverview() {
    if (Array.isArray(scenarioformHistoryOverview) || scenarioformHistoryOverviewRequest) return;
    scenarioformHistoryOverviewRequest = $.ajax({
        type: 'POST',
        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
        data: { action: 'getHistoryOverview' },
        dataType: 'json',
        success: function(data) {
            scenarioformHistoryOverview = data && data.state === 'ok' && Array.isArray(data.result.history)
                ? data.result.history : [];
            if (scenarioformHistorySection === 'stats') {
                scenarioformRenderHistorySummary(scenarioformHistory);
                scenarioformApplyHistorySection();
            }
        },
        error: function() {
            scenarioformHistoryOverview = [];
            if (scenarioformHistorySection === 'stats') {
                scenarioformRenderHistorySummary(scenarioformHistory);
                scenarioformApplyHistorySection();
            }
        },
        complete: function() { scenarioformHistoryOverviewRequest = null; }
    });
}

function scenarioformReportLines(report) {
    let lines = [];
    (Array.isArray(report.sections) ? report.sections : []).forEach(function(section) {
        if (!section || typeof section !== 'object') return;
        if (section.type === 'table' && Array.isArray(section.rows)) {
            section.rows.forEach(function(row) {
                if (!Array.isArray(row)) return;
                let cells = row.filter(function(cell) {
                    return cell !== null && cell !== undefined && String(cell).trim() !== '';
                });
                lines.push(cells.join(' '));
            });
        } else if (Array.isArray(section.content)) {
            section.content.forEach(function(line) { lines.push(String(line)); });
        } else if (section.content && typeof section.content === 'object') {
            Object.keys(section.content).forEach(function(key) {
                lines.push(key + ' : ' + section.content[key]);
            });
        } else if (section.content !== undefined && section.content !== null) {
            String(section.content).split(/\r?\n/).forEach(function(line) { lines.push(line); });
        }
    });
    return lines;
}

function scenarioformRenderReportOverview(report) {
    let sections = Array.isArray(report.sections) ? report.sections : [];
    let heading = [sections.map(function(section) { return section && section.title || ''; })
        .find(function(title) { return title !== ''; }), report.summary].filter(Boolean).join(' - ');
    let html = '<article class="scenarioform-report-overview">' +
        '<h4>' + scenarioformEscapeHtml(heading || report.title || 'Compte rendu') + '</h4>' +
        '<div class="text-muted">' + scenarioformEscapeHtml(report.event_at || report.created || '') + '</div>';
    html += '<ul class="scenarioform-report-lines">' + scenarioformReportLines(report).map(function(line) {
        return '<li>' + scenarioformEscapeHtml(line) + '</li>';
    }).join('') + '</ul>';
    return html + '</article>';
}

function scenarioformReportCsvDateParts(raw) {
    let value = String(raw || '');
    let match = value.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s*(?:à\s*)?(\d{1,2})[:h](\d{2}))?/i);
    if (match) {
        let day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
        let date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day &&
            (!match[4] || (Number(match[4]) < 24 && Number(match[5]) < 60))) {
            return { match: match, date: String(day).padStart(2, '0') + '/' +
                String(month).padStart(2, '0') + '/' + year,
                time: match[4] ? String(match[4]).padStart(2, '0') + ':' + match[5] : '' };
        }
    }
    // Format de created : AAAA-MM-JJ HH:MM:SS.
    match = value.match(/\b(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (match) return { match: match, date: match[3] + '/' + match[2] + '/' + match[1],
        time: match[4] ? match[4] + ':' + match[5] : '' };
    return null;
}

function scenarioformExportReportsCsv() {
    let rows = [['Date', 'Heure', 'Texte']];
    scenarioformReports.forEach(function(report) {
        let created = scenarioformReportCsvDateParts(report.created);
        scenarioformReportLines(report).forEach(function(line) {
            let found = scenarioformReportCsvDateParts(line);
            let date = found || created;
            rows.push([date ? date.date : '', date ? date.time : '', line]);
        });
    });
    // Les colonnes date et heure ont un format strict : les laisser sans
    // guillemets facilite leur détection comme valeurs par le tableur.
    let csv = '\ufeff' + rows.map(function(row, index) {
        return index === 0 ? row.map(scenarioformCsvCell).join(';') :
            row[0] + ';' + row[1] + ';' + scenarioformCsvCell(row[2]);
    }).join('\r\n');
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    let fileName = 'scenarioform-comptes-rendus-' + new Date().toISOString().slice(0, 10) + '.csv';
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
        return;
    }
    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    link.addEventListener('click', function(event) { event.stopImmediatePropagation(); });
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function() {
        if (link.parentNode) link.parentNode.removeChild(link);
        URL.revokeObjectURL(url);
    }, 30000);
}

function showFormReports(formId) {
    scenarioformViewMode = 'reports';
    scenarioformReports = [];
    if (scenarioformHistoryRequest) scenarioformHistoryRequest.abort();
    if (scenarioformHistoryPollTimer) clearTimeout(scenarioformHistoryPollTimer);
    if (scenarioformValuesRequest) scenarioformValuesRequest.abort();
    $('#scenarioform-fields-management').hide();
    $('#scenarioform-execute-zone').html(
        '<div class="scenarioform-entry-card scenarioform-reports-zone">' +
        '<div class="scenarioform-entry-header"><h4><i class="fas fa-file-alt"></i> Comptes rendus métier</h4>' +
        '<div><button type="button" class="btn btn-success btn-sm" id="bt_exportFormReports" disabled>' +
        '<i class="fas fa-file-csv"></i> Exporter CSV</button> ' +
        '<button type="button" class="btn btn-warning btn-sm" id="bt_purgePreviousFormReports">' +
        '<i class="fas fa-broom"></i> Purger les précédents</button> ' +
        '<button type="button" class="btn btn-default btn-sm" id="bt_backReportsToForm">' +
        '<i class="fas fa-arrow-left"></i> Retour</button></div></div>' +
        '<div id="scenarioform-reports-content"><i class="fas fa-spinner fa-spin"></i> Chargement...</div></div>'
    );
    scenarioformHistoryRequest = $.ajax({
        type: 'POST',
        url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
        data: { action: 'getHistory', form_id: formId },
        dataType: 'json',
        success: function(data) {
            if (scenarioformViewMode !== 'reports') return;
            if (!data || data.state !== 'ok' || !data.result || !Array.isArray(data.result.history)) {
                $('#scenarioform-reports-content').text('Impossible de charger les comptes rendus.');
                return;
            }
            let reports = [];
            data.result.history.forEach(function(response) {
                (Array.isArray(response.documents) ? response.documents : []).forEach(function(report) {
                    reports.push(report);
                });
            });
            scenarioformReports = reports;
            $('#bt_exportFormReports').prop('disabled', !reports.some(function(report) {
                return scenarioformReportLines(report).length > 0;
            }));
            $('#scenarioform-reports-content').html(reports.length
                ? reports.map(scenarioformRenderReportOverview).join('')
                : '<p>Aucun compte rendu pour ce formulaire.</p>');
        },
        error: function(xhr, status) {
            if (status !== 'abort' && scenarioformViewMode === 'reports') {
                $('#scenarioform-reports-content').text('Impossible de charger les comptes rendus.');
            }
        },
        complete: function() { scenarioformHistoryRequest = null; }
    });
}

$(document).on('click.scenarioform', '#bt_formReports', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) showFormReports(formId);
});

$(document).on('click.scenarioform', '#bt_exportFormReports', function() {
    if (scenarioformReports.length) scenarioformExportReportsCsv();
});

$(document).on('click.scenarioform', '#bt_purgePreviousFormReports', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (!formId) return;
    bootbox.confirm(
        'Supprimer les anciens comptes rendus métier de ce formulaire ? ' +
        'Le compte rendu le plus récent de chaque scénario sera conservé. ' +
        'Les réponses de l’historique et leurs valeurs ne seront pas supprimées.',
        function(confirmed) {
            if (!confirmed) return;
            $.ajax({
                type: 'POST',
                url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
                data: { action: 'purgePreviousFormReports', form_id: formId },
                dataType: 'json',
                success: function(data) {
                    if (!data || data.state !== 'ok') {
                        jeedomUtils.showAlert({
                            message: data && data.result ? data.result : 'Erreur lors de la purge des comptes rendus',
                            level: 'danger'
                        });
                        return;
                    }
                    let removed = data.result && data.result.removed ? data.result.removed : 0;
                    jeedomUtils.showAlert({
                        message: removed + ' ancien(s) compte(s) rendu(s) supprimé(s).',
                        level: 'success'
                    });
                    showFormReports(formId);
                },
                error: function() {
                    jeedomUtils.showAlert({ message: 'Erreur technique lors de la purge', level: 'danger' });
                }
            });
        }
    );
});

$(document).on('click.scenarioform', '#bt_backReportsToForm', function() {
    scenarioformViewMode = 'idle';
    if (scenarioformHistoryRequest) scenarioformHistoryRequest.abort();
    scenarioformReports = [];
    $('#scenarioform-execute-zone').empty();
});

function showFormHistory(formId) {
    scenarioformViewMode = 'history';
    // Conserver le tri choisi lors des retours au même historique, notamment
    // après modification ou suppression. Appliquer le tri du formulaire seulement
    // lors de la première ouverture ou du changement de formulaire.
    if (scenarioformHistoryLastFormId !== String(formId)) {
        scenarioformHistorySort = 'newest';
        scenarioformHistorySortDefaultPending = true;
        scenarioformHistoryLastFormId = String(formId);
    }
    scenarioformHistorySection = 'list';
    scenarioformHistoryOverview = null;

    if (scenarioformValuesRequest) {
        scenarioformValuesRequest.abort();
        scenarioformValuesRequest = null;
    }

    $('#scenarioform-fields-management').hide();
    $('#scenarioform-execute-zone').html(`
        <div id="scenarioform-history-zone" class="scenarioform-entry-card">
            <div class="scenarioform-entry-header scenarioform-history-header">
                <h4>
                    <i class="fas fa-history"></i> Historique des requêtes
                    <span id="scenarioform-history-count" class="scenarioform-history-count"></span>
                </h4>
                <div class="scenarioform-history-header-actions">
                    <button type="button" class="btn btn-default btn-sm" id="bt_historyList" style="display:none">
                        <i class="fas fa-list"></i> Liste
                    </button>
                    <button type="button" class="btn btn-info btn-sm" id="bt_historyStats">
                        <i class="fas fa-chart-bar"></i> Statistiques
                    </button>
                    <label class="scenarioform-history-period-label">
                        Période
                        <select id="scenarioform-history-period" class="form-control input-sm">
                            <option value="24h" ${scenarioformHistoryPeriod === '24h' ? 'selected' : ''}>24 heures</option>
                            <option value="7d" ${scenarioformHistoryPeriod === '7d' ? 'selected' : ''}>7 jours</option>
                            <option value="30d" ${scenarioformHistoryPeriod === '30d' ? 'selected' : ''}>30 jours</option>
                            <option value="custom" ${scenarioformHistoryPeriod === 'custom' ? 'selected' : ''}>Personnalisée</option>
                            <option value="all" ${scenarioformHistoryPeriod === 'all' ? 'selected' : ''}>Toute la période</option>
                        </select>
                    </label>
                    <div class="scenarioform-summary-custom-period ${scenarioformHistoryPeriod === 'custom' ? '' : 'hidden'}">
                        <input type="date" id="scenarioform-history-start" class="form-control input-sm" value="${scenarioformEscapeAttribute(scenarioformHistoryCustomStart)}" aria-label="Date de début">
                        <span>au</span>
                        <input type="date" id="scenarioform-history-end" class="form-control input-sm" value="${scenarioformEscapeAttribute(scenarioformHistoryCustomEnd)}" aria-label="Date de fin">
                    </div>
                    <label class="scenarioform-history-filter-label scenarioform-history-list-control">
                        <span class="sr-only">Statut</span>
                        <select id="scenarioform-history-status" class="form-control input-sm" aria-label="Filtrer par statut">
                            <option value="all" ${scenarioformHistoryStatus === 'all' ? 'selected' : ''}>Tous les statuts</option>
                            <option value="accepted" ${scenarioformHistoryStatus === 'accepted' ? 'selected' : ''}>Accepté</option>
                            <option value="warning" ${scenarioformHistoryStatus === 'warning' ? 'selected' : ''}>Avertissement</option>
                            <option value="error" ${scenarioformHistoryStatus === 'error' ? 'selected' : ''}>Erreur</option>
                            <option value="rejected" ${scenarioformHistoryStatus === 'rejected' ? 'selected' : ''}>Refusé</option>
                            <option value="no-return" ${scenarioformHistoryStatus === 'no-return' ? 'selected' : ''}>Aucun retour</option>
                        </select>
                    </label>
                    <label class="scenarioform-history-search-label scenarioform-history-list-control">
                        <span class="sr-only">Rechercher</span>
                        <input type="search" id="scenarioform-history-search" class="form-control input-sm"
                               value="${scenarioformEscapeAttribute(scenarioformHistorySearch)}"
                               placeholder="Valeur ou message…" aria-label="Rechercher dans les valeurs et messages">
                    </label>
                    <label class="scenarioform-history-sort-label scenarioform-history-list-control">
                        Trier
                        <select id="scenarioform-history-sort" class="form-control input-sm">
                            <option value="newest" ${scenarioformHistorySort === 'newest' ? 'selected' : ''}>Date — plus récentes</option>
                            <option value="oldest" ${scenarioformHistorySort === 'oldest' ? 'selected' : ''}>Date — plus anciennes</option>
                            <option value="number-desc" ${scenarioformHistorySort === 'number-desc' ? 'selected' : ''}>N° de réponse — décroissant</option>
                            <option value="number-asc" ${scenarioformHistorySort === 'number-asc' ? 'selected' : ''}>N° de réponse — croissant</option>
                        </select>
                    </label>
                    <button type="button" class="btn btn-default btn-sm scenarioform-history-list-control" id="bt_refreshFormHistory">
                        <i class="fas fa-sync-alt"></i> Actualiser
                    </button>
                    <button type="button" class="btn btn-success btn-sm scenarioform-history-list-control" id="bt_exportFormHistory" disabled
                            title="Exporte les lignes de ce formulaire après application de la période, du statut et de la recherche">
                        <i class="fas fa-file-csv"></i> Exporter la sélection (.csv)
                    </button>
                    <button type="button" class="btn btn-danger btn-sm scenarioform-history-list-control" id="bt_clearFormHistory" disabled>
                        <i class="fas fa-trash"></i> Vider l’historique
                    </button>
                    <button type="button" class="btn btn-default btn-sm" id="bt_backHistoryToEntry">
                        <i class="fas fa-keyboard"></i> Revenir à la saisie
                    </button>
                </div>
            </div>
            <div id="scenarioform-history-summary" class="scenarioform-history-summary-panel" style="display:none"></div>
            <div id="scenarioform-history-content"></div>
        </div>
    `);

    loadFormHistory(formId);
}

$(document).on('click.scenarioform', '#bt_historyForm', 
    function () {


let formId = $('#div_scenarioform-form')
    .attr('data-form-id');

if (!formId) {

    $('#scenarioform-history-content').html(
        '<div class="alert alert-danger">' +
        'Formulaire introuvable' +
        '</div>'
    );

    $('#scenarioform-history-zone').show();

    return;
}

showFormValues(formId, true);

});

$(document).on('click.scenarioform', '#bt_backHistoryToEntry', function() {
    let formId = $('#div_scenarioform-form').attr('data-form-id');
    if (formId) {
        showFormValues(formId, false);
    }
});

function loadFormHistory(formId, silent) {

scenarioformViewMode = 'history';

if (scenarioformHistoryPollTimer) {
    clearTimeout(scenarioformHistoryPollTimer);
    scenarioformHistoryPollTimer = null;
}

$('#scenarioform-history-zone').show();

if (silent !== true) {
    $('#scenarioform-history-content').html(
        '<div class="text-center">' +
        '<i class="fas fa-spinner fa-spin"></i> Chargement...' +
        '</div>'
    );
}

if (scenarioformHistoryRequest) {
    scenarioformHistoryRequest.abort();
}

scenarioformHistoryRequest = $.ajax({

    type: 'POST',

    url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

    data: {
        action: 'getHistory',
        form_id: formId,
        sort: scenarioformHistorySort
    },

    dataType: 'json',

    success: function(data) {

        if (scenarioformViewMode !== 'history') {
            return;
        }

        if (!data || data.state !== 'ok') {

            console.error(
                'Erreur récupération historique'
            );

            $('#scenarioform-history-content').html(
                '<div class="alert alert-danger">' +
                'Erreur lors de la récupération de l’historique.' +
                '</div>'
            );

            return;
        }

        /*
         * Le PHP renvoie :
         *
         * {
         *     history: [...]
         * }
         */
        var history = data.result.history;

        /*
         * On conserve l'historique pour le bouton
         * "Reprendre".
         */
        scenarioformHistory = history;

        if (!Array.isArray(history)) {

            console.error(
                'Historique invalide :',
                history
            );

            $('#scenarioform-history-content').html(
                '<div class="alert alert-danger">' +
                'Format de l’historique invalide.' +
                '</div>'
            );

            return;
        }

        scenarioformPopulateHistorySortFields(history);

        let displayedHistory = history.filter(scenarioformHistoryInPeriod)
            .filter(scenarioformHistoryMatchesFilter)
            .filter(scenarioformHistoryMatchesStatus)
            .filter(scenarioformHistoryMatchesSearch)
            .sort(scenarioformCompareHistory);

        $('#scenarioform-history-count').text(
            '— ' + displayedHistory.length + ' affichée' + (displayedHistory.length > 1 ? 's' : '') +
            ' sur ' + history.length
        );
        $('#bt_clearFormHistory').prop('disabled', history.length === 0);
        $('#bt_exportFormHistory').prop('disabled', displayedHistory.length === 0)
            .data('history', displayedHistory);

        scenarioformHistory = history;
        scenarioformRenderHistorySummary(history);
        var html = '';

        if (displayedHistory.length === 0) {

            html = '<p>Aucune réponse ne correspond à la période et au filtre sélectionnés.</p>';

        } else {

            // r109 : regrouper uniquement lorsque le tri actif porte sur un champ.
            // Les tris date/numéro conservent leur affichage historique classique.
            let groupSortMatch = String(scenarioformHistorySort || '').match(/^field:(.+):(asc|desc)$/);
            let groupSortKey = groupSortMatch ? decodeURIComponent(groupSortMatch[1]) : null;
            let previousGroupKey = null;
            let groupIndex = -1;
            let groupCounts = {};
            function historyGroupInfo(response) {
                let item = scenarioformHistorySortValue(response, groupSortKey);
                let raw = item && item.value !== null && item.value !== undefined ? String(item.value).trim() : '';
                let comparable = scenarioformHistoryComparableValue(item);
                let key = comparable ? comparable.kind + ':' + String(comparable.value).toLocaleLowerCase('fr') : '__empty__';
                return { key: key, label: raw || '(Vide)' };
            }
            if (groupSortKey !== null) {
                displayedHistory.forEach(function(response) {
                    let key = historyGroupInfo(response).key;
                    groupCounts[key] = (groupCounts[key] || 0) + 1;
                });
            }
            displayedHistory.forEach(function(response) {
                if (groupSortKey !== null) {
                    let group = historyGroupInfo(response);
                    if (group.key !== previousGroupKey) {
                        if (previousGroupKey !== null) html += '</div></div>';
                        groupIndex++;
                        previousGroupKey = group.key;
                        html += '<div class="scenarioform-history-group">' +
                            '<div class="scenarioform-history-group-header">' +
                            '<strong>' + scenarioformEscapeHtml(group.label) + '</strong>' +
                            '<span class="scenarioform-history-group-count">' + groupCounts[group.key] +
                            ' requête' + (groupCounts[group.key] > 1 ? 's' : '') + '</span>' +
                            '<button type="button" class="btn btn-default btn-sm scenarioform-history-group-toggle" ' +
                            'data-group-index="' + groupIndex + '" aria-expanded="false">' +
                            '<i class="fas fa-chevron-down"></i> Voir</button></div>' +
                            '<div class="scenarioform-history-group-items" data-group-index="' + groupIndex + '" hidden>';
                    }
                }


                var requestName = response.request && response.request.name
                    ? response.request.name
                    : 'Requête non disponible';
                var formName = response.form && response.form.name
                    ? response.form.name
                    : 'Formulaire non disponible';
                let requestedScenarioNames = Array.isArray(response.requested_scenarios)
                    ? response.requested_scenarios.map(function(item) {
                        return item.name || ('Scénario #' + item.id);
                    }).join(', ')
                    : 'Scénario non disponible';
                let historyTitleValue = '';
                if (Array.isArray(response.values)) {
                    let configuredHistoryTitleFieldId = parseInt(response.history_title_field_id, 10) || 0;
                    let firstHistoryValue = null;
                    if (configuredHistoryTitleFieldId > 0) {
                        firstHistoryValue = response.values.find(function(value) {
                            return value && parseInt(value.field_id, 10) === configuredHistoryTitleFieldId &&
                                value.value !== null && value.value !== undefined && String(value.value).trim() !== '';
                        }) || null;
                    } else {
                        firstHistoryValue = response.values.find(function(value) {
                            if (!value || value.value === null || value.value === undefined) return false;
                            return String(value.value).trim() !== '';
                        }) || null;
                    }
                    if (firstHistoryValue) {
                        let historyTitleLabel = firstHistoryValue.label || firstHistoryValue.name || ('Champ #' + firstHistoryValue.field_id);
                        let historyTitleDisplayValue = String(firstHistoryValue.value).trim();
                        if (historyTitleDisplayValue.length > 80) {
                            historyTitleDisplayValue = historyTitleDisplayValue.substring(0, 77) + '…';
                        }
                        historyTitleValue = historyTitleLabel + ' : ' + historyTitleDisplayValue;
                    }
                }
                let launchSucceeded = Array.isArray(response.launch_results) &&
                    response.launch_results.length > 0 &&
                    response.launch_results.every(function(item) { return item.result === true; });
                let launchLabel = Array.isArray(response.launch_results) && response.launch_results.length > 0
                    ? (launchSucceeded ? 'Lancement réussi' : 'Échec du lancement')
                    : 'Lancement non renseigné';
                let businessMessages = Array.isArray(response.scenario_results)
                    ? response.scenario_results.map(function(item) { return item.message || ''; })
                        .filter(function(message) { return message !== ''; }).join(' · ')
                    : '';
                let firstDocument = Array.isArray(response.documents) ? response.documents[0] : null;
                let businessExcerpt = businessMessages || (firstDocument && firstDocument.summary) || 'Aucun extrait de résultat métier';
                if (businessExcerpt.length > 140) {
                    businessExcerpt = businessExcerpt.substring(0, 137) + '…';
                }

                html += `
                    <div class="scenarioform-history-item" data-response-id="${response.id}">

                        <div class="scenarioform-history-item-header">
                            <div class="scenarioform-history-summary">
                                <div class="scenarioform-history-summary-primary">
                                    <strong>Réponse #${response.history_id || response.id}</strong>
                                    <span class="scenarioform-history-technical-id" title="Identifiant permanent de la réponse">ID technique : ${scenarioformEscapeHtml(String(response.id))}</span>
                                    ${historyTitleValue ? `<span class="scenarioform-history-title-value" title="${scenarioformEscapeAttribute(historyTitleValue)}">${scenarioformEscapeHtml(historyTitleValue)}</span>` : ''}
                                </div>
                                <div class="scenarioform-history-summary-meta">
                                    <span>${scenarioformEscapeHtml(requestName)}</span>
                                    <span>${scenarioformEscapeHtml(formName)}</span>
                                    <time>${scenarioformEscapeHtml(response.created || '')}</time>
                                    <span class="scenarioform-history-launch-status ${launchSucceeded ? 'is-success' : ''}">
                                        ${scenarioformEscapeHtml(launchLabel)}
                                    </span>
                                </div>
                                <div class="scenarioform-history-summary-secondary">
                                    <strong>${scenarioformEscapeHtml(requestedScenarioNames)}</strong>
                                    <span>${scenarioformEscapeHtml(businessExcerpt)}</span>
                                </div>
                            </div>
                            <div class="scenarioform-history-actions">
                                ${firstDocument ? `<button type="button" class="btn btn-info btn-sm scenarioform-history-document"
                                        data-response-id="${response.id}" data-document-id="${firstDocument.id}">
                                    <i class="fas fa-file-alt"></i> Compte rendu
                                </button>` : ''}
                                <button type="button" class="btn btn-default btn-sm scenarioform-history-toggle"
                                        data-response-id="${response.id}" aria-expanded="false">
                                    <i class="fas fa-chevron-down"></i> Détails
                                </button>
                                <button type="button" class="btn btn-warning btn-sm scenarioform-history-edit"
                                        data-response-id="${response.id}">
                                    <i class="fas fa-pen"></i> Modifier
                                </button>
                                <button type="button"
                                        class="btn btn-primary btn-sm scenarioform-history-reuse"
                                        data-response-id="${response.id}">
                                    <i class="fas fa-redo"></i> Utiliser ces valeurs
                                </button>
                                <button type="button"
                                        class="btn btn-danger btn-sm scenarioform-history-remove"
                                        data-response-id="${response.id}">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            </div>
                        </div>

                        <div class="scenarioform-history-details" data-response-id="${response.id}" hidden>
                        <dl class="dl-horizontal mt-2">
                            <dt>Requête</dt>
                            <dd>${scenarioformEscapeHtml(requestName)}</dd>
                            <dt>Formulaire</dt>
                            <dd>${scenarioformEscapeHtml(formName)}</dd>
                        </dl>
                `;

                if (
                    response.values &&
                    Array.isArray(response.values) &&
                    response.values.length > 0
                ) {

                    html += '<ul class="scenarioform-history-values">';

                    response.values.forEach(function(value) {

                        var label =
                            value.label ||
                            value.name ||
                            ('Champ #' + value.field_id);

                        var displayValue =
                            value.value !== null &&
                            value.value !== undefined
                                ? value.value
                                : '';

                        html += `
                            <li>
                                <strong>
                                    ${scenarioformEscapeHtml(label)}
                                </strong>
                                :
                                ${scenarioformEscapeHtml(displayValue)}
                            </li>
                        `;

                    });

                    html += '</ul>';

                } else {

                    html += `
                        <div>
                            Aucune valeur enregistrée
                        </div>
                    `;

                }

                html += '<div class="scenarioform-history-subtitle"><strong>Scénarios demandés</strong></div>';

                if (
                    Array.isArray(response.requested_scenarios) &&
                    response.requested_scenarios.length > 0
                ) {
                    html += '<ul>';
                    response.requested_scenarios.forEach(function(scenario) {
                        html += `
                            <li>${scenarioformEscapeHtml(scenario.name || ('Scénario #' + scenario.id))}</li>
                        `;
                    });
                    html += '</ul>';
                } else {
                    html += '<div>Information non disponible</div>';
                }

                html += '<div class="scenarioform-history-subtitle"><strong>Résultat du lancement</strong></div>';

                if (
                    Array.isArray(response.launch_results) &&
                    response.launch_results.length > 0
                ) {
                    html += '<ul>';
                    response.launch_results.forEach(function(launch) {
                        var launchName = launch.name || ('Scénario #' + launch.id);
                        var launchResult = launch.result === true
                            ? 'Succès'
                            : (launch.result === false ? 'Échec' : String(launch.result));
                        html += `
                            <li>
                                <strong>${scenarioformEscapeHtml(launchName)}</strong>
                                : ${scenarioformEscapeHtml(launchResult)}
                            </li>
                        `;
                    });
                    html += '</ul>';
                } else {
                    html += '<div>Information non disponible pour cette ancienne réponse</div>';
                }

                html += '<div class="scenarioform-history-subtitle"><strong>Résultat métier</strong></div>';

                if (Array.isArray(response.scenario_results) && response.scenario_results.length > 0) {
                    let statusLabels = {
                        pending: 'En attente',
                        accepted: 'Accepté',
                        rejected: 'Refusé',
                        warning: 'Terminé avec avertissement',
                        error: 'Erreur',
                        timeout: 'Aucun retour reçu — consultez le journal Jeedom du scénario',
                        not_expected: 'Scénario lancé — aucun retour attendu'
                    };
                    html += '<ul class="scenarioform-history-results">';
                    response.scenario_results.forEach(function(result) {
                        let resultStatus = result.status || 'pending';
                        let resultDuration = scenarioformHistoryDuration(response, result);
                        html += `
                            <li class="scenarioform-result-${scenarioformEscapeAttribute(resultStatus)}">
                                <strong>${scenarioformEscapeHtml(result.name || ('Scénario #' + result.scenario_id))}</strong>
                                : ${scenarioformEscapeHtml(statusLabels[resultStatus] || resultStatus)}
                                ${result.message ? ' — ' + scenarioformEscapeHtml(result.message) : ''}
                                <span class="scenarioform-history-duration"><i class="fas fa-clock"></i> ${scenarioformEscapeHtml(resultDuration)}</span>
                            </li>
                        `;
                    });
                    html += '</ul>';
                } else {
                    html += '<div>Retour métier non activé pour cette ancienne réponse</div>';
                }

                html += '</div></div>';

            });
            if (groupSortKey !== null && previousGroupKey !== null) html += '</div></div>';
        }

        $('#scenarioform-history-content').html(html);
        scenarioformApplyHistorySection();

        if (scenarioformHistoryPendingOpenId !== null) {
            let responseId = scenarioformHistoryPendingOpenId;
            scenarioformHistoryPendingOpenId = null;
            let details = $('.scenarioform-history-details[data-response-id="' + responseId + '"]');
            let item = $('.scenarioform-history-item[data-response-id="' + responseId + '"]');
            details.prop('hidden', false);
            let parentGroup = item.closest('.scenarioform-history-group');
            if (parentGroup.length) {
                parentGroup.find('> .scenarioform-history-group-items').prop('hidden', false);
                parentGroup.find('> .scenarioform-history-group-header .scenarioform-history-group-toggle')
                    .attr('aria-expanded', 'true').html('<i class="fas fa-chevron-up"></i> Fermer');
            }
            item.find('.scenarioform-history-toggle').attr('aria-expanded', 'true')
                .html('<i class="fas fa-chevron-up"></i> Masquer');
            if (item.length > 0) item[0].scrollIntoView({behavior: 'smooth', block: 'center'});
        }

        let hasPendingResult = history.some(function(response) {
            return Array.isArray(response.scenario_results) &&
                response.scenario_results.some(function(result) {
                    return (result.status || 'pending') === 'pending';
                });
        });

        if (hasPendingResult && scenarioformViewMode === 'history') {
            scenarioformHistoryPollTimer = setTimeout(function() {
                if (scenarioformViewMode === 'history') {
                    loadFormHistory(formId, true);
                }
            }, 4000);
        }
    },

    error: function(xhr, status) {

        if (status === 'abort') {
            return;
        }

        $('#scenarioform-history-content').html(
            '<div class="alert alert-danger">' +
            'Erreur lors du chargement de l’historique.' +
            '</div>'
        );
    },

    complete: function() {
        scenarioformHistoryRequest = null;
    }
});
}

$(document).on('change.scenarioform', '#scenarioform-history-sort', function() {
    scenarioformHistorySort = String($(this).val() || 'newest');
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) {
        loadFormHistory(formId, true);
    }
});

$(document).on('click.scenarioform', '#bt_historyStats', function() {
    scenarioformHistorySection = 'stats';
    scenarioformApplyHistorySection();
    scenarioformLoadHistoryOverview();
});

$(document).on('click.scenarioform', '#bt_historyList', function() {
    scenarioformHistorySection = 'list';
    scenarioformApplyHistorySection();
});

$(document).on('change.scenarioform', '#scenarioform-history-status', function() {
    scenarioformHistoryStatus = $(this).val() || 'all';
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) loadFormHistory(formId, true);
});

$(document).on('input.scenarioform', '#scenarioform-history-search', function() {
    scenarioformHistorySearch = $(this).val() || '';
    if (scenarioformHistorySearchTimer) clearTimeout(scenarioformHistorySearchTimer);
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    scenarioformHistorySearchTimer = setTimeout(function() {
        scenarioformHistorySearchTimer = null;
        if (formId) loadFormHistory(formId, true);
    }, 250);
});

$(document).on('click.scenarioform', '#bt_exportFormHistory', function() {
    let history = $(this).data('history');
    if (Array.isArray(history) && history.length > 0) scenarioformExportHistoryCsv(history);
});

$(document).on('change.scenarioform', '#scenarioform-history-period', function() {
    scenarioformHistoryPeriod = $(this).val();
    $('.scenarioform-summary-custom-period').toggleClass('hidden', scenarioformHistoryPeriod !== 'custom');
    scenarioformHistoryFilter = 'all';
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) loadFormHistory(formId, true);
});

$(document).on('change.scenarioform', '#scenarioform-history-start, #scenarioform-history-end', function() {
    scenarioformHistoryCustomStart = $('#scenarioform-history-start').val() || '';
    scenarioformHistoryCustomEnd = $('#scenarioform-history-end').val() || '';
    scenarioformHistoryPeriod = 'custom';
    scenarioformHistoryFilter = 'all';
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) loadFormHistory(formId, true);
});

$(document).on('click.scenarioform', '.scenarioform-summary-metric', function() {
    scenarioformHistoryFilter = $(this).attr('data-filter') || 'all';
    scenarioformHistorySection = 'list';
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) loadFormHistory(formId, true);
});

$(document).on('click.scenarioform', '.scenarioform-summary-open', function() {
    scenarioformHistoryPendingOpenId = parseInt($(this).attr('data-response-id'), 10);
    scenarioformHistoryFilter = 'incident';
    scenarioformHistorySection = 'list';
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) loadFormHistory(formId, true);
});

$(document).on('click.scenarioform', '#bt_refreshFormHistory', function() {
    let formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);
    if (formId) {
        loadFormHistory(formId, false);
    }
});

$(document).on('click.scenarioform', '.scenarioform-history-group-toggle', function() {
    let group = $(this).closest('.scenarioform-history-group');
    let items = group.children('.scenarioform-history-group-items');
    let open = items.prop('hidden');
    items.prop('hidden', !open);
    $(this).attr('aria-expanded', open ? 'true' : 'false')
        .html('<i class="fas fa-chevron-' + (open ? 'up' : 'down') + '"></i> ' + (open ? 'Fermer' : 'Voir'));
});

$(document).on('click.scenarioform', '.scenarioform-history-toggle', function() {
    let responseId = $(this).attr('data-response-id');
    let details = $('.scenarioform-history-details[data-response-id="' + responseId + '"]');
    let expanded = details.prop('hidden');
    details.prop('hidden', !expanded);
    $(this).attr('aria-expanded', expanded ? 'true' : 'false')
        .html('<i class="fas fa-chevron-' + (expanded ? 'up' : 'down') + '"></i> ' +
            (expanded ? 'Masquer' : 'Détails'));
});

function scenarioformRenderDocument(document) {
    let html = '<div class="scenarioform-result-document">';
    html += '<h3>' + scenarioformEscapeHtml(document.title || 'Compte rendu') + '</h3>';
    if (document.scenario_name) html += '<p><strong>Scénario :</strong> ' + scenarioformEscapeHtml(document.scenario_name) + '</p>';
    if (document.event_at || document.created) html += '<p><strong>Date :</strong> ' + scenarioformEscapeHtml(document.event_at || document.created) + '</p>';
    if (document.summary) html += '<p class="lead">' + scenarioformEscapeHtml(document.summary) + '</p>';
    (Array.isArray(document.sections) ? document.sections : []).forEach(function(section) {
        if (!section || typeof section !== 'object') return;
        if (section.title) html += '<h4>' + scenarioformEscapeHtml(section.title) + '</h4>';
        if (section.type === 'table' && Array.isArray(section.headers) && Array.isArray(section.rows)) {
            html += '<div class="table-responsive"><table class="table table-condensed table-striped scenarioform-result-table"><thead><tr>';
            html += section.headers.map(function(header) {
                return '<th>' + scenarioformEscapeHtml(header) + '</th>';
            }).join('');
            html += '</tr></thead><tbody>';
            html += section.rows.map(function(row) {
                if (!Array.isArray(row)) return '';
                return '<tr>' + section.headers.map(function(header, index) {
                    return '<td>' + scenarioformEscapeHtml(row[index] === undefined || row[index] === null ? '' : row[index]) + '</td>';
                }).join('') + '</tr>';
            }).join('');
            html += '</tbody></table></div>';
            return;
        }
        let content = section.content;
        if (Array.isArray(content)) {
            html += '<ul>' + content.map(function(item) { return '<li>' + scenarioformEscapeHtml(item) + '</li>'; }).join('') + '</ul>';
        } else if (content && typeof content === 'object') {
            html += '<dl>' + Object.keys(content).map(function(key) {
                return '<dt>' + scenarioformEscapeHtml(key) + '</dt><dd>' + scenarioformEscapeHtml(content[key]) + '</dd>';
            }).join('') + '</dl>';
        } else if (content !== undefined && content !== null) {
            html += '<p>' + scenarioformEscapeHtml(content).replace(/\n/g, '<br>') + '</p>';
        }
    });
    return html + '</div>';
}

function scenarioformDocumentToTsv(document) {
    let tables = (Array.isArray(document.sections) ? document.sections : []).filter(function(section) {
        return section && section.type === 'table' &&
            Array.isArray(section.headers) && Array.isArray(section.rows);
    });
    return tables.map(function(section, tableIndex) {
        let lines = [];
        if (tables.length > 1 && section.title) {
            lines.push([section.title]);
        }
        lines.push(section.headers);
        section.rows.forEach(function(row) {
            lines.push(Array.isArray(row) ? row : []);
        });
        return lines.map(function(row) {
            return row.map(function(cell) {
                let value = cell === undefined || cell === null ? '' : String(cell);
                value = value.replace(/[\t\r\n]+/g, ' ').trim();
                if (/^[=+@]/.test(value) || (/^-/.test(value) && !/^-\d+(?:[.,]\d+)?$/.test(value))) {
                    value = "'" + value;
                }
                return value;
            }).join('\t');
        }).join('\n');
    }).join('\n\n');
}

function scenarioformCopyText(text, onSuccess, onError) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(function() {
            scenarioformCopyTextFallback(text, onSuccess, onError);
        });
        return;
    }
    scenarioformCopyTextFallback(text, onSuccess, onError);
}

function scenarioformCopyTextFallback(text, onSuccess, onError) {
    let textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        if (document.execCommand('copy')) onSuccess();
        else onError();
    } catch (error) {
        onError();
    }
    document.body.removeChild(textarea);
}

$(document).on('click.scenarioform', '.scenarioform-history-document', function() {
    let responseId = parseInt($(this).attr('data-response-id'), 10);
    let documentId = parseInt($(this).attr('data-document-id'), 10);
    let response = scenarioformHistory.find(function(item) { return parseInt(item.id, 10) === responseId; });
    let document = response && Array.isArray(response.documents)
        ? response.documents.find(function(item) { return parseInt(item.id, 10) === documentId; }) : null;
    if (!document) {
        return;
    }

    let tableText = scenarioformDocumentToTsv(document);
    let buttons = {};
    if (tableText !== '') {
        buttons.copy = {
            label: '<i class="fas fa-copy"></i> Copier pour tableur',
            className: 'btn-primary',
            callback: function() {
                scenarioformCopyText(tableText, function() {
                    jeedomUtils.showAlert({message: 'Données copiées. Vous pouvez les coller dans votre tableur.', level: 'success'});
                }, function() {
                    jeedomUtils.showAlert({message: 'La copie a été refusée par le navigateur.', level: 'danger'});
                });
                return false;
            }
        };
    }
    buttons.close = {
        label: 'Fermer',
        className: 'btn-default'
    };

    let dialog = bootbox.dialog({
        title: 'Compte rendu métier',
        message: scenarioformRenderDocument(document),
        size: 'large',
        closeButton: true,
        onEscape: true,
        buttons: buttons
    });

    dialog
        .off('click.scenarioformDocumentClose', '.bootbox-close-button')
        .on('click.scenarioformDocumentClose', '.bootbox-close-button', function(event) {
            event.preventDefault();
            dialog.modal('hide');
        })
        .on('hidden.bs.modal', function() {
            dialog.remove();
        });
});

$(document).on('click.scenarioform', '.scenarioform-history-remove', function() {
    var responseId = parseInt($(this).attr('data-response-id'), 10);
    var formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);

    if (!responseId || !formId) {
        return;
    }

    bootbox.confirm(
        'Supprimer définitivement la réponse #' + responseId + ' ? ' +
        'Ses valeurs et résultats associés seront également supprimés.',
        function(confirmed) {
        if (!confirmed) {
            return;
        }

        $.ajax({
            type: 'POST',
            url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
            data: {
                action: 'removeHistoryResponse',
                response_id: responseId,
                form_id: formId
            },
            dataType: 'json',
            success: function(data) {
                if (!data || data.state !== 'ok') {
                    jeedomUtils.showAlert({
                        message: data && data.result ? data.result : 'Erreur lors de la suppression',
                        level: 'danger'
                    });
                    return;
                }
                $('#bt_historyForm').trigger('click');
            },
            error: function() {
                jeedomUtils.showAlert({
                    message: 'Erreur technique lors de la suppression',
                    level: 'danger'
                });
            }
        });
        }
    );
});

$(document).on('click.scenarioform', '#bt_clearFormHistory', function() {
    var formId = parseInt($('#div_scenarioform-form').attr('data-form-id'), 10);

    if (!formId) {
        return;
    }

    bootbox.confirm(
        'Supprimer définitivement tout l’historique du formulaire « ' +
        scenarioformEscapeHtml($('.scenarioform-form-choice.active').attr('data-form-name') || ('#' + formId)) +
        ' » ? Toutes ses réponses, valeurs et résultats associés seront supprimés.',
        function(confirmed) {
            if (!confirmed) {
                return;
            }

            $.ajax({
                type: 'POST',
                url: 'plugins/scenarioform/core/ajax/scenarioform.ajax.php',
                data: {
                    action: 'clearFormHistory',
                    form_id: formId
                },
                dataType: 'json',
                success: function(data) {
                    if (!data || data.state !== 'ok') {
                        jeedomUtils.showAlert({
                            message: data && data.result ? data.result : 'Erreur lors de la purge',
                            level: 'danger'
                        });
                        return;
                    }
                    $('#bt_historyForm').trigger('click');
                },
                error: function() {
                    jeedomUtils.showAlert({
                        message: 'Erreur technique lors de la purge',
                        level: 'danger'
                    });
                }
            });
        }
    );
});

// ================MODIFIER UNE RÉPONSE HISTORIQUE===================
$(document).on('click.scenarioform', '.scenarioform-history-edit', function() {
    var responseId = parseInt($(this).attr('data-response-id'), 10);
    if (!responseId) return;
    scenarioformPendingEditResponseId = responseId;
    $('.scenarioform-history-reuse[data-response-id="' + responseId + '"]').trigger('click');
});

// ================REPRENDRE UNE RÉPONSE===================
 
$(document).on('click.scenarioform', '.scenarioform-history-reuse',
        function () {

            var responseId = parseInt(
                $(this).attr('data-response-id'),
                10
            );


            var response = scenarioformHistory.find(
                function(item) {

                    return parseInt(item.id, 10) === responseId;

                }
            );


            if (!response) {

                console.error(
                    'Réponse historique introuvable :',
                    responseId
                );

                return;
            }

            if ($('#scenarioform-execute-zone .scenarioform-entry-fields').length === 0) {
                scenarioformPendingReuseResponseId = responseId;
                let formId = $('#div_scenarioform-form').attr('data-form-id');
                showFormValues(formId, false);
                return;
            }


            /*
            * ==========================================
            * 1. RESET COMPLET DU FORMULAIRE ACTUEL
            * ==========================================
            *
            * Cela garantit notamment qu'un nouveau
            * champ booléen, qui n'existait pas dans
            * l'ancienne réponse, reste décoché.
            */

            $('#div_scenarioform-form')
                .find('input, textarea, select')
                .each(function() {

                    var field = $(this);

                    if (field.attr('type') === 'checkbox') {

                        field
                            .prop('checked', false)
                            .trigger('change');

                    } else {

                        field
                            .val('')
                            .trigger('change');

                    }

                });


            /*
            * ==========================================
            * 2. APPLICATION DES VALEURS HISTORIQUES
            * ==========================================
            */

            if (
                !response.values ||
                !Array.isArray(response.values)
            ) {

                console.warn(
                    'La réponse ne contient aucune valeur :',
                    response
                );

                $('#scenarioform-history-zone')
                    .hide();

                scenarioformViewMode = 'entry';

                return;
            }


            response.values.forEach(
                function(value) {


                    /*
                    * Nom du champ obligatoire
                    */

                    if (
                        value.name === null ||
                        value.name === undefined ||
                        value.name === ''
                    ) {

                        console.warn(
                            'Nom de champ absent :',
                            value
                        );

                        return;
                    }


                    /*
                    * Recherche dans le formulaire
                    * ACTUEL.
                    */

                    var field = $(
                        '#div_scenarioform-form [name="' +
                        value.name.replace(/"/g, '\\"') +
                        '"]'
                    );


                    /*
                    * Le champ historique n'existe plus
                    * dans le formulaire actuel.
                    *
                    * On l'ignore.
                    */

                    if (!field.length) {

                        console.warn(
                            'Champ historique absent du formulaire actuel :',
                            value.name,
                            value
                        );

                        return;
                    }


                    var fieldType =
                        field.attr('type') ||
                        'text';


                    /*
                    * ==================================
                    * BOOLEAN
                    * ==================================
                    */

                    if (fieldType === 'checkbox') {

                        var checked = false;


                        if (
                            value.value === true ||
                            value.value === 1 ||
                            value.value === '1' ||
                            value.value === 'true' ||
                            value.value === 'on' ||
                            value.value === 'yes' ||
                            value.value === 'oui'
                        ) {

                            checked = true;

                        }


                        field
                            .prop(
                                'checked',
                                checked
                            )
                            .trigger('change');


                        return;
                    }


                    /*
                    * ==================================
                    * AUTRES TYPES
                    * ==================================
                    */

                    var displayValue =
                        value.value !== null &&
                        value.value !== undefined
                            ? value.value
                            : '';


                    field
                        .val(displayValue)
                        .trigger('change');


                }
            );


            /*
            * Masquer l'historique
            */

            $('#scenarioform-history-zone')
                .hide();

            scenarioformViewMode = 'entry';
            if (scenarioformPendingEditResponseId === responseId) {
                $('#bt_executeForm').attr('data-edit-response-id', responseId)
                    .html('<i class="fas fa-save"></i> Enregistrer la modification');
                scenarioformPendingEditResponseId = null;
            }
            if (scenarioformHistoryPollTimer) {
                clearTimeout(scenarioformHistoryPollTimer);
                scenarioformHistoryPollTimer = null;
            }

            let entryHeader = document.querySelector('.scenarioform-entry-header');
            if (entryHeader) {
                entryHeader.scrollIntoView({behavior: 'smooth', block: 'start'});
            }


        }
);

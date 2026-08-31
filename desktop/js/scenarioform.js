"use strict";

var scenarioformViewMode = 'idle';
var scenarioformValuesRequest = null;
var scenarioformHistoryRequest = null;
var scenarioformHistoryPollTimer = null;
var scenarioformResultRequest = null;
var scenarioformResultPollTimer = null;
var scenarioformPendingReuseResponseId = null;

//
//        RESET ECRAN SCENARIOFORM
// 

function resetScenarioFormScreen() {

    scenarioformViewMode = 'idle';
    scenarioformPendingReuseResponseId = null;

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

        },

        error: function(xhr, status, error) {


        }
    });

}



function loadRequestDetail(id, selectedFormId) {

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
                             role="button" tabindex="0" draggable="true"
                             data-form-id="${form.id}"
                             data-form-name="${scenarioformEscapeHtml(form.name)}">
                            <span class="scenarioform-form-choice-main">
                                <i class="fas fa-grip-vertical scenarioform-form-drag-handle"
                                   aria-hidden="true" title="Déplacer"></i>
                                <strong>${scenarioformEscapeHtml(form.name)}</strong>
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
        .filter('[data-form-id="' + parseInt(formId, 10) + '"]')
        .addClass('active');

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


                    <button class="btn btn-primary btn-sm"
                            id="bt_addField">

                        <i class="fas fa-plus"></i>
                        Ajouter un champ

                    </button>
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
            loadFieldList(form.id);



        },


        error:function(xhr)
        {


        }

});

}

$(document).on('click', '#bt_createScenarioTemplate', function() {
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
    
function showFormValues(formId, openHistory)
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

                form_id: formId

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


                let fields =
                    data.result;


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
                    <h4>

                        <i class="fas fa-edit"></i>

                        Valeurs à saisir

                    </h4>
                    <p>Renseignez les informations nécessaires avant l’exécution.</p>
                    </div>
                    <div class="scenarioform-entry-fields">

                `;


                if (fields.length === 0) {

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

                                                    ${validationAttributes}

                                                    value="1"

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
                                            ${validationAttributes}
                                            ${placeholderAttribute}
                                            ${constraintAttributes}></textarea>
                                    </div>
                                `;

                            } else if (field.type === 'select') {

                                let optionsHtml = isRequired
                                    ? '<option value="">— Sélectionner —</option>'
                                    : '<option value="">— Aucun choix —</option>';

                                (configuration.options || []).forEach(function(option) {
                                    let escapedOption = scenarioformEscapeHtml(option);
                                    optionsHtml += '<option value="' + escapedOption + '">' +
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
                                            ${validationAttributes}
                                            ${isRequired ? 'required' : ''}>${optionsHtml}</select>
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

                                            ${validationAttributes}

                                            ${isRequired ? 'required' : ''}

                                            ${placeholderAttribute}

                                            ${constraintAttributes}

                                        >

                                    </div>

                                `;

                            }

                        }
                    );


                    /*
                    * ==========================================
                    * BOUTONS
                    * ==========================================
                    */

                    html += `

                        </div>

                        <div class="scenarioform-entry-actions">
                        <button
                            class="btn btn-success"
                            id="bt_executeForm">

                            <i class="fas fa-play"></i>

                            Valider et exécuter

                        </button>

                        <button
                            class="btn btn-default btn-sm"
                            id="bt_backExecuteForm">

                            <i class="fas fa-arrow-left"></i>
                            Retour
                        </button>
                        </div>

                    `;

                }

                html += '</div>';


                /*
                * ==========================================
                * INJECTION
                * ==========================================
                */

                $('#scenarioform-execute-zone')
                    .html(html);

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
    available.forEach(function(item) {
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
            <div id="scenarioform-form-scenario-order" class="list-group">
    `;

    ordered.forEach(function(item) {
        let checked = selectedIds.indexOf(String(item.id)) !== -1;
        let selectedItem = selectedById[String(item.id)] || {};
        let expectResult = selectedItem.expect_result !== false;
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
            loadRequestDetail(requestId, savedFormId);

        },


        error:function(xhr){


        }

    });

}

function loadFieldEdit(fieldId, formId)
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
            comparisonFieldId: comparisonFieldId,
            comparisonOperator: comparisonOperator,
            comparisonMessage: $('#edit_field_comparison_message').val()
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

function loadFieldList(formId)
{
    $.ajax({

        type:'POST',

        url:'plugins/scenarioform/core/ajax/scenarioform.ajax.php',

        data:{
            action:'getFieldList',
            form_id:formId
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

$(document).on('click', '#bt_scenarioformAssistant', function() {
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

$(document).on('click', '#bt_createRequest',
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

$(document).on('click', '#bt_cancelCreateRequest',
    function (e) {

        e.preventDefault();



        resetScenarioFormScreen();

        loadRequestList();

    }
);

$(document).on('click', '#bt_editRequest',
    function () {

    let requestId = $('#div_scenarioformEdition')
        .data('request-id');

    $('#div_scenarioform-form').hide();

    $('#scenarioform-request-edit').show();

    editRequest(requestId);

});

$(document).on('click', '#bt_saveRequest',
    function(){

        saveRequest();

    }
);

$(document).on('click', '#bt_backRequest', 
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

$(document).on('click', '#bt_removeRequest',
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

$(document).on('click', '#bt_backScenarioForm',
    function () {

        resetScenarioFormScreen();

        loadRequestList();

    }
);
//
// =======================   Variable   =========================
// 

$(document).on('click', '.scenarioform-request',
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

$(document).on('click', '#bt_createForm',
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

$(document).on('click', '.scenarioform-form-choice', function() {
    let requestId = $('#div_scenarioformEdition').data('request-id');
    let formId = parseInt($(this).attr('data-form-id'), 10);
    $('.scenarioform-form-choice').removeClass('active');
    $(this).addClass('active');
    loadRequestForm(requestId, formId);
});

$(document).on('keydown', '.scenarioform-form-choice', function(event) {
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

$(document).on('click', '.bt_form_up, .bt_form_down', function(event) {
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

let scenarioformDraggedForm = null;
$(document).on('dragstart', '.scenarioform-form-choice', function(event) {
    scenarioformDraggedForm = this;
    event.originalEvent.dataTransfer.effectAllowed = 'move';
    $(this).addClass('is-dragging');
});
$(document).on('dragover', '.scenarioform-form-choice', function(event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
});
$(document).on('drop', '.scenarioform-form-choice', function(event) {
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
$(document).on('dragend', '.scenarioform-form-choice', function() {
    $(this).removeClass('is-dragging');
    scenarioformDraggedForm = null;
});

$(document).on('click', '.bt_scenario_up', function() {
    let item = $(this).closest('.scenarioform-scenario-order-item');
    let previous = item.prev('.scenarioform-scenario-order-item');
    if (previous.length) {
        item.insertBefore(previous);
    }
});

$(document).on('click', '.bt_scenario_down', function() {
    let item = $(this).closest('.scenarioform-scenario-order-item');
    let next = item.next('.scenarioform-scenario-order-item');
    if (next.length) {
        item.insertAfter(next);
    }
});

let scenarioformDraggedScenario = null;
$(document).on('dragstart', '.scenarioform-scenario-order-item', function(event) {
    scenarioformDraggedScenario = this;
    event.originalEvent.dataTransfer.effectAllowed = 'move';
});
$(document).on('dragover', '.scenarioform-scenario-order-item', function(event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'move';
});
$(document).on('drop', '.scenarioform-scenario-order-item', function(event) {
    event.preventDefault();
    if (scenarioformDraggedScenario && scenarioformDraggedScenario !== this) {
        $(scenarioformDraggedScenario).insertBefore(this);
    }
    scenarioformDraggedScenario = null;
});
 
$(document).on('click', '#bt_editForm',
    function(){

        let formId =
            $('#div_scenarioform-form')
            .attr('data-form-id');


        loadFormEdit(formId);

    }
);

$(document).on('click', '#bt_backForm',
    function(){

        let requestId =
            $('#div_scenarioformEdition')
            .data('request-id');

         loadRequestDetail(requestId); // loadRequestForm(requestId);

    }
);

$(document).on('click', '#bt_saveForm',
    function(){

        saveForm();

    }
);

$(document).on('click', '#bt_removeForm',
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

$(document).on('click', '#bt_addField',
function(){

    let formId =
        $('#div_scenarioform-form')
        .attr('data-form-id');


    loadFieldEdit(
        null,
        formId
    );

});

$(document).on('click', '#bt_enterFormValues',
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

$(document).on('click', '#bt_toggleMobileManagement',
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

$(document).on('click', '#bt_manageFields',
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


$(document).on('click', '#bt_executeForm',
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

                    action:
                        'executeForm',

                    form_id:
                        formId,

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

                        let message = `

                            <div class="alert alert-success">

                                <i class="fas fa-check-circle"></i>

                                <strong>
                                    Formulaire validé et scénario(s) exécuté(s)
                                </strong>

                            </div>

                        `;


                        if (
                            data.result &&
                            data.result.launched
                        ) {

                            data.result.launched
                                .forEach(
                                    function(scenario)
                                    {

                                        message += `

                                            <div
                                                class="alert alert-info">

                                                <i class="fas fa-play"></i>

                                                Scénario lancé :

                                                <strong>
                                                    ${scenarioformEscapeHtml(scenario.name)}
                                                </strong>

                                            </div>

                                        `;

                                    }
                                );

                        }

                        message += `
                            <div
                                id="scenarioform-live-results"
                                class="scenarioform-live-results"
                                aria-live="polite">
                            </div>
                            <div class="scenarioform-entry-actions scenarioform-result-actions">
                                <button type="button"
                                        class="btn btn-success"
                                        id="bt_newEntryAfterExecution"
                                        data-form-id="${parseInt(formId, 10)}">
                                    <i class="fas fa-keyboard"></i>
                                    Nouvelle saisie
                                </button>
                                <button type="button"
                                        class="btn btn-default"
                                        id="bt_historyAfterExecution"
                                        data-form-id="${parseInt(formId, 10)}">
                                    <i class="fas fa-history"></i>
                                    Voir l’historique
                                </button>
                            </div>
                        `;


                        /*
                        * Ici seulement, on remplace
                        * la zone de saisie.
                        */

                        $('#scenarioform-execute-zone')
                            .html(message);

                        let hasPendingResult = scenarioformRenderLiveResults(
                            data.result.scenario_results || []
                        );
                        if (hasPendingResult) {
                            scenarioformStartResultPolling(
                                formId,
                                data.result.response_id
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
                            executeButton
                                .prop('disabled', false)
                                .html(
                                    '<i class="fas fa-play"></i> Valider et exécuter'
                                );
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

$(document).on('click', '#bt_newEntryAfterExecution', function() {
    let formId = parseInt($(this).attr('data-form-id'), 10);
    scenarioformStopResultPolling();
    if (formId) {
        showFormValues(formId, false);
    }
});

$(document).on('click', '#bt_historyAfterExecution', function() {
    let formId = parseInt($(this).attr('data-form-id'), 10);
    scenarioformStopResultPolling();
    if (formId) {
        showFormHistory(formId);
    }
});

$(document).on('click', '#bt_backExecuteForm',
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
    let html = '<div class="scenarioform-live-results-title"><strong>Résultat du traitement</strong></div>';

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

function showFormHistory(formId) {
    scenarioformViewMode = 'history';

    if (scenarioformValuesRequest) {
        scenarioformValuesRequest.abort();
        scenarioformValuesRequest = null;
    }

    $('#scenarioform-fields-management').hide();
    $('#scenarioform-execute-zone').html(`
        <div id="scenarioform-history-zone" class="scenarioform-entry-card">
            <div class="scenarioform-entry-header scenarioform-history-header">
                <div>
                    <h4><i class="fas fa-history"></i> Historique des requêtes</h4>
                    <p>Consultez, reprenez ou supprimez les réponses enregistrées.</p>
                </div>
                <button type="button" class="btn btn-default btn-sm" id="bt_backHistoryToEntry">
                    <i class="fas fa-keyboard"></i> Revenir à la saisie
                </button>
            </div>
            <div id="scenarioform-history-content"></div>
        </div>
    `);

    loadFormHistory(formId);
}

$(document).on('click', '#bt_historyForm', 
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

$(document).on('click', '#bt_backHistoryToEntry', function() {
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
        form_id: formId
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

        var html = '';

        if (history.length === 0) {

            html = '<p>Aucune requête enregistrée.</p>';

        } else {

            html += `
                <div class="scenarioform-history-toolbar">
                    <span>${history.length} réponse${history.length > 1 ? 's' : ''}</span>
                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        id="bt_clearFormHistory">
                        <i class="fas fa-trash"></i>
                        Vider l’historique de ce formulaire
                    </button>
                </div>
            `;

            history.forEach(function(response) {

                var requestName = response.request && response.request.name
                    ? response.request.name
                    : 'Requête non disponible';
                var formName = response.form && response.form.name
                    ? response.form.name
                    : 'Formulaire non disponible';

                html += `
                    <div class="scenarioform-history-item">

                        <div class="scenarioform-history-item-header">
                            <strong>Réponse #${response.id}</strong>
                            <time>${scenarioformEscapeHtml(response.created || '')}</time>
                        </div>

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
                        html += `
                            <li class="scenarioform-result-${scenarioformEscapeAttribute(resultStatus)}">
                                <strong>${scenarioformEscapeHtml(result.name || ('Scénario #' + result.scenario_id))}</strong>
                                : ${scenarioformEscapeHtml(statusLabels[resultStatus] || resultStatus)}
                                ${result.message ? ' — ' + scenarioformEscapeHtml(result.message) : ''}
                            </li>
                        `;
                    });
                    html += '</ul>';
                } else {
                    html += '<div>Retour métier non activé pour cette ancienne réponse</div>';
                }

                html += `
                        <div class="scenarioform-history-actions">

                            <button
                                type="button"
                                class="btn btn-warning btn-sm scenarioform-history-reuse"
                                data-response-id="${response.id}"
                            >
                                <i class="fas fa-edit"></i>
                                Reprendre
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger btn-sm scenarioform-history-remove"
                                data-response-id="${response.id}"
                            >
                                <i class="fas fa-trash"></i>
                                Supprimer
                            </button>

                        </div>

                    </div>

                `;

            });
        }

        $('#scenarioform-history-content').html(html);

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

$(document).on('click', '.scenarioform-history-remove', function() {
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

$(document).on('click', '#bt_clearFormHistory', function() {
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

// ================REPRENDRE UNE RÉPONSE===================
 
$(document).on('click', '.scenarioform-history-reuse',
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
            if (scenarioformHistoryPollTimer) {
                clearTimeout(scenarioformHistoryPollTimer);
                scenarioformHistoryPollTimer = null;
            }


        }
);

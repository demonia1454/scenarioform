"use strict";

// Construction du tableau des champs, sans événements ni accès au DOM.
function scenarioformBuildFieldsTable(fields) {
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

    return html;
}

// Événements délégués du tableau des champs (liaisons idempotentes).
function scenarioformBindFieldsTableEvents() {
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

// Événements du formulaire d'édition d'un champ (R122 étape 10).
// Les sélecteurs, la désinscription préalable et les appels existants sont conservés.
function scenarioformBindFieldEditorEvents(formId) {
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
}

// Affichage et chargement de la liste des champs (R122 étape 11).
function renderFields(fields) {
    $('#scenarioform-fields-list').html(scenarioformBuildFieldsTable(fields));
    scenarioformBindFieldsTableEvents();
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


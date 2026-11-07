"use strict";

// Gestion de l’éditeur des scénarios associés aux formulaires.
// Fonctions globales conservées pour compatibilité avec le fichier principal.

function renderFormScenarioEditor(available, selected)
{
    available = Array.isArray(available) ? available : [];
    selected = Array.isArray(selected) ? selected : [];
    const selectedItem = selected.length === 1 ? selected[0] : null;
    const selectedId = selectedItem ? String(selectedItem.id) : '';
    const ordered = available.slice().sort(function(a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''), 'fr', {sensitivity: 'base'});
    });
    let html = '<div class="form-group"><label for="scenarioform-main-scenario">Scénario associé</label>';
    html += '<p class="help-block">Un formulaire est associé à un seul scénario. Celui-ci peut lancer d’autres scénarios Jeedom.</p>';
    if (selected.length > 1) {
        html += '<div class="alert alert-warning">Ce formulaire possède plusieurs scénarios. Sélectionnez le scénario associé avant d’enregistrer. Les champs des autres scénarios doivent être traités séparément.</div>';
    }
    html += '<select id="scenarioform-main-scenario" class="form-control" data-confirmed-id="' + selectedId + '">';
    html += '<option value="">— Aucun scénario (formulaire en préparation) —</option>';
    ordered.forEach(function(item) {
        const id = parseInt(item.id, 10);
        html += '<option value="' + id + '"' + (String(id) === selectedId ? ' selected' : '') + '>' + scenarioformEscapeHtml(item.name) + '</option>';
    });
    html += '</select>';
    html += '<button type="button" class="btn btn-default" id="bt_confirmFormScenario" disabled>Valider le scénario</button>';
    html += '<label class="scenarioform-scenario-return-option"><input type="checkbox" id="scenarioform-main-expect-result" ' +
        (selectedItem && !(['0', 'false', ''].includes(String(selectedItem.expect_result).toLowerCase()) || selectedItem.expect_result === false) ? 'checked' : '') +
        '> Attendre un retour métier</label>';
    return html + '</div>';
}

function collectFormScenarioIds()
{
    const id = parseInt($('#scenarioform-main-scenario').attr('data-confirmed-id'), 10);
    return id > 0 ? [{
        id: id,
        expect_result: $('#scenarioform-main-expect-result').prop('checked') ? 1 : 0
    }] : [];
}

// Lecture de la configuration du formulaire, sans transformation des valeurs.
// Les clés et les sélecteurs restent identiques à ceux de saveForm() en R122 étape 4.
function scenarioformCollectFormSaveData(formId, action)
{
    return {
        action: action,
        id: formId,
        request_id: $('#div_scenarioformEdition').data('request-id'),
        name: $('#edit_form_name').val(),
        description: $('#edit_form_description').val(),
        history_title_field_id: $('#edit_form_history_title_field').val() || 0,
        scenarios: collectFormScenarioIds()
    };
}

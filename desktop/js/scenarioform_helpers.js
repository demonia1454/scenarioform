"use strict";

// Utilitaires d’affichage et de configuration des champs.
// API globale conservée pour compatibilité avec scenarioform.js.

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


// Point d'entrée unique pour les échanges AJAX ScenarioForm.
// Les options et les callbacks jQuery sont transmis sans transformation.
// Une étape ultérieure pourra harmoniser les erreurs après tests d'intégration.
function scenarioformAjax(options)
{
    return $.ajax(options);
}

// Fabrique de callback d'erreur réseau pour les opérations d'administration.
// Conserve le message et le niveau d'alerte propres à chaque appel.
function scenarioformAjaxAlertError(message)
{
    return function() {
        jeedomUtils.showAlert({message: message, level: 'danger'});
    };
}

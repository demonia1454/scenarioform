<?php

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
include_file('core', 'authentification', 'php');

// Ne pas dépendre de l'ordre d'autoload de Jeedom juste après l'installation.
// Certaines versions ne découvrent pas encore les classes du plugin lors du
// premier affichage, ce qui provoque notamment "scenarioformRequest not found".
$scenarioformClassDirectory = dirname(__FILE__) . '/../class/';
foreach ([
    'scenarioformRequest',
    'scenarioformRequestScenario',
    'scenarioformForm',
    'scenarioformFormScenario',
    'scenarioformField',
    'scenarioformResponse',
    'scenarioformResponseValue',
    'scenarioform'
] as $scenarioformClassName) {
    require_once $scenarioformClassDirectory . $scenarioformClassName . '.class.php';
}



if (!isConnect()) {
    ajax::error('{{401 - Accès non autorisé}}');
}

$scenarioformAdminActions = [
    'getFormDetail', 'getScenarioList', 'createScenarioTemplate', 'createGuidedExample',
    'saveRequest', 'createRequest', 'removeRequest', 'reorderForms',
    'reorderFormScenarios', 'createForm', 'saveForm', 'removeForm',
    'getField', 'saveField', 'addSelectOption', 'removeField', 'copyScenarioFields'
];
$scenarioformAction = (string) ($_REQUEST['action'] ?? '');
if (in_array($scenarioformAction, $scenarioformAdminActions, true) && !isConnect('admin')) {
    ajax::error('{{401 - Accès administrateur requis}}');
    return;
}

function scenarioformCurrentUserId(): int
{
    $user = $_SESSION['user'] ?? null;
    return is_object($user) && method_exists($user, 'getId') ? intval($user->getId()) : 0;
}

/**
 * Recharge l'utilisateur afin que les droits modifiés par un administrateur
 * soient pris en compte sans dépendre de l'objet conservé dans la session.
 */
function scenarioformCurrentUser()
{
    $sessionUser = $_SESSION['user'] ?? null;
    $userId = scenarioformCurrentUserId();
    if ($userId > 0 && method_exists('user', 'byId')) {
        $freshUser = user::byId($userId);
        if (is_object($freshUser)) {
            return $freshUser;
        }
    }
    return is_object($sessionUser) ? $sessionUser : null;
}

function scenarioformScenarioCanExecute($scenario): bool
{
    if (!is_object($scenario) || !method_exists($scenario, 'hasRight')) {
        return false;
    }

    $currentUser = scenarioformCurrentUser();

    // Jeedom enregistre les droits de scénario sous la clé scenario<ID>.
    // La lecture directe évite les différences de contexte rencontrées avec
    // hasRight() depuis certains panels de plugins, sans élargir le droit :
    // la lettre x doit être réellement présente dans la valeur enregistrée.
    if (
        $currentUser !== null &&
        method_exists($currentUser, 'getRights') &&
        method_exists($scenario, 'getId')
    ) {
        $storedRights = (string) $currentUser->getRights(
            'scenario' . intval($scenario->getId()),
            ''
        );
        if (strpos($storedRights, 'x') !== false) {
            return true;
        }
    }

    $hasRightMethod = new ReflectionMethod($scenario, 'hasRight');
    if ($currentUser !== null && $hasRightMethod->getNumberOfParameters() >= 2) {
        return (bool) $scenario->hasRight('x', $currentUser);
    }

    return (bool) $scenario->hasRight('x');
}

function scenarioformCanReadResponseConfiguration(array $configuration): bool
{
    if (isConnect('admin')) {
        return true;
    }
    $ownerId = intval($configuration['history']['submitted_by']['id'] ?? 0);
    return $ownerId > 0 && $ownerId === scenarioformCurrentUserId();
}
/*
log::add(
    'scenarioform',
    'error',
    'ACTION RECUE = ' . ($_REQUEST['action'] ?? 'AUCUNE')
);
*/

switch ($_REQUEST['action'] ?? '') {

case 'getRequestList':

    try {

        include_file(
            'core',
            'scenarioformRequest',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');

        include_file('core', 'scenarioformForm', 'class', 'scenarioform');

        $requests = [];


        foreach (scenarioformRequest::all() as $request) {

            if (!isConnect('admin') && !$request->getIsEnable()) {
                continue;
            }


            $forms = [];
            foreach (scenarioformForm::allByRequest($request->getId()) as $form) {
                if (!isConnect('admin') && !$form->getIsEnable()) {
                    continue;
                }
                $forms[] = [
                    'id' => $form->getId(),
                    'name' => $form->getName(),
                    'displayOrder' => $form->getDisplayOrder(),
                    'scenarioCount' => count($form->getScenarioLinks())
                ];
            }

		$requests[] = [
    		    'id'           => $request->getId(),
    		    'name'         => $request->getName(),
    		    'description'  => $request->getDescription(),
    		    'displayOrder' => $request->getDisplayOrder(),
    		    'isEnable'     => $request->getIsEnable(),
    		    'forms'        => $forms
		];

        }


        ajax::success($requests);


    } catch (Throwable $e) {

        ajax::error($e->getMessage());

    }

break;

case 'getForm':

    try {

        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformField',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');


        $requestId = intval(
            init('id')
        );


        if (empty($requestId)) {

            ajax::error(
                'ID requête manquant'
            );
            return;
        }


        $formId = intval(init('form_id'));
        $form = $formId > 0
            ? scenarioformForm::byId($formId)
            : scenarioformForm::byRequest($requestId);


        if ($form === null) {

            ajax::error(
                'Aucun formulaire associé'
            );

            return;
        }

        $formRequest = $form->getRequest();
        if (!isConnect('admin') && (
            !$form->getIsEnable() ||
            $formRequest === null ||
            !$formRequest->getIsEnable()
        )) {
            throw new Exception('Ce formulaire n’est pas disponible');
        }

        if ($form->getRequestId() !== $requestId) {
            ajax::error('Ce formulaire n’appartient pas à la requête');
            return;
        }


        $fields = [];


        foreach ($form->getFields() as $field) {

            $fields[] = [

                'id'            => $field->getId(),

                'name'          => $field->getName(),

                'label'         => $field->getLabel(),

                'type'          => $field->getType(),

                'configuration' => $field->getConfiguration(),

                'tag'           => $field->getTag(),
                'required'      => $field->getRequired()

            ];
        }


        $scenarios = [];
        foreach ($form->getScenarioLinks() as $link) {
            $scenario = $link->getScenario();
            if ($scenario === null || !$scenario->getIsActive()) {
                continue;
            }
            $scenarios[] = [
                'id' => $scenario->getId(),
                'name' => $scenario->getName(),
                'expect_result' => $link->getExpectResult(),
                'edit_url' => isConnect('admin')
                    ? 'index.php?v=d&p=scenario&id=' . intval($scenario->getId())
                    : null
            ];
        }

        // La gestion des champs doit aussi voir les scénarios associés mais
        // désactivés : ils restent des sources de copie valides.
        $fieldScenarios = [];
        foreach (scenarioformFormScenario::allByForm(intval($form->getId()), false) as $link) {
            $scenario = $link->getScenario();
            if ($scenario === null) {
                continue;
            }
            $fieldScenarios[] = [
                'id' => $scenario->getId(),
                'name' => $scenario->getName(),
                'active' => (bool) $scenario->getIsActive(),
                'associated' => (bool) $link->getIsEnable()
            ];
        }

        $copySources = [];
        foreach (scenarioformForm::allByRequest(intval($form->getRequestId())) as $sourceForm) {
            if (intval($sourceForm->getId()) === intval($form->getId())) {
                continue;
            }
            $sourceLinks = scenarioformFormScenario::allByForm(intval($sourceForm->getId()), false);
            foreach ($sourceLinks as $sourceLink) {
                $sourceScenario = $sourceLink->getScenario();
                if ($sourceScenario === null) {
                    continue;
                }
                $sourceFields = scenarioformField::allByFormScenario(
                    intval($sourceForm->getId()),
                    intval($sourceScenario->getId())
                );
                // Compatibilité avec les champs créés avant leur rattachement
                // explicite au scénario (scenario_id NULL).
                if (count($sourceFields) === 0 && count($sourceLinks) === 1) {
                    $sourceFields = scenarioformField::allByForm(intval($sourceForm->getId()));
                }
                $sourceFieldCount = count($sourceFields);
                if ($sourceFieldCount === 0) {
                    continue;
                }
                $copySources[] = [
                    'form_id' => $sourceForm->getId(),
                    'form_name' => $sourceForm->getName(),
                    'scenario_id' => $sourceScenario->getId(),
                    'scenario_name' => $sourceScenario->getName(),
                    'field_count' => $sourceFieldCount
                ];
            }
        }

        ajax::success([

            'id'          => $form->getId(),

            'name'        => $form->getName(),

            'description' => $form->getDescription(),

            'fields'      => $fields,
            'scenarios'   => $scenarios,
            'field_scenarios' => $fieldScenarios,
            'copy_sources' => $copySources,
            'can_edit_scenarios' => isConnect('admin')

        ]);


    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'getFormDetail':

    try {

        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');
        include_file('core', 'scenarioform', 'class', 'scenarioform');


        $formId = intval(init('id'));


        if (!$formId) {

            ajax::error(
                'ID formulaire manquant'
            );
            return;

        }


        $form = scenarioformForm::byId(
            $formId
        );


        if ($form === null) {

            ajax::error(
                'Formulaire introuvable'
            );
            return;

        }


        $scenarios = [];
        foreach ($form->getScenarioLinks() as $link) {
            $scenario = $link->getScenario();
            if ($scenario === null || !$scenario->getIsActive()) {
                continue;
            }
            $scenarios[] = [
                'id' => $scenario->getId(),
                'name' => $scenario->getName(),
                'expect_result' => $link->getExpectResult(),
                'edit_url' => isConnect('admin')
                    ? 'index.php?v=d&p=scenario&id=' . intval($scenario->getId())
                    : null
            ];
        }

        ajax::success([

            'id'            => $form->getId(),
            'name'          => $form->getName(),
            'description'   => $form->getDescription(),
            'isEnable'      => $form->getIsEnable(),
            'displayOrder'  => $form->getDisplayOrder(),
            'request_id'    => $form->getRequestId(),
            'scenarios'     => $scenarios,
            'scenariosAvailable' => scenarioform::getScenarioList(),
            'fields'        => array_map(function ($field) {
                return [
                    'id' => $field->getId(),
                    'label' => $field->getLabel(),
                    'name' => $field->getName()
                ];
            }, $form->getFields()),
            'history_title_field_id' => intval($form->getConfiguration('history_title_field_id', 0)),
            'can_edit_scenarios' => isConnect('admin')

        ]);


    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'executeForm':

    try {

        include_file(
            'core',
            'scenarioformResponse',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformResponseValue',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformField',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformRequest',
            'class',
            'scenarioform'
        );


        /*
        * ==========================================
        * RÉCUPÉRATION DU FORMULAIRE
        * ==========================================
        */

        $formId = intval(
            init('form_id')
        );

        if (empty($formId)) {

            ajax::error(
                'Formulaire manquant'
            );

            return;
        }

        $scenarioId = intval(init('scenario_id'));
        $scenarioLink = $scenarioId > 0
            ? scenarioformFormScenario::byFormScenario($formId, $scenarioId)
            : null;
        $selectedScenario = $scenarioLink === null ? null : $scenarioLink->getScenario();
        if ($selectedScenario === null || !$selectedScenario->getIsActive()) {
            ajax::error('Choisissez un scénario actif de ce formulaire');
            return;
        }


        $form = scenarioformForm::byId(
            $formId
        );

        if ($form === null) {

            ajax::error(
                'Formulaire introuvable : ' . $formId
            );

            return;
        }

        $formRequest = $form->getRequest();
        if (!isConnect('admin') && (
            !$form->getIsEnable() ||
            $formRequest === null ||
            !$formRequest->getIsEnable()
        )) {
            throw new Exception('Ce formulaire n’est pas disponible');
        }


        /*
        * ==========================================
        * RÉCUPÉRATION DES VALEURS
        * ==========================================
        */

        $values = json_decode(
            init('values'),
            true
        );

        if (!is_array($values)) {

            ajax::error(
                'Valeurs formulaire invalides'
            );

            return;
        }


                
        /*
        * ==========================================
        * VALIDATION DES CHAMPS
        * ==========================================
        *
        * required = 1 :
        *   - le champ doit être présent
        *   - une valeur doit être renseignée
        *
        * required = 0 :
        *   - le champ peut être absent
        *   - une valeur vide est acceptée
        *   - si une valeur est renseignée,
        *     elle est néanmoins validée selon son type
        *
        * Un booléen facultatif absent ou décoché vaut 0.
        * Un booléen requis doit être coché.
        */

        $formFields = scenarioformField::allByFormScenario($formId, $scenarioId);


        foreach ($formFields as $field) {

            $fieldName  = $field->getName();
            $fieldLabel = $field->getLabel();
            $fieldType  = $field->getType();
            $required   = $field->getRequired();
            $configuration = $field->getConfiguration();
            // Une valeur en lecture seule ne doit jamais être acceptée du navigateur.
            if (($configuration['variableMode'] ?? 'transmit') === 'readonly'
                && !empty($configuration['initialVariable'])) {
                $values[$fieldName] = [
                    'value' => $selectedScenario->getData($configuration['initialVariable']),
                    'tag' => $field->getTag()
                ];
            }
            $dependentWithoutChoices = false;

            // Une liste dépendante peut légitimement n'avoir aucun choix pour la
            // valeur de sa liste parente. Dans ce cas le champ est masqué côté UI
            // et ne doit pas être considéré comme obligatoire côté serveur.
            if ($fieldType === 'select') {
                $parentFieldId = intval($configuration['parentFieldId'] ?? 0);
                if ($parentFieldId > 0) {
                    foreach ($formFields as $candidate) {
                        if (intval($candidate->getId()) === $parentFieldId && $candidate->getType() === 'select') {
                            $parentValue = (string) ($values[$candidate->getName()]['value'] ?? '');
                            $dependentWithoutChoices = empty($configuration['optionsByParent'][$parentValue] ?? []);
                            break;
                        }
                    }
                }
            }


            /*
            * ==========================================
            * PRÉSENCE DU CHAMP
            * ==========================================
            */

            if (!array_key_exists($fieldName, $values)) {

                /*
                * Un booléen absent est considéré
                * comme décoché.
                */

                if ($fieldType === 'boolean') {

                    $values[$fieldName] = [

                        'value' => 0,

                        'tag' => $field->getTag()

                    ];

                /*
                * Un champ requis doit obligatoirement
                * être présent.
                */

                } elseif ($required && !$dependentWithoutChoices) {

                    ajax::error(
                        'Veuillez renseigner le champ : ' .
                        $fieldLabel
                    );

                    return;

                /*
                * Un champ facultatif peut être absent.
                *
                * On crée néanmoins une entrée afin
                * de conserver une structure cohérente.
                */

                } else {

                    $values[$fieldName] = [

                        'value' => '',

                        'tag' => $field->getTag()

                    ];
                }
            }


            /*
            * ==========================================
            * RÉCUPÉRATION DE LA VALEUR
            * ==========================================
            */

            $fieldValue =
                $values[$fieldName]['value'] ?? '';


            /*
            * ==========================================
            * BOOLEAN
            * ==========================================
            *
            * 0 est une valeur valide.
            */

            if ($fieldType === 'boolean') {

                if ($required && empty($fieldValue)) {
                    ajax::error(
                        'Veuillez cocher le champ : ' .
                        $fieldLabel
                    );
                    return;
                }

                $values[$fieldName]['value'] =
                    !empty($fieldValue) ? 1 : 0;

                continue;
            }


            /*
            * ==========================================
            * VALEUR VIDE
            * ==========================================
            *
            * Une valeur vide est interdite uniquement
            * si le champ est requis.
            */

            if (
                $required && !$dependentWithoutChoices &&
                (
                    $fieldValue === null ||
                    trim((string) $fieldValue) === ''
                )
            ) {

                ajax::error(
                    'Veuillez renseigner le champ : ' .
                    $fieldLabel
                );

                return;
            }


            /*
            * ==========================================
            * CHAMP FACULTATIF VIDE
            * ==========================================
            *
            * Il n'y a rien à valider dans ce cas.
            */

            if (
                !$required &&
                (
                    $fieldValue === null ||
                    trim((string) $fieldValue) === ''
                )
            ) {

                continue;
            }

            $stringValue = (string) $fieldValue;

            if ($dependentWithoutChoices && trim($stringValue) === '') {
                continue;
            }

            if (in_array($fieldType, ['text', 'textarea', 'email'], true)) {
                $length = function_exists('mb_strlen')
                    ? mb_strlen($stringValue)
                    : strlen($stringValue);
                $minLength = $configuration['minLength'] ?? null;
                $maxLength = $configuration['maxLength'] ?? null;

                if ($minLength !== null && $length < intval($minLength)) {
                    ajax::error(
                        'Le champ ' . $fieldLabel . ' doit contenir au moins ' .
                        intval($minLength) . ' caractères'
                    );
                    return;
                }

                if ($maxLength !== null && $length > intval($maxLength)) {
                    ajax::error(
                        'Le champ ' . $fieldLabel . ' ne doit pas dépasser ' .
                        intval($maxLength) . ' caractères'
                    );
                    return;
                }
            }

            if ($fieldType === 'email' &&
                filter_var($stringValue, FILTER_VALIDATE_EMAIL) === false) {
                ajax::error('Adresse e-mail invalide pour le champ : ' . $fieldLabel);
                return;
            }

            if ($fieldType === 'integer' &&
                preg_match('/^-?\\d+$/', $stringValue) !== 1) {
                ajax::error('Nombre entier invalide pour le champ : ' . $fieldLabel);
                return;
            }

            if ($fieldType === 'decimal' && !is_numeric($stringValue)) {
                ajax::error('Nombre décimal invalide pour le champ : ' . $fieldLabel);
                return;
            }

            if (in_array($fieldType, ['integer', 'decimal'], true)) {
                $numericValue = floatval($stringValue);

                if (isset($configuration['min']) && $numericValue < floatval($configuration['min'])) {
                    ajax::error(
                        'Le champ ' . $fieldLabel . ' doit être supérieur ou égal à ' .
                        $configuration['min']
                    );
                    return;
                }

                if (isset($configuration['max']) && $numericValue > floatval($configuration['max'])) {
                    ajax::error(
                        'Le champ ' . $fieldLabel . ' doit être inférieur ou égal à ' .
                        $configuration['max']
                    );
                    return;
                }

                if ($fieldType === 'decimal' && isset($configuration['step'])) {
                    $step = floatval($configuration['step']);
                    $base = isset($configuration['min']) ? floatval($configuration['min']) : 0.0;
                    $steps = ($numericValue - $base) / $step;
                    if (abs($steps - round($steps)) > 0.0000001) {
                        ajax::error('Pas numérique non respecté pour le champ : ' . $fieldLabel);
                        return;
                    }
                }
            }

            if ($fieldType === 'select') {
                $options = $configuration['options'] ?? [];
                $parentFieldId = intval($configuration['parentFieldId'] ?? 0);
                if ($parentFieldId > 0) {
                    $parentField = null;
                    foreach ($formFields as $candidate) {
                        if (intval($candidate->getId()) === $parentFieldId && $candidate->getType() === 'select') {
                            $parentField = $candidate;
                            break;
                        }
                    }
                    if ($parentField === null) {
                        ajax::error('Liste parente introuvable pour le champ : ' . $fieldLabel);
                        return;
                    }
                    $parentValue = (string) ($values[$parentField->getName()]['value'] ?? '');
                    $options = $configuration['optionsByParent'][$parentValue] ?? [];
                }
                if (!in_array($stringValue, $options, true)) {
                    ajax::error('Choix invalide pour le champ : ' . $fieldLabel);
                    return;
                }
            }


            /*
            * ==========================================
            * VALIDATION DATE
            * ==========================================
            */

            if ($fieldType === 'date') {

                $date = DateTime::createFromFormat(
                    'Y-m-d',
                    $fieldValue
                );

                if (
                    !$date ||
                    $date->format('Y-m-d') !== $fieldValue
                ) {

                    ajax::error(
                        'Date invalide pour le champ : ' .
                        $fieldLabel
                    );

                    return;
                }
            }


            /*
            * ==========================================
            * VALIDATION HEURE
            * ==========================================
            */

            if ($fieldType === 'time') {

                $time = DateTime::createFromFormat(
                    'H:i',
                    $fieldValue
                );

                if (
                    !$time ||
                    $time->format('H:i') !== $fieldValue
                ) {

                    ajax::error(
                        'Heure invalide pour le champ : ' .
                        $fieldLabel
                    );

                    return;
                }
            }


            /*
            * ==========================================
            * VALIDATION DATE + HEURE
            * ==========================================
            */

            if ($fieldType === 'datetime') {

                $normalizedDateTime = str_replace('T', ' ', $fieldValue);

                $datetime = DateTime::createFromFormat(
                    'Y-m-d H:i',
                    $normalizedDateTime
                );

                if (
                    !$datetime ||
                    $datetime->format('Y-m-d H:i') !== $normalizedDateTime
                ) {

                    ajax::error(
                        'Date et heure invalides pour le champ : ' .
                        $fieldLabel
                    );

                    return;
                }

                $values[$fieldName]['value'] = $normalizedDateTime;
            }
        }

        $fieldsById = [];
        foreach ($formFields as $formField) {
            $fieldsById[intval($formField->getId())] = $formField;
        }

        $operatorLabels = [
            'gte' => 'postérieur(e) ou égal(e) à',
            'gt'  => 'strictement postérieur(e) à',
            'lte' => 'antérieur(e) ou égal(e) à',
            'lt'  => 'strictement antérieur(e) à'
        ];

        foreach ($formFields as $field) {
            $configuration = $field->getConfiguration();

            $comparisonFieldId = intval($configuration['comparisonFieldId'] ?? 0);
            $operator = (string) ($configuration['comparisonOperator'] ?? '');

            if ($comparisonFieldId <= 0 || !isset($operatorLabels[$operator])) {
                continue;
            }

            $comparisonField = $fieldsById[$comparisonFieldId] ?? null;
            if ($comparisonField === null || $comparisonField->getType() !== $field->getType()) {
                ajax::error('Configuration de comparaison invalide pour le champ : ' . $field->getLabel());
                return;
            }

            $value = trim((string) ($values[$field->getName()]['value'] ?? ''));
            $comparisonValue = trim((string) ($values[$comparisonField->getName()]['value'] ?? ''));

            if ($value === '' || $comparisonValue === '') {
                continue;
            }

            $isValid = ($operator === 'gte' && $value >= $comparisonValue) ||
                ($operator === 'gt' && $value > $comparisonValue) ||
                ($operator === 'lte' && $value <= $comparisonValue) ||
                ($operator === 'lt' && $value < $comparisonValue);

            if (!$isValid) {
                $message = trim((string) ($configuration['comparisonMessage'] ?? ''));
                if ($message === '') {
                    $message = $field->getLabel() . ' doit être ' .
                        $operatorLabels[$operator] . ' ' . $comparisonField->getLabel();
                }
                ajax::error($message);
                return;
            }
        }

        /*
        * ==========================================
        * SCÉNARIOS À EXÉCUTER
        * ==========================================
        *
        * Une réponse ne doit pas être enregistrée si
        * aucun scénario actif n'est associé au formulaire.
        */

        if ($selectedScenario === null) {

            ajax::error(
                'Aucun scénario actif associé à ce formulaire'
            );

            return;
        }

        if (!isConnect('admin')) {
            foreach ([$selectedScenario] as $scenarioToLaunch) {
                if (!scenarioformScenarioCanExecute($scenarioToLaunch)) {
                    throw new Exception(
                        'Vous ne disposez pas du droit d’exécution sur le scénario « ' .
                        $scenarioToLaunch->getName() . ' » (' .
                        'scénario #' . intval($scenarioToLaunch->getId()) . ')'
                    );
                }
            }
        }

        // Écriture explicitement autorisée champ par champ, après validation
        // des valeurs et contrôle des droits d'exécution du scénario.
        foreach ($formFields as $field) {
            $configuration = $field->getConfiguration();
            if (($configuration['variableMode'] ?? 'transmit') !== 'write') {
                continue;
            }
            $variableName = (string) ($configuration['initialVariable'] ?? '');
            if ($variableName === '' || !preg_match('/^[A-Za-z0-9_.-]+$/', $variableName)) {
                throw new Exception('Variable Jeedom invalide pour le champ ' . $field->getLabel());
            }
            $fieldName = $field->getName();
            $newValue = $values[$fieldName]['value'] ?? '';
            if (!is_scalar($newValue) && $newValue !== null) {
                throw new Exception('Valeur de variable invalide');
            }
            $selectedScenario->setData($variableName, $newValue);
        }

        /*
        * ==========================================
        * CRÉATION DE LA RÉPONSE
        * ==========================================
        */

        $response = new scenarioformResponse();

        $response->setFormId(
            $formId
        );
        $response->setScenarioId($scenarioId);

        $callbackToken = bin2hex(random_bytes(32));

        $response->setToken(hash('sha256', $callbackToken));

        $response->setSource(
            'panel'
        );


        if (!$response->save()) {

            ajax::error(
                'Erreur création réponse'
            );

            return;
        }


        /*
        * ==========================================
        * SAUVEGARDE DES VALEURS
        * ==========================================
        */

        $historyValues = [];
        try {
            foreach ($values as $fieldName => $data) {

            $field = null;


            /*
            * Recherche du champ dans le formulaire
            */

            foreach ($formFields as $formField) {

                if (
                    (string) $formField->getName()
                    ===
                    (string) $fieldName
                ) {

                    $field = $formField;

                    break;
                }
            }


            if ($field === null) {

                ajax::error(
                    'Champ introuvable : ' .
                    $fieldName
                );

                return;
            }


            /*
            * Création de la valeur
            */

            $responseValue =
                new scenarioformResponseValue();

            $responseValue->setResponseId(
                $response->getId()
            );

            $responseValue->setFieldId(
                $field->getId()
            );

            $responseValue
                ->setFieldNameSnapshot($field->getName())
                ->setFieldLabelSnapshot($field->getLabel())
                ->setFieldTypeSnapshot($field->getType());

            $responseValue->setValue(
                $data['value']
            );


            if (!$responseValue->save()) {
                throw new Exception('Erreur sauvegarde valeur champ ' . $fieldName);
            }
            $historyValues[] = [
                'field_id' => $field->getId(),
                'name'     => $field->getName(),
                'label'    => $field->getLabel(),
                'tag'      => $field->getTag(),
                'type'     => $field->getType(),
                'value'    => $data['value']
            ];
            }
        } catch (Throwable $e) {
            try {
                $response->remove();
            } catch (Throwable $cleanupError) {
                log::add('scenarioform', 'error', 'Nettoyage réponse incomplète impossible : ' . $cleanupError->getMessage());
            }
            throw $e;
        }


        /*
        * ==========================================
        * MÉMORISATION DU CONTEXTE D'HISTORIQUE
        * ==========================================
        *
        * On conserve un instantané des libellés et des résultats afin que
        * l'historique reste fidèle même si la requête, le formulaire ou les
        * associations de scénarios sont modifiés par la suite.
        */

        $request = $form->getRequest();
        $requestedScenarios = [];
        $scenarioResults = [];

        $resultTimeoutSeconds = intval(
            config::byKey('scenario_result_timeout', 'scenarioform', 120)
        );
        if ($resultTimeoutSeconds <= 0) {
            $resultTimeoutSeconds = 120;
        }
        $resultTimeoutSeconds = max(30, min(86400, $resultTimeoutSeconds));
        $resultExpiresAt = date('Y-m-d H:i:s', time() + $resultTimeoutSeconds);

        foreach ($form->getScenarioLinks() as $scenarioLink) {
            $scenario = $scenarioLink->getScenario();
            if ($scenario === null || !$scenario->getIsActive() || intval($scenario->getId()) !== $scenarioId) {
                continue;
            }
            $expectResult = $scenarioLink->getExpectResult();
            $requestedScenarios[] = [
                'id'   => $scenario->getId(),
                'name' => $scenario->getName(),
                'expect_result' => $expectResult
            ];
            $scenarioResults[] = [
                'scenario_id' => $scenario->getId(),
                'name'        => $scenario->getName(),
                'status'      => $expectResult ? 'pending' : 'not_expected',
                'message'     => '',
                'updated_at'  => $expectResult ? null : date('Y-m-d H:i:s')
            ];
        }

        $response->setConfiguration([
            'history' => [
                'request' => $request === null ? null : [
                    'id'   => $request->getId(),
                    'name' => $request->getName()
                ],
                'form' => [
                    'id'   => $form->getId(),
                    'name' => $form->getName()
                ],
                'submitted_by' => [
                    'id' => scenarioformCurrentUserId()
                ],
                'values'              => $historyValues,
                'requested_scenarios' => $requestedScenarios,
                'launch_results'      => null,
                'scenario_results'    => $scenarioResults,
                'result_expires_at'   => $resultExpiresAt
            ]
        ]);

        if (!$response->save()) {
            throw new Exception(
                'Impossible d’initialiser le suivi des scénarios'
            );
        }

        $connection = DB::getConnection();
        $connection->prepare(
            'UPDATE scenarioform_response
             SET user_id = :user_id,
                 request_name_snapshot = :request_name,
                 form_name_snapshot = :form_name,
                 overall_status = :overall_status
             WHERE id = :id'
        )->execute([
            'user_id' => scenarioformCurrentUserId(),
            'request_name' => $request === null ? null : $request->getName(),
            'form_name' => $form->getName(),
            'overall_status' => scenarioformResponse::computeOverallStatus($scenarioResults),
            'id' => $response->getId()
        ]);

        foreach ($scenarioResults as $order => $scenarioResult) {
            $connection->prepare(
                'INSERT INTO scenarioform_response_scenario
                 (response_id, scenario_id, scenario_name_snapshot, displayOrder,
                  expectResult, launch_status, business_status, business_message, created, updated)
                 VALUES (:response_id, :scenario_id, :scenario_name, :display_order,
                  :expect_result, :launch_status, :business_status, :business_message, :created, :updated)'
            )->execute([
                'response_id' => $response->getId(),
                'scenario_id' => $scenarioResult['scenario_id'],
                'scenario_name' => $scenarioResult['name'],
                'display_order' => $order + 1,
                'expect_result' => $scenarioResult['status'] === 'not_expected' ? 0 : 1,
                'launch_status' => 'pending',
                'business_status' => $scenarioResult['status'],
                'business_message' => '',
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s')
            ]);
        }

        $callbackUrl = scenarioform::getInternalCallbackUrl();

        $systemTags = [
            '#crud#' => 'Création',
            '#scenarioform_response_id#' => $response->getId(),
            '#scenarioform_callback_token#' => $callbackToken,
            '#scenarioform_callback_url#' => $callbackUrl,
            '#scenarioform_origin#' => 'scenarioform'
        ];

        $tags = array_merge($response->getTags(), $systemTags);

        $launched = $response->launchScenarios($systemTags, $scenarioId);

        foreach ($launched as $launch) {
            DB::Prepare(
                'UPDATE scenarioform_response_scenario
                 SET launch_status = :launch_status, updated = :updated
                 WHERE response_id = :response_id AND scenario_id = :scenario_id',
                [
                    'launch_status' => $launch['result'] === true ? 'success' : 'error',
                    'updated' => date('Y-m-d H:i:s'),
                    'response_id' => $response->getId(),
                    'scenario_id' => intval($launch['id'])
                ]
            );
        }

        /*
         * Un scénario peut répondre très rapidement. On recharge donc la
         * configuration avant de mémoriser le résultat technique du lancement
         * afin de ne pas écraser un retour métier déjà reçu.
         */
        $connection = DB::getConnection();
        try {
            $connection->beginTransaction();
            $statement = $connection->prepare(
                'SELECT configuration
                 FROM scenarioform_response
                 WHERE id = :id
                 FOR UPDATE'
            );
            $statement->execute(['id' => $response->getId()]);
            $row = $statement->fetch(PDO::FETCH_ASSOC);
            $latestConfiguration = json_decode((string) ($row['configuration'] ?? ''), true);
            if (!is_array($latestConfiguration)) {
                $latestConfiguration = [];
            }
            $latestConfiguration['history']['launch_results'] = $launched;

            $statement = $connection->prepare(
                'UPDATE scenarioform_response
                 SET configuration = :configuration, updated = :updated
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $response->getId(),
                'configuration' => json_encode($latestConfiguration),
                'updated' => date('Y-m-d H:i:s')
            ]);
            $connection->commit();
            $response->setConfiguration($latestConfiguration);

        } catch (Throwable $e) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $e;
        }


        /*
        * ==========================================
        * RÉPONSE AJAX
        * ==========================================
        */

        ajax::success([

            'response_id' => $response->getId(),

            'tags' => $response->getTags(),

            'launched' => $launched,

            'scenario_results' => $latestConfiguration['history']['scenario_results'] ?? []

        ]);

        return;


    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'getScenarioResults':

    try {
        include_file('core', 'scenarioformResponse', 'class', 'scenarioform');

        $formId = intval(init('form_id'));
        $responseId = intval(init('response_id'));
        if ($formId <= 0 || $responseId <= 0) {
            throw new Exception('Réponse ou formulaire manquant');
        }

        $response = scenarioformResponse::byId($responseId);
        if ($response === null || intval($response->getFormId()) !== $formId) {
            throw new Exception('Réponse introuvable pour ce formulaire');
        }

        $configuration = $response->getConfiguration();
        if (!scenarioformCanReadResponseConfiguration($configuration)) {
            throw new Exception('Réponse inaccessible');
        }

        $resultTimeoutSeconds = intval(
            config::byKey('scenario_result_timeout', 'scenarioform', 120)
        );
        $resultTimeoutSeconds = max(30, min(86400, $resultTimeoutSeconds > 0 ? $resultTimeoutSeconds : 120));
        $response->expirePendingScenarioResults($resultTimeoutSeconds);

        $response = scenarioformResponse::byId($responseId);
        $configuration = $response === null ? [] : $response->getConfiguration();
        $historyContext = $configuration['history'] ?? [];

        ajax::success([
            'response_id' => $responseId,
            'scenario_results' => $historyContext['scenario_results'] ?? [],
            'overall_status' => $historyContext['overall_status'] ?? null
        ]);
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

case 'getScenarioList':

    try {

        include_file(
            'core',
            'scenarioform',
            'class',
            'scenarioform'
        );

        ajax::success(
            scenarioform::getScenarioList()
        );

    } catch(Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'createGuidedExample':
    $guidedRequest = null;
    $guidedForm = null;
    $guidedScenario = null;

    try {
        include_file('core', 'scenarioformRequest', 'class', 'scenarioform');
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');
        include_file('core', 'scenarioformField', 'class', 'scenarioform');
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');
        include_file('core', 'scenarioform', 'class', 'scenarioform');

        $requestName = trim((string) init('request_name'));
        $formName = trim((string) init('form_name'));
        $scenarioName = trim((string) init('scenario_name'));
        if ($requestName === '' || $formName === '' || $scenarioName === '') {
            throw new Exception('Les noms de la requête, du formulaire et du scénario sont obligatoires');
        }
        foreach ([$requestName, $formName, $scenarioName] as $guidedName) {
            $guidedNameLength = function_exists('mb_strlen')
                ? mb_strlen($guidedName)
                : strlen($guidedName);
            if ($guidedNameLength > 255) {
                throw new Exception('Les noms sont limités à 255 caractères');
            }
        }

        $guidedRequest = new scenarioformRequest();
        $guidedRequest->setName($requestName);
        $guidedRequest->setDescription(trim((string) init('request_description')));
        $guidedRequest->setDisplayOrder(scenarioformRequest::nextDisplayOrder());
        $guidedRequest->setIsEnable(true);
        if (!$guidedRequest->save()) {
            throw new Exception('Impossible de créer la requête guidée');
        }

        $guidedForm = new scenarioformForm();
        $guidedForm->setRequestId(intval($guidedRequest->getId()));
        $guidedForm->setName($formName);
        $guidedForm->setDescription(trim((string) init('form_description')));
        $guidedForm->setDisplayOrder(1);
        $guidedForm->setIsEnable(true);
        if (!$guidedForm->save()) {
            throw new Exception('Impossible de créer le formulaire guidé');
        }

        $guidedFields = [
            ['name' => 'retour', 'label' => 'Date de retour', 'type' => 'date', 'required' => true],
            ['name' => 'commentaire', 'label' => 'Commentaire', 'type' => 'textarea', 'required' => false]
        ];
        foreach ($guidedFields as $index => $guidedDefinition) {
            $guidedField = new scenarioformField();
            $guidedField->setFormId(intval($guidedForm->getId()));
            $guidedField->setName($guidedDefinition['name']);
            $guidedField->setLabel($guidedDefinition['label']);
            $guidedField->setType($guidedDefinition['type']);
            $guidedField->setRequired($guidedDefinition['required']);
            $guidedField->setDisplayOrder($index + 1);
            $guidedField->setIsEnable(true);
            $guidedField->setConfiguration([]);
            if (!$guidedField->save()) {
                throw new Exception('Impossible de créer le champ « ' . $guidedDefinition['label'] . ' »');
            }
        }

        $guidedScenario = scenarioform::createScenarioTemplate(
            $guidedForm,
            $scenarioName,
            scenarioform::buildGuidedExampleCode($guidedForm)
        );
        $guidedForm->syncScenarios([intval($guidedScenario->getId())]);
        DB::Prepare(
            'UPDATE scenarioform_field SET scenario_id = :scenario_id
             WHERE form_id = :form_id AND scenario_id IS NULL',
            [
                'scenario_id' => intval($guidedScenario->getId()),
                'form_id' => intval($guidedForm->getId())
            ]
        );
        scenarioform::ensureResultActionEquipment();

        ajax::success([
            'request_id' => intval($guidedRequest->getId()),
            'form_id' => intval($guidedForm->getId()),
            'scenario_id' => intval($guidedScenario->getId()),
            'request_name' => $guidedRequest->getName(),
            'form_name' => $guidedForm->getName(),
            'scenario_name' => $guidedScenario->getName(),
            'edit_url' => 'index.php?v=d&p=scenario&id=' . intval($guidedScenario->getId())
        ]);
    } catch (Throwable $e) {
        if (is_object($guidedScenario)) {
            try { $guidedScenario->remove(); } catch (Throwable $cleanupError) { }
        }
        if (is_object($guidedForm)) {
            try { $guidedForm->remove(); } catch (Throwable $cleanupError) { }
        }
        if (is_object($guidedRequest)) {
            try { $guidedRequest->remove(); } catch (Throwable $cleanupError) { }
        }
        ajax::error($e->getMessage());
    }
break;

case 'createScenarioTemplate':

    try {
        if (!isConnect('admin')) {
            throw new Exception('401 - Accès administrateur requis');
        }

        include_file('core', 'scenarioformForm', 'class', 'scenarioform');
        include_file('core', 'scenarioformField', 'class', 'scenarioform');
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');
        include_file('core', 'scenarioform', 'class', 'scenarioform');

        $formId = intval(init('form_id'));
        $form = scenarioformForm::byId($formId);
        if ($form === null) {
            throw new Exception('Formulaire introuvable');
        }

        $scenario = scenarioform::createScenarioTemplate($form, (string) init('name'));

        try {
            $scenarioIds = [];
            foreach ($form->getScenarios() as $associatedScenario) {
                $scenarioIds[] = intval($associatedScenario->getId());
            }
            $scenarioIds[] = intval($scenario->getId());
            $form->syncScenarios(array_values(array_unique($scenarioIds)));
            DB::Prepare(
                'UPDATE scenarioform_field
                 SET scenario_id = :scenario_id, updated = :updated
                 WHERE form_id = :form_id AND scenario_id IS NULL',
                ['scenario_id' => intval($scenario->getId()), 'form_id' => $formId, 'updated' => date('Y-m-d H:i:s')]
            );
            scenarioform::ensureResultActionEquipment();
        } catch (Throwable $e) {
            $scenario->remove();
            throw $e;
        }

        ajax::success([
            'id' => intval($scenario->getId()),
            'name' => $scenario->getName(),
            'form_id' => $formId,
            'edit_url' => 'index.php?v=d&p=scenario&id=' . intval($scenario->getId())
        ]);
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

case 'getRequestDetail':
    try {

        include_file(
            'core',
            'scenarioformRequest',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );

        $requestId = intval(init('id'));


        if (empty($requestId)) {

            ajax::error(
                'ID requête manquant'
            );
            return;
        }


        $request = scenarioformRequest::byId($requestId);


        if ($request === null) {

            ajax::error(
                'Requête introuvable'
            );
            return;

        }

        if (!isConnect('admin') && !$request->getIsEnable()) {
            throw new Exception('Cette requête n’est pas disponible');
        }


        $forms = [];
        foreach (scenarioformForm::allByRequest($requestId) as $form) {
            if (!isConnect('admin') && !$form->getIsEnable()) {
                continue;
            }
            $scenarioSummaries = [];
            foreach ($form->getScenarios() as $scenario) {
                $scenarioSummaries[] = [
                    'id' => $scenario->getId(),
                    'name' => $scenario->getName()
                ];
            }
            $forms[] = [
                'id' => $form->getId(),
                'name' => $form->getName(),
                'description' => $form->getDescription(),
                'displayOrder' => $form->getDisplayOrder(),
                'scenarios' => $scenarioSummaries
            ];
        }

        ajax::success([

            'request' => [

                'id'          => $request->getId(),
                'name'        => $request->getName(),
                'description' => $request->getDescription()

            ],

            'forms' => $forms,
            'form' => count($forms) > 0 ? $forms[0] : null
        ]);


    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'saveRequest':
    try {

        include_file(
            'core',
            'scenarioformRequest',
            'class',
            'scenarioform'
        );

        $id = intval(init('id'));

        if (!$id) {

            ajax::error(
                'ID requête manquant'
            );

        }


        $request = scenarioformRequest::byId($id);


        if ($request === null) {

            ajax::error(
                'Requête introuvable'
            );

        }


        $name = init('name');

        $description = init('description');

    $request->setName($name);
    $request->setDescription($description);

    $request->setConfiguration([]);
    $request->setIsEnable(1);

    $result = $request->save();     

    if (!$result) {

        ajax::error(
            'Erreur sauvegarde requête : voir log'
        );

    }
        ajax::success([
            'id'=>$request->getId(),
            'name'=>$request->getName()
        ]);


    } catch(Throwable $e) {

    log::add(
        'scenarioform',
        'error',
        $e->__toString()
    );

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'createRequest':

    try {

        include_file(
            'core',
            'scenarioformRequest',
            'class',
            'scenarioform'
        );

        $name = trim(init('name'));

        $description = init('description');


        if (empty($name)) {

            ajax::error(
                'Nom de requête obligatoire'
            );

        }


        $request = new scenarioformRequest();

        $request->setName($name);

        $request->setDescription($description);

        $request->setDisplayOrder(
            scenarioformRequest::nextDisplayOrder()
        );

        $request->setIsEnable(true);


        if (!$request->save()) {

            ajax::error(
                'Erreur sauvegarde requête'
            );

        }


        log::add(
            'scenarioform',
            'debug',
            'New request id='.$request->getId()
        );


        ajax::success([

            'id'   => $request->getId(),

            'name' => $request->getName()

        ]);


    } catch(Throwable $e) {


        log::add(
            'scenarioform',
            'error',
            $e->__toString()
        );


        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'removeRequest':
 
    try {

        include_file(
            'core',
            'scenarioformRequest',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');

        include_file(
            'core',
            'scenarioformRequestScenario',
            'class',
            'scenarioform'
        );


        $id = intval(init('id'));


        if (!$id) {

            ajax::error(
                'ID requête manquant'
            );

        }


        $request = scenarioformRequest::byId($id);


        if ($request === null) {

            ajax::error(
                'Requête introuvable'
            );

        }


        /*
         * Suppression des associations scénarios
         */

        $request->clearScenarios();

        foreach (scenarioformForm::allByRequest($id, false) as $form) {
            if (!$form->remove()) {
                throw new Exception('Erreur suppression d’un formulaire de la requête');
            }
        }


        /*
         * Suppression de la requête
         */

        if (!$request->remove()) {

            ajax::error(
                'Erreur suppression requête'
            );

        }


        ajax::success([

            'id' => $id

        ]);


    } catch(Throwable $e) {


        log::add(
            'scenarioform',
            'error',
            $e->__toString()
        );


        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'reorderForms':
    try {
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');

        $requestId = intval(init('request_id'));
        $formIds = init('forms', []);
        if ($requestId <= 0 || !is_array($formIds)) {
            ajax::error('Ordre des formulaires invalide');
            return;
        }

        $formsById = [];
        foreach (scenarioformForm::allByRequest($requestId) as $form) {
            $formsById[intval($form->getId())] = $form;
        }

        $normalizedIds = [];
        foreach ($formIds as $formId) {
            $formId = intval($formId);
            if ($formId <= 0 || !isset($formsById[$formId]) || in_array($formId, $normalizedIds, true)) {
                ajax::error('Liste de formulaires invalide');
                return;
            }
            $normalizedIds[] = $formId;
        }
        if (count($normalizedIds) !== count($formsById)) {
            ajax::error('La liste des formulaires est incomplète');
            return;
        }

        DB::Prepare('START TRANSACTION', []);
        try {
            foreach ($normalizedIds as $index => $formId) {
                $formsById[$formId]->setDisplayOrder($index + 1);
                if (!$formsById[$formId]->save()) {
                    throw new Exception('Impossible de sauvegarder l’ordre des formulaires');
                }
            }
            DB::Prepare('COMMIT', []);
        } catch (Throwable $e) {
            DB::Prepare('ROLLBACK', []);
            throw $e;
        }

        ajax::success(['request_id' => $requestId, 'forms' => $normalizedIds]);
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }
break;

case 'reorderFormScenarios':
    try {
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');

        $requestId = intval(init('request_id'));
        $formId = intval(init('form_id'));
        $scenarioIds = init('scenarios', []);
        $form = scenarioformForm::byId($formId);

        if ($requestId <= 0 || $form === null || $form->getRequestId() !== $requestId) {
            ajax::error('Association requête/formulaire invalide');
            return;
        }
        if (!is_array($scenarioIds)) {
            ajax::error('Ordre des scénarios invalide');
            return;
        }

        $form->syncScenarios($scenarioIds);
        ajax::success(['form_id' => $formId, 'scenarios' => array_values($scenarioIds)]);
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }
break;

case 'createForm':

    try {

        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformRequest', 'class', 'scenarioform');
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');

        $requestId = intval(init('request_id'));

        if (!$requestId) {
            ajax::error('ID requête manquant');
            return;
        }


        if (scenarioformRequest::byId($requestId) === null) {
            ajax::error('Requête introuvable');
            return;
        }


        $form = new scenarioformForm();

        $form->setRequestId($requestId);
        $name = trim(init('name'));
        if ($name === '') {
            ajax::error('Nom du formulaire obligatoire');
            return;
        }
        $form->setName($name);
        $form->setDescription(init('description'));
        $form->setDisplayOrder(scenarioformForm::nextDisplayOrder($requestId));


        if (!$form->save()) {

            ajax::error(
                'Erreur création formulaire'
            );
            return;

        }


        $scenarios = init('scenarios', []);

        try {
            $form->syncScenarios(
                is_array($scenarios) ? $scenarios : []
            );
        } catch (Throwable $e) {
            /*
            * Ne pas conserver un formulaire vide si la création
            * de ses associations échoue.
            */
            $form->remove();

            throw $e;
        }

        ajax::success(['id' => $form->getId(), 'request_id' => $requestId]);


    } catch(Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'saveForm':

    try {


        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');


        $id = intval(init('id'));

        if (!$id) {

            ajax::error(
                'ID formulaire manquant'
            );

        }

        $form = scenarioformForm::byId($id);


        if ($form === null) {

            ajax::error(
                'Formulaire introuvable'
            );

        }

        $name = trim(init('name'));
        if ($name === '') {
            ajax::error('Nom du formulaire obligatoire');
            return;
        }
        $form->setName($name);


       $form->setDescription(
           init('description')
       );

        $historyTitleFieldId = intval(init('history_title_field_id'));
        if ($historyTitleFieldId > 0) {
            $historyTitleField = scenarioformField::byId($historyTitleFieldId);
            if ($historyTitleField === null || intval($historyTitleField->getFormId()) !== $id) {
                ajax::error('Champ de titre d’historique invalide');
                return;
            }
        }
        $form->setConfiguration('history_title_field_id', $historyTitleFieldId);

        if (!$form->save()) {

            ajax::error(
                'Erreur sauvegarde formulaire'
            );

        }

        $scenarios = init('scenarios', []);
        $syncResult = $form->syncScenarios(is_array($scenarios) ? $scenarios : []);

        ajax::success([

            'id' => $form->getId(),
            'request_id' => $form->getRequestId(),
            'field_transfer' => $syncResult['field_transfer'] ?? null

        ]);

    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );


    }

break;

case 'removeForm':

    try {


        include_file(
            'core',
            'scenarioformForm',
            'class',
            'scenarioform'
        );




        $formId = intval(init('id'));


        if (!$formId) {

            ajax::error(
                'ID formulaire manquant'
            );

            return;

        }


        $form = scenarioformForm::byId($formId);


        if (!$form) {

            ajax::error(
                'Formulaire introuvable'
            );

        }


        /*
        * Suppression formulaire
        */

        if (!$form->remove()) {

            ajax::error(
                'Erreur suppression formulaire'
            );

        }



        ajax::success();


    }
    catch(Throwable $e) {


        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'addSelectOption':

    $connection = null;

    try {
        $fieldId = intval(init('field_id'));
        $option = trim((string) init('option'));

        if ($fieldId <= 0) {
            throw new Exception('Champ introuvable');
        }
        if ($option === '') {
            throw new Exception('La valeur ne peut pas être vide');
        }

        $optionLength = function_exists('mb_strlen')
            ? mb_strlen($option)
            : strlen($option);
        if ($optionLength > 255) {
            throw new Exception('La valeur ne doit pas dépasser 255 caractères');
        }
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $option) === 1) {
            throw new Exception('La valeur contient des caractères non autorisés');
        }

        $connection = DB::getConnection();
        $connection->beginTransaction();

        $statement = $connection->prepare(
            'SELECT id, type, configuration
             FROM scenarioform_field
             WHERE id = :id
             FOR UPDATE'
        );
        $statement->execute(['id' => $fieldId]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        if (!is_array($row)) {
            throw new Exception('Champ introuvable');
        }
        if ((string) $row['type'] !== 'select') {
            throw new Exception('Ce champ n’est pas une liste de choix');
        }

        $configuration = json_decode((string) ($row['configuration'] ?? ''), true);
        if (!is_array($configuration)) {
            $configuration = [];
        }
        $options = array_values(array_filter(
            (array) ($configuration['options'] ?? []),
            static fn($value) => is_scalar($value) && trim((string) $value) !== ''
        ));

        $normalizedOption = function_exists('mb_strtolower')
            ? mb_strtolower($option, 'UTF-8')
            : strtolower($option);
        foreach ($options as $existingOption) {
            $existingOption = trim((string) $existingOption);
            $normalizedExisting = function_exists('mb_strtolower')
                ? mb_strtolower($existingOption, 'UTF-8')
                : strtolower($existingOption);
            if ($normalizedExisting === $normalizedOption) {
                throw new Exception('Cette valeur existe déjà dans la liste');
            }
        }

        $options[] = $option;
        $configuration['options'] = $options;
        $encodedConfiguration = json_encode(
            $configuration,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        if ($encodedConfiguration === false) {
            throw new Exception('Configuration de la liste invalide');
        }

        $update = $connection->prepare(
            'UPDATE scenarioform_field
             SET configuration = :configuration, updated = :updated
             WHERE id = :id'
        );
        $update->execute([
            'configuration' => $encodedConfiguration,
            'updated' => date('Y-m-d H:i:s'),
            'id' => $fieldId
        ]);

        $connection->commit();
        ajax::success([
            'field_id' => $fieldId,
            'option' => $option,
            'options' => $options
        ]);
    } catch (Throwable $e) {
        if ($connection instanceof PDO && $connection->inTransaction()) {
            $connection->rollBack();
        }
        ajax::error($e->getMessage());
    }

break;

case 'getFieldList':

    try {

        include_file(
            'core',
            'scenarioformField',
            'class',
            'scenarioform'
        );
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');

        $formId = intval(init('form_id'));


        if (!$formId) {

            ajax::error(
                'ID formulaire manquant'
            );

        }


        $entryMode = intval(init('entry')) === 1;
        $scenarioId = intval(init('scenario_id'));
        $form = scenarioformForm::byId($formId);
        if ($form === null) {
            ajax::error('Formulaire introuvable');
            return;
        }

        $scenarios = [];
        foreach ($form->getScenarioLinks() as $link) {
            $scenario = $link->getScenario();
            if ($scenario === null || !$scenario->getIsActive()) {
                continue;
            }
            $scenarios[] = ['id' => $scenario->getId(), 'name' => $scenario->getName()];
        }

        if ($entryMode && $scenarioId <= 0 && count($scenarios) === 1) {
            $scenarioId = intval($scenarios[0]['id']);
        }
        if ($scenarioId > 0 && scenarioformFormScenario::byFormScenario($formId, $scenarioId) === null) {
            ajax::error('Scénario non associé à ce formulaire');
            return;
        }

        $fields = $scenarioId > 0
            ? scenarioformField::allByFormScenario($formId, $scenarioId)
            : scenarioformField::allByForm($formId);


        $result = [];

        foreach ($fields as $field) {

            $fieldConfiguration = $field->getConfiguration();
            $initialValue = null;

            if ($entryMode && $scenarioId > 0) {
                $initialVariable = trim((string) ($fieldConfiguration['initialVariable'] ?? ''));
                if ($initialVariable !== '') {
                    $initialScenario = scenario::byId($scenarioId);
                    if (is_object($initialScenario)) {
                        $initialValue = $initialScenario->getData($initialVariable);
                    }
                }
            }

            $result[] = [

                'id' => $field->getId(),

                'name' => $field->getName(),

                'label' => $field->getLabel(),

                'type' => $field->getType(),

                'displayOrder' => $field->getDisplayOrder(),

                'isEnable' => $field->getIsEnable(),

                'required' => $field->getRequired(),

                'configuration' => $fieldConfiguration,

                'initialValue' => $initialValue

            ];

        }


        ajax::success($entryMode ? [
            'fields' => $result,
            'scenarios' => $scenarios,
            'scenario_id' => $scenarioId
        ] : $result);


    } catch(Throwable $e) {


        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'getField':

        try {

            include_file(
                'core',
                'scenarioformField',
                'class',
                'scenarioform'
            );


            $id = intval(
                init('id')
            );


            /*
            * ==========================================
            * NOUVEAU CHAMP
            * ==========================================
            */

            if ($id === 0) {

                $formId = intval(init('form_id'));
                $scenarioId = intval(init('scenario_id'));

                if (!$formId) {
                    ajax::error('ID formulaire manquant');
                    return;
                }

                $comparisonFields = [];
                $candidateFields = $scenarioId > 0
                    ? scenarioformField::allByFormScenario($formId, $scenarioId)
                    : scenarioformField::allByForm($formId);
                foreach ($candidateFields as $candidate) {
                    $comparisonFields[] = [
                        'id' => $candidate->getId(),
                        'label' => $candidate->getLabel(),
                        'name' => $candidate->getName(),
                        'type' => $candidate->getType()
                    ];
                }

                ajax::success([

                    'id'            => null,

                    'form_id'       => $formId,

                    'scenario_id'   => $scenarioId,

                    'name'          => '',

                    'label'         => '',

                    'type'          => 'text',

                    'displayOrder'  => scenarioformField::nextDisplayOrder($formId, $scenarioId),

                    'required'      => false,

                    'configuration' => [],

                    'comparisonFields' => $comparisonFields

                ]);

                return;
            }


            /*
            * ==========================================
            * CHAMP EXISTANT
            * ==========================================
            */

            $field = scenarioformField::byId(
                $id
            );


            if ($field === null) {

                ajax::error(
                    'Champ introuvable : ' . $id
                );

                return;
            }


            $comparisonFields = [];
            foreach (scenarioformField::allByFormScenario(
                intval($field->getFormId()),
                intval($field->getScenarioId())
            ) as $candidate) {
                if (intval($candidate->getId()) === intval($field->getId())) {
                    continue;
                }
                $comparisonFields[] = [
                    'id' => $candidate->getId(),
                    'label' => $candidate->getLabel(),
                    'name' => $candidate->getName(),
                    'type' => $candidate->getType()
                ];
            }

            ajax::success([

                'id'            => $field->getId(),

                'form_id'       => $field->getFormId(),

                'scenario_id'   => $field->getScenarioId(),

                'name'          => $field->getName(),

                'label'         => $field->getLabel(),

                'type'          => $field->getType(),

                'displayOrder'  => $field->getDisplayOrder(),

                'required'      => $field->getRequired(),

                'configuration' => $field->getConfiguration(),

                'comparisonFields' => $comparisonFields

            ]);

            return;


        } catch (Throwable $e) {

            ajax::error(
                $e->getMessage()
            );

        }

break;

case 'saveField':

        try {

            include_file(
                'core',
                'scenarioformField',
                'class',
                'scenarioform'
            );


            /*
            * ==========================================
            * ID FORMULAIRE
            * ==========================================
            */

            $formId = intval(
                init('form_id')
            );

            $scenarioId = intval(init('scenario_id'));


            if (!$formId) {

                ajax::error(
                    'ID formulaire manquant'
                );

                return;
            }

            $formScenarioLinks = scenarioformFormScenario::allByForm($formId, false);
            $pendingTemplate = $scenarioId <= 0 && count($formScenarioLinks) === 0;
            if (!$pendingTemplate && ($scenarioId <= 0 || scenarioformFormScenario::byFormScenario($formId, $scenarioId) === null)) {
                ajax::error('Scénario du formulaire manquant');
                return;
            }
            $storedScenarioId = $pendingTemplate ? null : $scenarioId;


            /*
            * ==========================================
            * ID CHAMP
            * ==========================================
            */

            $fieldId = intval(
                init('id')
            );


            /*
            * ==========================================
            * DONNÉES REÇUES
            * ==========================================
            */

            $name = trim(
                init('name')
            );


            $label = trim(
                init('label')
            );


            $type = trim(
                init('type')
            );


            $displayOrder = intval(
                init('displayOrder')
            );


            /*
            * Champ obligatoire
            *
            * init() peut recevoir :
            * 1
            * "1"
            * 0
            * "0"
            *
            * On convertit explicitement en booléen.
            */

            $required = (     intval(init('required')) === 1 );

            $configuration = json_decode(init('configuration', '{}'), true);

            if (!is_array($configuration)) {
                ajax::error('Configuration du champ invalide');
                return;
            }


            /*
            * ==========================================
            * VALIDATION NOM
            * ==========================================
            *
            * Le nom technique est utilisé comme tag.
            */

            if ($name === '') {

                ajax::error(
                    'Le nom du tag est obligatoire'
                );

                return;
            }


            /*
            * ==========================================
            * TYPES AUTORISÉS
            * ==========================================
            */

            $allowedTypes = [

                'text',

                'date',

                'time',

                'datetime',

                'textarea',

                'integer',

                'decimal',

                'select',

                'email',

                'boolean'

            ];


            if (!in_array(
                $type,
                $allowedTypes,
                true
            )) {

                ajax::error(
                    'Type de champ invalide : ' . $type
                );

                return;
            }

            $normalizedConfiguration = [];

            // Valeur initiale dynamique depuis une variable Jeedom.
            // Ce paramètre est commun à tous les types de champs.
            $initialVariable = trim((string) ($configuration['initialVariable'] ?? ''));
            if ($initialVariable !== '') {
                if (!preg_match('/^[A-Za-z0-9_.-]+$/', $initialVariable)) {
                    ajax::error('Nom de variable Jeedom invalide pour la valeur initiale');
                    return;
                }
                $normalizedConfiguration['initialVariable'] = $initialVariable;
            }
            $variableMode = (string) ($configuration['variableMode'] ?? 'transmit');
            if (!in_array($variableMode, ['transmit', 'readonly', 'write'], true)) {
                ajax::error('Mode de variable Jeedom invalide');
                return;
            }
            if ($initialVariable === '' && $variableMode !== 'transmit') {
                ajax::error('Une variable Jeedom est nécessaire pour ce mode');
                return;
            }
            $normalizedConfiguration['variableMode'] = $variableMode;

            if (in_array($type, ['text', 'textarea', 'email'], true)) {
                $minLength = ($configuration['minLength'] ?? '') === ''
                    ? null
                    : intval($configuration['minLength']);
                $maxLength = ($configuration['maxLength'] ?? '') === ''
                    ? null
                    : intval($configuration['maxLength']);

                if (($minLength !== null && $minLength < 0) ||
                    ($maxLength !== null && $maxLength < 1) ||
                    ($minLength !== null && $maxLength !== null && $minLength > $maxLength)) {
                    ajax::error('Longueurs minimale et maximale invalides');
                    return;
                }

                if ($minLength !== null) {
                    $normalizedConfiguration['minLength'] = $minLength;
                }
                if ($maxLength !== null) {
                    $normalizedConfiguration['maxLength'] = $maxLength;
                }
            }

            if (in_array($type, ['integer', 'decimal'], true)) {
                foreach (['min', 'max'] as $bound) {
                    if (($configuration[$bound] ?? '') !== '') {
                        if (!is_numeric($configuration[$bound])) {
                            ajax::error('Borne numérique invalide : ' . $bound);
                            return;
                        }
                        $normalizedConfiguration[$bound] = floatval($configuration[$bound]);
                    }
                }

                if (isset($normalizedConfiguration['min'], $normalizedConfiguration['max']) &&
                    $normalizedConfiguration['min'] > $normalizedConfiguration['max']) {
                    ajax::error('La valeur minimale ne peut pas dépasser la valeur maximale');
                    return;
                }

                if ($type === 'decimal') {
                    $step = ($configuration['step'] ?? '') === ''
                        ? 0.01
                        : floatval($configuration['step']);
                    if ($step <= 0) {
                        ajax::error('Le pas numérique doit être supérieur à zéro');
                        return;
                    }
                    $normalizedConfiguration['step'] = $step;
                }
            }

            if ($type === 'select') {
                $options = $configuration['options'] ?? [];
                if (is_string($options)) {
                    $options = preg_split('/\\R/', $options);
                }
                $options = array_values(array_unique(array_filter(
                    array_map(static fn($option) => trim((string) $option), (array) $options),
                    static fn($option) => $option !== ''
                )));

                $parentFieldId = intval($configuration['parentFieldId'] ?? 0);
                $optionsByParent = $configuration['optionsByParent'] ?? [];
                if ($parentFieldId > 0) {
                    $parentField = scenarioformField::byId($parentFieldId);
                    if ($parentField === null || $parentFieldId === $fieldId ||
                        intval($parentField->getFormId()) !== $formId ||
                        intval($parentField->getScenarioId()) !== $scenarioId ||
                        $parentField->getType() !== 'select' ||
                        intval($parentField->getConfiguration('parentFieldId', 0)) > 0) {
                        ajax::error('La liste parente doit être un autre champ de choix indépendant du même scénario');
                        return;
                    }
                    $parentOptions = $parentField->getConfiguration('options', []);
                    if (!is_array($optionsByParent) || !$optionsByParent ||
                        array_diff(array_keys($optionsByParent), $parentOptions)) {
                        ajax::error('Les valeurs parentes doivent correspondre aux choix de la liste parente');
                        return;
                    }
                    foreach ($optionsByParent as $key => $children) {
                        if (!is_array($children) || !$children) {
                            ajax::error('Chaque valeur parente doit contenir au moins un choix');
                            return;
                        }
                        $optionsByParent[$key] = array_values(array_unique(array_filter(
                            array_map(static fn($value) => trim((string) $value), $children),
                            static fn($value) => $value !== ''
                        )));
                        if (!$optionsByParent[$key]) {
                            ajax::error('Choix dépendants invalides');
                            return;
                        }
                    }
                    $normalizedConfiguration['parentFieldId'] = $parentFieldId;
                    $normalizedConfiguration['optionsByParent'] = $optionsByParent;
                }
                if (count($options) === 0 && $parentFieldId === 0) {
                    ajax::error('La liste de choix doit contenir au moins une valeur');
                    return;
                }
                $normalizedConfiguration['options'] = $options;
            }

            $comparisonFieldId = intval($configuration['comparisonFieldId'] ?? 0);
            $comparisonOperator = trim((string) ($configuration['comparisonOperator'] ?? ''));
            $comparisonMessage = trim((string) ($configuration['comparisonMessage'] ?? ''));

            if ($comparisonFieldId > 0 || $comparisonOperator !== '') {
                $allowedComparisonTypes = ['date', 'time', 'datetime'];
                $allowedComparisonOperators = ['gte', 'gt', 'lte', 'lt'];

                if (!in_array($type, $allowedComparisonTypes, true) ||
                    !in_array($comparisonOperator, $allowedComparisonOperators, true)) {
                    ajax::error('Règle de comparaison temporelle invalide');
                    return;
                }

                $comparisonField = scenarioformField::byId($comparisonFieldId);
                if ($comparisonField === null ||
                    intval($comparisonField->getFormId()) !== $formId ||
                    intval($comparisonField->getId()) === $fieldId ||
                    $comparisonField->getType() !== $type) {
                    ajax::error('Le champ de comparaison doit appartenir au même formulaire et avoir le même type');
                    return;
                }

                $normalizedConfiguration['comparisonFieldId'] = $comparisonFieldId;
                $normalizedConfiguration['comparisonOperator'] = $comparisonOperator;
                if ($comparisonMessage !== '') {
                    $normalizedConfiguration['comparisonMessage'] = $comparisonMessage;
                }
            }


            /*
            * ==========================================
            * LABEL
            * ==========================================
            *
            * Si aucun label n'est fourni,
            * le nom technique est utilisé.
            */

            if ($label === '') {

                $label = $name;

            }


            /*
            * ==========================================
            * CHAMP EXISTANT
            * ==========================================
            */

            if ($fieldId > 0) {

                $field = scenarioformField::byId(
                    $fieldId
                );


                if ($field === null) {

                    ajax::error(
                        'Champ introuvable : ' . $fieldId
                    );

                    return;
                }

                $originalDisplayOrder = $field->getDisplayOrder();


                /*
                * Vérification de l'appartenance
                * au formulaire.
                */

                if (
                    intval($field->getFormId())
                    !==
                    $formId
                ) {

                    ajax::error(
                        'Champ ne correspondant pas au formulaire'
                    );

                    return;
                }

                if (intval($field->getScenarioId()) !== $scenarioId) {
                    ajax::error('Champ ne correspondant pas au scénario');
                    return;
                }

            } else {

                /*
                * ======================================
                * NOUVEAU CHAMP
                * ======================================
                */

                $field = new scenarioformField();

                $field->setFormId(
                    $formId
                );
                $field->setScenarioId($storedScenarioId);

                /*
                 * L'ordre d'un nouveau champ est attribué par le serveur.
                 * La valeur proposée dans l'interface reste informative et
                 * une valeur vide ou nulle ne peut plus créer une série de 0.
                 */
                if ($displayOrder <= 0) {
                    $displayOrder = scenarioformField::nextDisplayOrder($formId, $storedScenarioId);
                }

            }


            /*
            * ==========================================
            * AFFECTATION
            * ==========================================
            */

            $field->setFormId(
                $formId
            );
            $field->setScenarioId($storedScenarioId);


            /*
            * Nom technique = tag
            */

            $field->setName(
                $name
            );


            /*
            * Label affiché à l'utilisateur
            */

            $field->setLabel(
                $label
            );


            /*
            * Type
            */

            $field->setType(
                $type
            );


            /*
            * Ordre d'affichage
            */

            $field->setDisplayOrder(
                $displayOrder
            );


            /*
            * Obligatoire / facultatif
            */

            $field->setRequired(
                $required
            );


            /*
            * Configuration
            *
            * Paramètres de longueur, bornes numériques
            * ou choix autorisés selon le type.
            */

            $field->setConfiguration($normalizedConfiguration);


            /*
            * ==========================================
            * SAUVEGARDE
            * ==========================================
            */
            if (!$field->save()) {

                ajax::error(
                    'Erreur sauvegarde champ'
                );

                return;
            }

            if ($fieldId > 0 && $displayOrder === $originalDisplayOrder) {
                scenarioformField::renumber($formId, $storedScenarioId);
            } else {
                scenarioformField::renumber($formId, $storedScenarioId, intval($field->getId()), $displayOrder);
            }
            $field = scenarioformField::byId(intval($field->getId()));


            /*
            * ==========================================
            * LOG
            * ==========================================
            */

            log::add(
                'scenarioform',
                'debug',
                'FIELD SAVE OK'
                . ' id=' . $field->getId()
                . ' name=' . $field->getName()
                . ' label=' . $field->getLabel()
                . ' type=' . $field->getType()
                . ' required=' . (
                    $field->getRequired()
                        ? '1'
                        : '0'
                )
            );


            /*
            * ==========================================
            * RÉPONSE AJAX
            * ==========================================
            */

            ajax::success([

                'id' =>
                    $field->getId(),

                'form_id' =>
                    $field->getFormId(),

                'name' =>
                    $field->getName(),

                'label' =>
                    $field->getLabel(),

                'type' =>
                    $field->getType(),

                'displayOrder' =>
                    $field->getDisplayOrder(),

                'required' =>
                    $field->getRequired(),

                'configuration' =>
                    $field->getConfiguration()

            ]);


            return;


        } catch (Throwable $e) {

            ajax::error(
                $e->getMessage()
            );

        }

break;

case 'removeField':

    try {

        include_file(
            'core',
            'scenarioformField',
            'class',
            'scenarioform'
        );


        $id = intval(
            init('id')
        );


        if (!$id) {

            ajax::error(
                'ID champ manquant'
            );

            return;
        }


        $field = scenarioformField::byId(
            $id
        );


        if (!$field) {

            ajax::error(
                'Champ introuvable : ' . $id
            );

            return;
        }


        $removedFormId = intval($field->getFormId());
        $removedScenarioId = $field->getScenarioId();
        if (!$field->remove()) {

            ajax::error(
                'Erreur suppression champ'
            );

            return;
        }

        scenarioformField::renumber($removedFormId, $removedScenarioId);


        log::add(
            'scenarioform',
            'debug',
            'REMOVE FIELD - SUPPRESSION OK ID=[' .
            $id .
            ']'
        );


        ajax::success();

        return;


    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'copyScenarioFields':
    try {
        $formId = intval(init('form_id'));
        $sourceFormId = intval(init('source_form_id'));
        $sourceScenarioId = intval(init('source_scenario_id'));
        $targetScenarioId = intval(init('target_scenario_id'));

        if (!$formId || !$sourceFormId || !$sourceScenarioId || $sourceFormId === $formId) {
            ajax::error('Binômes source et destination invalides');
            return;
        }
        $sourceForm = scenarioformForm::byId($sourceFormId);
        $targetForm = scenarioformForm::byId($formId);
        if ($sourceForm === null || $targetForm === null ||
            intval($sourceForm->getRequestId()) !== intval($targetForm->getRequestId())) {
            ajax::error('Les formulaires doivent appartenir à la même requête');
            return;
        }
        $targetLinks = scenarioformFormScenario::allByForm($formId, false);
        $pendingTemplate = $targetScenarioId <= 0 && count($targetLinks) === 0;
        if (scenarioformFormScenario::byFormScenario($sourceFormId, $sourceScenarioId) === null ||
            (!$pendingTemplate && scenarioformFormScenario::byFormScenario($formId, $targetScenarioId) === null)) {
            ajax::error('Association formulaire/scénario introuvable');
            return;
        }
        if (!$pendingTemplate && count($targetLinks) !== 1) {
            ajax::error('La duplication est disponible uniquement pour un formulaire associé à un seul scénario');
            return;
        }
        $targetFields = $pendingTemplate ? scenarioformField::allByForm($formId)
            : scenarioformField::allByFormScenario($formId, $targetScenarioId);
        if (count($targetFields) > 0) {
            ajax::error('Le scénario de destination possède déjà des champs');
            return;
        }

        $sourceFields = scenarioformField::allByFormScenario($sourceFormId, $sourceScenarioId);
        if (count($sourceFields) === 0 &&
            count(scenarioformFormScenario::allByForm($sourceFormId, false)) === 1) {
            $sourceFields = scenarioformField::allByForm($sourceFormId);
        }
        if (count($sourceFields) === 0) {
            ajax::error('Le scénario source ne possède aucun champ');
            return;
        }

        $connection = DB::getConnection();
        $connection->beginTransaction();
        $idMap = [];
        $copies = [];
        try {
            foreach ($sourceFields as $sourceField) {
                $configuration = $sourceField->getConfiguration();
                unset($configuration['comparisonFieldId']);
                $copy = new scenarioformField();
                $copy->setFormId($formId)
                    ->setScenarioId($pendingTemplate ? null : $targetScenarioId)
                    ->setName($sourceField->getName())
                    ->setLabel($sourceField->getLabel())
                    ->setType($sourceField->getType())
                    ->setRequired($sourceField->getRequired())
                    ->setDisplayOrder($sourceField->getDisplayOrder())
                    ->setIsEnable($sourceField->getIsEnable())
                    ->setConfiguration($configuration);
                $copy->save();
                $idMap[intval($sourceField->getId())] = intval($copy->getId());
                $copies[] = [$sourceField, $copy];
            }
            foreach ($copies as [$sourceField, $copy]) {
                $configuration = $sourceField->getConfiguration();
                $oldComparisonId = intval($configuration['comparisonFieldId'] ?? 0);
                if ($oldComparisonId > 0 && isset($idMap[$oldComparisonId])) {
                    $configuration['comparisonFieldId'] = $idMap[$oldComparisonId];
                    $copy->setConfiguration($configuration)->save();
                }
            }
            $connection->commit();
        } catch (Throwable $copyError) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $copyError;
        }

        ajax::success(['copied' => count($copies)]);
        return;
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }
break;

case 'getHistoryOverview':

    try {
        include_file('core', 'scenarioformResponse', 'class', 'scenarioform');
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');

        $overview = [];
        foreach (scenarioformResponse::all() as $response) {
            $configuration = $response->getConfiguration();
            if (!scenarioformCanReadResponseConfiguration($configuration)) {
                continue;
            }
            $historyContext = $configuration['history'] ?? [];
            $form = $response->getForm();
            $formSummary = $historyContext['form'] ?? (
                $form === null ? null : [
                    'id'   => $form->getId(),
                    'name' => $form->getName()
                ]
            );
            $overview[] = [
                'id'      => $response->getId(),
                'created' => $response->getCreated(),
                'form'    => $formSummary
            ];
        }
        ajax::success(['history' => $overview]);
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

case 'updateHistoryResponse':

    try {
        include_file('core', 'scenarioformResponse', 'class', 'scenarioform');
        include_file('core', 'scenarioformResponseValue', 'class', 'scenarioform');
        include_file('core', 'scenarioformField', 'class', 'scenarioform');
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');

        $responseId = intval(init('response_id'));
        $formId = intval(init('form_id'));
        $values = json_decode(init('values'), true);
        if (!$responseId || !$formId || !is_array($values)) {
            ajax::error('Réponse, formulaire ou valeurs invalides');
            return;
        }

        $response = scenarioformResponse::byId($responseId);
        if ($response === null || intval($response->getFormId()) !== $formId) {
            ajax::error('Réponse introuvable pour ce formulaire');
            return;
        }
        if (!scenarioformCanReadResponseConfiguration($response->getConfiguration())) {
            ajax::error('{{401 - Accès non autorisé à cette réponse}}');
            return;
        }

        $scenarioId = intval($response->getScenarioId());
        $formFields = scenarioformField::allByFormScenario($formId, $scenarioId);
        $fieldsByName = [];
        $fieldsById = [];
        foreach ($formFields as $field) {
            $fieldsByName[(string) $field->getName()] = $field;
            $fieldsById[intval($field->getId())] = $field;
        }

        $normalized = [];
        foreach ($formFields as $field) {
            $name = (string) $field->getName();
            $label = (string) $field->getLabel();
            $type = (string) $field->getType();
            $required = (bool) $field->getRequired();
            $configuration = $field->getConfiguration();
            $raw = $values[$name]['value'] ?? ($type === 'boolean' ? 0 : '');
            $value = $type === 'boolean' ? (!empty($raw) ? 1 : 0) : (string) $raw;
            $dependentWithoutChoices = false;
            if ($type === 'select') {
                $parentId = intval($configuration['parentFieldId'] ?? 0);
                if ($parentId > 0) {
                    $parent = $fieldsById[$parentId] ?? null;
                    if ($parent !== null && $parent->getType() === 'select') {
                        $parentValue = (string) ($values[$parent->getName()]['value'] ?? '');
                        $dependentWithoutChoices = empty($configuration['optionsByParent'][$parentValue] ?? []);
                    }
                }
            }

            if ($required && !$dependentWithoutChoices && ($type === 'boolean' ? !$value : trim($value) === '')) {
                throw new Exception($type === 'boolean'
                    ? 'Veuillez cocher le champ : ' . $label
                    : 'Veuillez renseigner le champ : ' . $label);
            }
            if (($dependentWithoutChoices || !$required) && $type !== 'boolean' && trim($value) === '') {
                $normalized[$name] = '';
                continue;
            }

            if ($type === 'email' && filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
                throw new Exception('Adresse e-mail invalide pour le champ : ' . $label);
            }
            if ($type === 'integer' && preg_match('/^-?\\d+$/', $value) !== 1) {
                throw new Exception('Nombre entier invalide pour le champ : ' . $label);
            }
            if ($type === 'decimal' && !is_numeric($value)) {
                throw new Exception('Nombre décimal invalide pour le champ : ' . $label);
            }
            if ($type === 'select') {
                $options = $configuration['options'] ?? [];
                $parentId = intval($configuration['parentFieldId'] ?? 0);
                if ($parentId > 0) {
                    $parent = $fieldsById[$parentId] ?? null;
                    if ($parent === null || $parent->getType() !== 'select') {
                        throw new Exception('Liste parente introuvable pour le champ : ' . $label);
                    }
                    $parentValue = (string) ($values[$parent->getName()]['value'] ?? '');
                    $options = $configuration['optionsByParent'][$parentValue] ?? [];
                }
                if (!in_array($value, $options, true)) {
                    throw new Exception('Choix invalide pour le champ : ' . $label);
                }
            }
            if ($type === 'date') {
                $date = DateTime::createFromFormat('Y-m-d', $value);
                if (!$date || $date->format('Y-m-d') !== $value) {
                    throw new Exception('Date invalide pour le champ : ' . $label);
                }
            }
            if ($type === 'datetime') {
                $value = str_replace('T', ' ', $value);
                $date = DateTime::createFromFormat('Y-m-d H:i', $value);
                if (!$date || $date->format('Y-m-d H:i') !== $value) {
                    throw new Exception('Date et heure invalides pour le champ : ' . $label);
                }
            }
            $normalized[$name] = $value;
        }

        $connection = DB::getConnection();
        $connection->beginTransaction();
        try {
            $now = date('Y-m-d H:i:s');
            foreach ($formFields as $field) {
                $name = (string) $field->getName();
                $value = $normalized[$name] ?? '';
                $stmt = $connection->prepare(
                    'SELECT id FROM scenarioform_response_value WHERE response_id = :response_id AND field_id = :field_id LIMIT 1'
                );
                $stmt->execute(['response_id' => $responseId, 'field_id' => $field->getId()]);
                $valueId = intval($stmt->fetchColumn());
                if ($valueId > 0) {
                    $stmt = $connection->prepare('UPDATE scenarioform_response_value SET value = :value, updated = :updated WHERE id = :id');
                    $stmt->execute(['value' => $value, 'updated' => $now, 'id' => $valueId]);
                } else {
                    $stmt = $connection->prepare(
                        'INSERT INTO scenarioform_response_value (response_id, field_id, field_name_snapshot, field_label_snapshot, field_type_snapshot, value, created, updated) VALUES (:response_id, :field_id, :name, :label, :type, :value, :created, :updated)'
                    );
                    $stmt->execute([
                        'response_id' => $responseId, 'field_id' => $field->getId(),
                        'name' => $field->getName(), 'label' => $field->getLabel(), 'type' => $field->getType(),
                        'value' => $value, 'created' => $now, 'updated' => $now
                    ]);
                }
            }

            $configuration = $response->getConfiguration();
            $history = $configuration['history'] ?? [];
            $snapshot = isset($history['values']) && is_array($history['values']) ? $history['values'] : [];
            $snapshotByName = [];
            foreach ($snapshot as $index => $item) {
                if (isset($item['name'])) $snapshotByName[(string) $item['name']] = $index;
            }
            foreach ($formFields as $field) {
                $item = [
                    'field_id' => $field->getId(), 'name' => $field->getName(),
                    'label' => $field->getLabel(), 'tag' => $field->getTag(),
                    'type' => $field->getType(), 'value' => $normalized[$field->getName()] ?? ''
                ];
                $name = (string) $field->getName();
                if (isset($snapshotByName[$name])) $snapshot[$snapshotByName[$name]] = $item;
                else $snapshot[] = $item;
            }
            $history['values'] = $snapshot;
            $history['values_updated_at'] = $now;
            $history['values_updated_by'] = ['id' => scenarioformCurrentUserId()];
            $configuration['history'] = $history;
            $response->setConfiguration($configuration);
            if (!$response->save()) throw new Exception('Impossible de mettre à jour la réponse');
            $connection->commit();
        } catch (Throwable $e) {
            if ($connection->inTransaction()) $connection->rollBack();
            throw $e;
        }

        // Une modification conserve l'identité de la réponse. Le retour métier
        // est exclusivement produit par le scénario associé (107, par exemple).
        $scenarioId = intval($response->getScenarioId());
        $form = $response->getForm();
        if ($form === null || $scenarioId <= 0) {
            throw new Exception('Scénario associé à la réponse introuvable');
        }
        $selectedScenario = null;
        foreach ($form->getScenarios() as $candidate) {
            if (intval($candidate->getId()) === $scenarioId) {
                $selectedScenario = $candidate;
                break;
            }
        }
        if ($selectedScenario === null || !$selectedScenario->getIsActive()) {
            throw new Exception('Scénario de modification inactif ou introuvable');
        }
        if (!isConnect('admin') && !scenarioformScenarioCanExecute($selectedScenario)) {
            throw new Exception('Droit d’exécution du scénario refusé');
        }

        $callbackToken = bin2hex(random_bytes(32));
        $response->setToken(hash('sha256', $callbackToken));
        $configuration = $response->getConfiguration();
        $history = $configuration['history'] ?? [];
        // Conserver les résultats antérieurs pour ne pas les écraser.
        if (!empty($history['scenario_results'])) {
            $history['previous_scenario_results'][] = [
                'at' => date('Y-m-d H:i:s'),
                'results' => $history['scenario_results']
            ];
        }
        $history['scenario_results'] = [[
            'scenario_id' => $scenarioId,
            'name' => $selectedScenario->getName(),
            'status' => 'pending',
            'message' => '',
            'updated_at' => null
        ]];
        $timeout = intval(config::byKey('scenario_result_timeout', 'scenarioform', 120));
        $timeout = max(30, min(86400, $timeout <= 0 ? 120 : $timeout));
        $history['result_expires_at'] = date('Y-m-d H:i:s', time() + $timeout);
        $history['launch_results'] = null;
        $configuration['history'] = $history;
        $response->setConfiguration($configuration);
        if (!$response->save()) {
            throw new Exception('Impossible de préparer le callback de modification');
        }
        $systemTags = [
            '#crud#' => 'Modification',
            '#scenarioform_response_id#' => $responseId,
            '#scenarioform_callback_token#' => $callbackToken,
            '#scenarioform_callback_url#' => scenarioform::getInternalCallbackUrl(),
            '#scenarioform_origin#' => 'scenarioform'
        ];
        $launched = $response->launchScenarios($systemTags, $scenarioId);
        if (count($launched) !== 1 || empty($launched[0]['result'])) {
            throw new Exception('Échec du lancement du scénario de modification');
        }
        ajax::success([
            'response_id' => $responseId,
            'updated' => $response->getUpdated(),
            'launched' => true
        ]);
        return;
    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

case 'getHistory':

    try {

        include_file(
            'core',
            'scenarioformResponse',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformResponseValue',
            'class',
            'scenarioform'
        );

        include_file(
            'core',
            'scenarioformField',
            'class',
            'scenarioform'
        );

        include_file('core', 'scenarioformForm', 'class', 'scenarioform');
        include_file('core', 'scenarioformRequest', 'class', 'scenarioform');

        $formId = intval(init('form_id'));

        if (!$formId) {

            ajax::error(
                'ID formulaire manquant'
            );

        }

        $responses = scenarioformResponse::allByForm($formId);

        $resultTimeoutSeconds = intval(
            config::byKey('scenario_result_timeout', 'scenarioform', 120)
        );
        if ($resultTimeoutSeconds <= 0) {
            $resultTimeoutSeconds = 120;
        }
        $resultTimeoutSeconds = max(30, min(86400, $resultTimeoutSeconds));

        $history = [];
        // Numéro d'historique lisible, propre à chaque formulaire.
        // Les réponses sont chargées de la plus récente à la plus ancienne :
        // la plus ancienne porte donc le numéro 1, sans modifier l'ID technique global.
        $historyDisplayNumber = count($responses);

        foreach ($responses as $response) {

            $configuration = $response->getConfiguration();
            if (!scenarioformCanReadResponseConfiguration($configuration)) {
                continue;
            }

            $response->expirePendingScenarioResults($resultTimeoutSeconds);

            $values = [];

            $configuration = $response->getConfiguration();
            $historyContext = $configuration['history'] ?? [];
            $form = $response->getForm();
            $request = $form === null ? null : $form->getRequest();

            $requestSummary = $historyContext['request'] ?? (
                $request === null ? null : [
                    'id'   => $request->getId(),
                    'name' => $request->getName()
                ]
            );

            $formSummary = $historyContext['form'] ?? (
                $form === null ? null : [
                    'id'   => $form->getId(),
                    'name' => $form->getName()
                ]
            );

            foreach ($response->getValues() as $responseValue) {

                $field = $responseValue->getField();

                if ($field === null) {
                    continue;
                }

                $values[] = [
                    'field_id' => $field->getId(),
                    'name'     => $field->getName(),
                    'label'    => $field->getLabel(),
                    'tag'      => $field->getTag(),
                    'type'     => $field->getType(),
                    'value'    => $responseValue->getValue()
                ];
            }

            // r105 : la table scenarioform_response_value est la source de vérité pour les
            // champs encore présents. L'instantané d'historique ne doit pas l'écraser : il peut
            // être ancien après les évolutions/mises à jour de l'historique. On ne récupère dans
            // le snapshot que les champs qui n'existent plus dans les valeurs SQL courantes.
            if (isset($historyContext['values']) && is_array($historyContext['values'])) {
                $liveFieldIds = [];
                $liveFieldNames = [];
                foreach ($values as $liveValue) {
                    $liveId = intval($liveValue['field_id'] ?? 0);
                    if ($liveId > 0) {
                        $liveFieldIds[$liveId] = true;
                    }
                    $liveName = trim((string) ($liveValue['name'] ?? ''));
                    if ($liveName !== '') {
                        $liveFieldNames[$liveName] = true;
                    }
                }
                foreach ($historyContext['values'] as $snapshotValue) {
                    if (!is_array($snapshotValue)) {
                        continue;
                    }
                    $snapshotId = intval($snapshotValue['field_id'] ?? 0);
                    $snapshotName = trim((string) ($snapshotValue['name'] ?? ''));
                    if (($snapshotId > 0 && isset($liveFieldIds[$snapshotId])) ||
                        ($snapshotName !== '' && isset($liveFieldNames[$snapshotName]))) {
                        continue;
                    }
                    $values[] = $snapshotValue;
                }
            }

            $documents = DB::Prepare(
                'SELECT d.id, d.title, d.summary, d.content, d.format_version,
                        d.event_at, d.created, d.updated, rs.scenario_id,
                        rs.scenario_name_snapshot AS scenario_name
                 FROM scenarioform_response_document d
                 INNER JOIN scenarioform_response_scenario rs ON rs.id = d.response_scenario_id
                 WHERE rs.response_id = :response_id
                 ORDER BY rs.displayOrder ASC, d.created ASC',
                ['response_id' => $response->getId()], DB::FETCH_TYPE_ALL
            );
            foreach ($documents as &$document) {
                $content = json_decode((string) ($document['content'] ?? ''), true);
                $document['sections'] = is_array($content) ? ($content['sections'] ?? []) : [];
                unset($document['content']);
            }
            unset($document);

            $history[] = [
                'id'        => $response->getId(),
                'history_id' => $historyDisplayNumber,
                'source'    => $response->getSource(),
                'created'   => $response->getCreated(),
                'updated'   => $response->getUpdated(),
                'request'   => $requestSummary,
                'form'      => $formSummary,
                'requested_scenarios' => $historyContext['requested_scenarios'] ?? [],
                'launch_results'      => $historyContext['launch_results'] ?? null,
                'scenario_results'    => $historyContext['scenario_results'] ?? [],
                'overall_status'      => $historyContext['overall_status'] ?? null,
                'documents' => $documents,
                'values'    => $values,
                'history_title_field_id' => $form === null ? 0 : intval($form->getConfiguration('history_title_field_id', 0))
            ];
            $historyDisplayNumber--;
        }

        // r102 : appliquer aussi le tri côté serveur. Cela évite qu'un rechargement AJAX
        // rétablisse l'ordre natif des réponses et garantit que le choix du sélecteur est effectif.
        $historySort = trim((string) init('sort', 'newest'));
        $historyComparable = static function ($response, $fieldKey) {
            foreach (($response['values'] ?? []) as $value) {
                $matchesField = false;
                if (strpos((string) $fieldKey, 'id:') === 0) {
                    $matchesField = intval($value['field_id'] ?? 0) === intval(substr((string) $fieldKey, 3));
                } elseif (strpos((string) $fieldKey, 'name:') === 0) {
                    $matchesField = (string) ($value['name'] ?? '') === substr((string) $fieldKey, 5);
                } else {
                    $matchesField = intval($value['field_id'] ?? 0) === intval($fieldKey);
                }
                if (!$matchesField) {
                    continue;
                }
                $raw = $value['value'] ?? null;
                if ($raw === null || trim((string) $raw) === '') {
                    return null;
                }
                $type = (string) ($value['type'] ?? 'text');
                if (in_array($type, ['integer', 'decimal'], true)) {
                    $number = str_replace(',', '.', (string) $raw);
                    return is_numeric($number) ? ['kind' => 'number', 'value' => (float) $number] : null;
                }
                if (in_array($type, ['date', 'datetime'], true)) {
                    $timestamp = strtotime((string) $raw);
                    return $timestamp === false ? null : ['kind' => 'number', 'value' => $timestamp];
                }
                if ($type === 'boolean') {
                    return ['kind' => 'number', 'value' => in_array(strtolower((string) $raw), ['1', 'true', 'oui', 'yes', 'on'], true) ? 1 : 0];
                }
                return ['kind' => 'text', 'value' => (string) $raw];
            }
            return null;
        };
        usort($history, static function ($a, $b) use ($historySort, $historyComparable) {
            if ($historySort === 'newest' || $historySort === 'oldest') {
                $av = strtotime((string) ($a['created'] ?? $a['updated'] ?? '')) ?: 0;
                $bv = strtotime((string) ($b['created'] ?? $b['updated'] ?? '')) ?: 0;
                return ($historySort === 'oldest' ? ($av <=> $bv) : ($bv <=> $av)) ?: (intval($a['id'] ?? 0) <=> intval($b['id'] ?? 0));
            }
            if ($historySort === 'number-asc' || $historySort === 'number-desc') {
                $av = intval($a['history_id'] ?? $a['id'] ?? 0);
                $bv = intval($b['history_id'] ?? $b['id'] ?? 0);
                return ($historySort === 'number-asc' ? ($av <=> $bv) : ($bv <=> $av)) ?: (intval($a['id'] ?? 0) <=> intval($b['id'] ?? 0));
            }
            if (!preg_match('/^field:(.+):(asc|desc)$/', $historySort, $matches)) {
                return 0;
            }
            $fieldKey = rawurldecode((string) $matches[1]);
            $direction = $matches[2] === 'desc' ? -1 : 1;
            $av = $historyComparable($a, $fieldKey);
            $bv = $historyComparable($b, $fieldKey);
            if ($av === null && $bv === null) return 0;
            if ($av === null) return 1;
            if ($bv === null) return -1;
            if ($av['kind'] === 'number' && $bv['kind'] === 'number') {
                $result = $av['value'] <=> $bv['value'];
            } else {
                $result = strnatcasecmp((string) $av['value'], (string) $bv['value']);
            }
            if ($result === 0) {
                $result = intval($a['history_id'] ?? $a['id'] ?? 0) <=> intval($b['history_id'] ?? $b['id'] ?? 0);
            }
            return $result * $direction;
        });

        ajax::success([
            'history' => $history
        ]);

    } catch (Throwable $e) {

        ajax::error(
            $e->getMessage()
        );

    }

break;

case 'removeHistoryResponse':

    try {
        include_file('core', 'scenarioformResponse', 'class', 'scenarioform');

        $responseId = intval(init('response_id'));
        $formId = intval(init('form_id'));

        if (!$responseId || !$formId) {
            ajax::error('Réponse ou formulaire manquant');
            return;
        }

        $response = scenarioformResponse::byId($responseId);

        if ($response === null || $response->getFormId() !== $formId) {
            ajax::error('Réponse introuvable pour ce formulaire');
            return;
        }

        if (!scenarioformCanReadResponseConfiguration($response->getConfiguration())) {
            ajax::error('{{401 - Accès non autorisé à cette réponse}}');
            return;
        }

        // Suppression différée : ne jamais effacer avant le callback authentifié.
        $scenarioId = intval($response->getScenarioId());
        $form = $response->getForm();
        if ($form === null || $scenarioId <= 0) {
            throw new Exception('Scénario de suppression introuvable');
        }
        $selectedScenario = null;
        foreach ($form->getScenarios() as $candidate) {
            if (intval($candidate->getId()) === $scenarioId) {
                $selectedScenario = $candidate;
                break;
            }
        }
        if ($selectedScenario === null || !$selectedScenario->getIsActive()) {
            throw new Exception('Scénario de suppression inactif');
        }
        if (!isConnect('admin') && !scenarioformScenarioCanExecute($selectedScenario)) {
            throw new Exception('Droit d’exécution du scénario refusé');
        }
        $configuration = $response->getConfiguration();
        $history = $configuration['history'] ?? [];
        if (($history['pending_operation'] ?? '') === 'Suppression' &&
            ($history['scenario_results'][0]['status'] ?? '') === 'pending') {
            throw new Exception('Suppression déjà en cours pour cette réponse');
        }
        $callbackToken = bin2hex(random_bytes(32));
        $response->setToken(hash('sha256', $callbackToken));
        $history['pending_operation'] = 'Suppression';
        $history['scenario_results'] = [[
            'scenario_id' => $scenarioId,
            'name' => $selectedScenario->getName(),
            'status' => 'pending', 'message' => '', 'updated_at' => null
        ]];
        $timeout = intval(config::byKey('scenario_result_timeout', 'scenarioform', 120));
        $timeout = max(30, min(86400, $timeout <= 0 ? 120 : $timeout));
        $history['result_expires_at'] = date('Y-m-d H:i:s', time() + $timeout);
        $configuration['history'] = $history;
        $response->setConfiguration($configuration);
        if (!$response->save()) {
            throw new Exception('Impossible de préparer la suppression');
        }
        $launched = $response->launchScenarios([
            '#crud#' => 'Suppression',
            '#scenarioform_response_id#' => $responseId,
            '#scenarioform_callback_token#' => $callbackToken,
            '#scenarioform_callback_url#' => scenarioform::getInternalCallbackUrl(),
            '#scenarioform_origin#' => 'scenarioform'
        ], $scenarioId);
        if (count($launched) !== 1 || empty($launched[0]['result'])) {
            throw new Exception('Lancement du scénario de suppression impossible : réponse conservée');
        }
        ajax::success(['response_id' => $responseId, 'pending' => true, 'deleted' => false]);
        return;

    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

case 'purgePreviousFormReports':

    try {
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');

        $formId = intval(init('form_id'));
        if (!$formId || scenarioformForm::byId($formId) === null) {
            ajax::error('Formulaire introuvable');
            return;
        }

        // Conserve le compte rendu le plus récent de chaque scénario pour ce
        // formulaire. L'historique des réponses reste intact : seuls les
        // anciens documents métier sont supprimés.
        $documents = DB::Prepare(
            'SELECT d.id, rs.scenario_id, rs.response_id
             FROM scenarioform_response_document d
             INNER JOIN scenarioform_response_scenario rs ON rs.id = d.response_scenario_id
             INNER JOIN scenarioform_response r ON r.id = rs.response_id
             WHERE r.form_id = :form_id
             ORDER BY rs.scenario_id ASC, d.created DESC, d.id DESC',
            ['form_id' => $formId], DB::FETCH_TYPE_ALL
        );

        $keptScenarios = [];
        $deleteIds = [];
        foreach ($documents as $document) {
            $scenarioKey = (string) intval($document['scenario_id'] ?? 0);
            if (!isset($keptScenarios[$scenarioKey])) {
                $keptScenarios[$scenarioKey] = true;
                continue;
            }
            $deleteIds[] = intval($document['id']);
        }

        $removed = 0;
        if ($deleteIds !== []) {
            $connection = DB::getConnection();
            $connection->beginTransaction();
            try {
                $delete = $connection->prepare(
                    'DELETE FROM scenarioform_response_document WHERE id = :id'
                );
                foreach ($deleteIds as $documentId) {
                    $delete->execute(['id' => $documentId]);
                    $removed += $delete->rowCount();
                }
                $connection->commit();
            } catch (Throwable $e) {
                $connection->rollBack();
                throw $e;
            }
        }

        ajax::success(['removed' => $removed, 'kept' => count($keptScenarios)]);
        return;

    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

case 'clearFormHistory':

    try {
        include_file('core', 'scenarioformForm', 'class', 'scenarioform');
        include_file('core', 'scenarioformResponse', 'class', 'scenarioform');

        $formId = intval(init('form_id'));

        if (!$formId || scenarioformForm::byId($formId) === null) {
            ajax::error('Formulaire introuvable');
            return;
        }

        $removed = 0;
        foreach (scenarioformResponse::allByForm($formId) as $response) {
            if (!scenarioformCanReadResponseConfiguration($response->getConfiguration())) {
                continue;
            }
            $response->removeWithValues();
            $removed++;
        }
        ajax::success(['removed' => $removed]);
        return;

    } catch (Throwable $e) {
        ajax::error($e->getMessage());
    }

break;

default:

    ajax::error(
        'Action inconnue : '.($_REQUEST['action'] ?? 'vide')
    );

break;

}

<?php

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';

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


session_start();

if (!isConnect()) {
    ajax::error('{{401 - Accès non autorisé}}');
}

$scenarioformAdminActions = [
    'getFormDetail', 'getScenarioList', 'createScenarioTemplate', 'createGuidedExample',
    'saveRequest', 'createRequest', 'removeRequest', 'reorderForms',
    'reorderFormScenarios', 'createForm', 'saveForm', 'removeForm',
    'getField', 'saveField', 'removeField',
    'removeHistoryResponse', 'clearFormHistory'
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

        ajax::success([

            'id'          => $form->getId(),

            'name'        => $form->getName(),

            'description' => $form->getDescription(),

            'fields'      => $fields,
            'scenarios'   => $scenarios,
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

        $formFields = $form->getFields();


        foreach ($formFields as $field) {

            $fieldName  = $field->getName();
            $fieldLabel = $field->getLabel();
            $fieldType  = $field->getType();
            $required   = $field->getRequired();


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

                } elseif ($required) {

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
                $required &&
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

            $configuration = $field->getConfiguration();
            $stringValue = (string) $fieldValue;

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

        if (count($form->getScenarios()) === 0) {

            ajax::error(
                'Aucun scénario actif associé à ce formulaire'
            );

            return;
        }

        if (!isConnect('admin')) {
            foreach ($form->getScenarios() as $scenarioToLaunch) {
                if (!scenarioformScenarioCanExecute($scenarioToLaunch)) {
                    throw new Exception(
                        'Vous ne disposez pas du droit d’exécution sur le scénario « ' .
                        $scenarioToLaunch->getName() . ' » (' .
                        'scénario #' . intval($scenarioToLaunch->getId()) . ')'
                    );
                }
            }
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

            $responseValue->setValue(
                $data['value']
            );


            if (!$responseValue->save()) {
                throw new Exception('Erreur sauvegarde valeur champ ' . $fieldName);
            }
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
            if ($scenario === null || !$scenario->getIsActive()) {
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

        $callbackUrl = scenarioform::getInternalCallbackUrl();

        $systemTags = [
            '#scenarioform_response_id#' => $response->getId(),
            '#scenarioform_callback_token#' => $callbackToken,
            '#scenarioform_callback_url#' => $callbackUrl,
            '#scenarioform_origin#' => 'scenarioform'
        ];

        $tags = array_merge($response->getTags(), $systemTags);

        $launched = $response->launchScenarios($systemTags);

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


        if (!$form->save()) {

            ajax::error(
                'Erreur sauvegarde formulaire'
            );

        }

        $scenarios = init('scenarios', []);
        $form->syncScenarios(is_array($scenarios) ? $scenarios : []);

        ajax::success([

            'id' => $form->getId(),
            'request_id' => $form->getRequestId()

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

case 'getFieldList':

    try {

        include_file(
            'core',
            'scenarioformField',
            'class',
            'scenarioform'
        );

        $formId = intval(init('form_id'));


        if (!$formId) {

            ajax::error(
                'ID formulaire manquant'
            );

        }


        $fields = scenarioformField::allByForm(
            $formId
        );


        $result = [];

        foreach ($fields as $field) {

            $result[] = [

                'id' => $field->getId(),

                'name' => $field->getName(),

                'label' => $field->getLabel(),

                'type' => $field->getType(),

                'displayOrder' => $field->getDisplayOrder(),

                'isEnable' => $field->getIsEnable(),

                'required' => $field->getRequired(),

                'configuration' => $field->getConfiguration()

            ];

        }


        ajax::success(
            $result
        );


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

                if (!$formId) {
                    ajax::error('ID formulaire manquant');
                    return;
                }

                $comparisonFields = [];
                foreach (scenarioformField::allByForm($formId) as $candidate) {
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

                    'name'          => '',

                    'label'         => '',

                    'type'          => 'text',

                    'displayOrder'  => scenarioformField::nextDisplayOrder($formId),

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
            foreach (scenarioformField::allByForm(intval($field->getFormId())) as $candidate) {
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


            if (!$formId) {

                ajax::error(
                    'ID formulaire manquant'
                );

                return;
            }


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

                if (count($options) === 0) {
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

                /*
                 * L'ordre d'un nouveau champ est attribué par le serveur.
                 * La valeur proposée dans l'interface reste informative et
                 * une valeur vide ou nulle ne peut plus créer une série de 0.
                 */
                if ($displayOrder <= 0) {
                    $displayOrder = scenarioformField::nextDisplayOrder($formId);
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


        if (!$field->remove()) {

            ajax::error(
                'Erreur suppression champ'
            );

            return;
        }


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

            $history[] = [
                'id'        => $response->getId(),
                'source'    => $response->getSource(),
                'created'   => $response->getCreated(),
                'updated'   => $response->getUpdated(),
                'request'   => $requestSummary,
                'form'      => $formSummary,
                'requested_scenarios' => $historyContext['requested_scenarios'] ?? [],
                'launch_results'      => $historyContext['launch_results'] ?? null,
                'scenario_results'    => $historyContext['scenario_results'] ?? [],
                'overall_status'      => $historyContext['overall_status'] ?? null,
                'values'    => $values
            ];
        }

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

        $response->removeWithValues();
        ajax::success(['response_id' => $responseId]);
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

        $removed = scenarioformResponse::removeAllByForm($formId);
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

<?php

class scenarioform extends eqLogic
{
    private static array $validatedLaunchContexts = [];

    public static function install()
    {
    }

    public static function update()
    {
    }

    /**
     * Crée un équipement technique par scénario Jeedom actif.
     */
    public static function ensureResultActionEquipment(): void
    {
        $legacyEquipment = self::byLogicalId('scenarioform_result_actions', 'scenarioform');
        if (is_object($legacyEquipment)) {
            $legacyEquipment->remove();
        }

        $definitions = [
            'accepted' => 'Accepter',
            'rejected' => 'Refuser',
            'warning' => 'Terminer avec avertissement',
            'error' => 'Signaler une erreur'
        ];

        $rows = DB::Prepare(
            'SELECT DISTINCT scenario_id
             FROM scenarioform_form_scenario
             WHERE isEnable = 1',
            [],
            DB::FETCH_TYPE_ALL
        );
        $associatedScenarioIds = [];
        foreach (is_array($rows) ? $rows : [] as $row) {
            $scenarioId = intval($row['scenario_id'] ?? 0);
            if ($scenarioId > 0) {
                $associatedScenarioIds[$scenarioId] = true;
            }
        }

        $enabledEquipmentIds = [];
        foreach (array_keys($associatedScenarioIds) as $scenarioId) {
            $jeedomScenario = scenario::byId($scenarioId);
            if (!is_object($jeedomScenario) || !$jeedomScenario->getIsActive()) {
                continue;
            }

            $equipmentLogicalId = 'scenarioform_result_actions_' . $scenarioId;
            $equipment = self::byLogicalId($equipmentLogicalId, 'scenarioform');

            if (!is_object($equipment)) {
                $equipment = new self();
                $equipment->setLogicalId($equipmentLogicalId);
                $equipment->setEqType_name('scenarioform');
            }

            $equipment->setName('ScenarioForm — ' . $jeedomScenario->getName());
            $equipment->setIsEnable(1);
            $equipment->setIsVisible(0);
            $equipment->setConfiguration('target_scenario_id', $scenarioId);
            $equipment->save();
            $enabledEquipmentIds[intval($equipment->getId())] = true;

            foreach ($definitions as $logicalId => $name) {
                $command = $equipment->getCmd(null, $logicalId);
                if (!is_object($command)) {
                    $command = new scenarioformCmd();
                    $command->setEqLogic_id($equipment->getId());
                    $command->setLogicalId($logicalId);
                }

                $command->setName($name);
                $command->setType('action');
                $command->setSubType('message');
                $command->setIsVisible(1);
                $command->setConfiguration('target_scenario_id', $scenarioId);
                $command->setDisplay('title_disable', 1);
                $command->setDisplay('message_placeholder', 'Message métier à restituer');
                $command->save();
            }
        }

        foreach (self::byType('scenarioform', false) as $equipment) {
            $logicalId = (string) $equipment->getLogicalId();
            if (strpos($logicalId, 'scenarioform_result_actions_') !== 0) {
                continue;
            }
            if (!isset($enabledEquipmentIds[intval($equipment->getId())])) {
                $equipment->setIsEnable(0);
                $equipment->setIsVisible(0);
                $equipment->save();
            }
        }
    }

    public static function getScenarioList(): array
    {
        self::ensureResultActionEquipment();

        $result = [];

        foreach (scenario::all() as $scenario) {

            if (!$scenario->getIsActive()) {
                continue;
            }

            $result[] = [
                'id' => $scenario->getId(),
                'name' => $scenario->getName(),
                'enabled' => true
            ];
        }

        return $result;
    }

    /**
     * Construit le bloc Code d'un scénario modèle à partir des champs du formulaire.
     */
    public static function buildScenarioTemplateCode(scenarioformForm $form): string
    {
        $variables = [];
        $usedNames = [];

        foreach ($form->getFields() as $field) {
            $tag = trim((string) $field->getTag());
            if ($tag === '') {
                continue;
            }

            $ascii = function_exists('iconv')
                ? iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $tag)
                : $tag;
            if ($ascii === false) {
                $ascii = $tag;
            }
            $variable = strtolower(preg_replace('/[^a-zA-Z0-9_]+/', '_', $ascii));
            $variable = trim($variable, '_');
            if ($variable === '' || preg_match('/^[0-9]/', $variable)) {
                $variable = 'champ_' . ($variable === '' ? intval($field->getId()) : $variable);
            }
            $variable = 'sf_' . $variable;
            $baseVariable = $variable;
            $suffix = 2;
            while (isset($usedNames[$variable])) {
                $variable = $baseVariable . '_' . $suffix;
                $suffix++;
            }
            $usedNames[$variable] = true;

            $label = trim((string) $field->getLabel());
            $label = str_replace(["\r", "\n", '*/'], [' ', ' ', '* /'], $label);
            $variables[] = [
                'tag' => '#' . trim($tag, '#') . '#',
                'variable' => $variable,
                'label' => $label === '' ? $tag : $label
            ];
        }

        $lines = [
            '$tags = $scenario->getTags();',
            '',
            '$sf_lancement_scenarioform = scenarioform::isScenarioFormContext($scenario);',
            ''
        ];

        $lines[] = 'if ($sf_lancement_scenarioform) {';
        $lines[] = '    // ========== DÉBUT — VALEURS REÇUES DE SCENARIOFORM ==========';
        $lines[] = '';
        if (count($variables) === 0) {
            $lines[] = '    // Aucun champ n’est encore défini dans ce formulaire.';
        } else {
            foreach ($variables as $item) {
                $lines[] = '    $' . $item['variable'] . ' = $tags[' . var_export($item['tag'], true) . "] ?? ''; // " . $item['label'];
            }
        }
        $lines[] = '';
        $lines[] = '    // ========== FIN — VALEURS REÇUES DE SCENARIOFORM ==========';
        $lines[] = '';
        $lines[] = '    try {';
        $lines[] = '        // ========== DÉBUT — TRAITEMENT À PERSONNALISER ==========';
        $lines[] = '';
        $lines[] = '        // Votre code ici.';
        $lines[] = '';
        $lines[] = '        // ========== FIN — TRAITEMENT À PERSONNALISER ==========';
        $lines[] = '';
        $lines[] = '        // ========== DÉBUT — MESSAGE DE RETOUR ==========';
        $lines[] = '';
        $lines[] = "        \$message = 'Traitement terminé';";
        $lines[] = '';
        $lines[] = '        // ========== FIN — MESSAGE DE RETOUR ==========';
        $lines[] = '';
        $lines[] = "        scenarioform::sendResult(\$scenario, 'accepted', \$message);";
        $lines[] = '';
        $lines[] = '    } catch (Throwable $e) {';
        $lines[] = "        scenarioform::sendResult(\$scenario, 'error', 'Erreur : ' . \$e->getMessage());";
        $lines[] = '        throw $e;';
        $lines[] = '    }';
        $lines[] = '} else {';
        $lines[] = "    \$scenario->setLog('ScenarioForm : lancement manuel ignoré par le scénario modèle.');";
        $lines[] = '}';

        return implode("\n", $lines);
    }

    /**
     * Crée un scénario Jeedom actif contenant un bloc Code modèle.
     */
    public static function createScenarioTemplate(
        scenarioformForm $form,
        string $name,
        ?string $generatedCode = null
    ): scenario
    {
        $name = trim($name);
        if ($name === '') {
            throw new Exception('Nom du scénario obligatoire');
        }

        foreach (scenario::all() as $existingScenario) {
            if (strcasecmp(trim((string) $existingScenario->getName()), $name) === 0) {
                throw new Exception('Un scénario porte déjà ce nom');
            }
        }

        $scenario = new scenario();
        $scenario->setName($name);
        $scenario->setGroup('ScenarioForm');
        $scenario->setIsActive(1);
        $scenario->setIsVisible(0);
        $scenario->setMode('provoke');
        $scenario->setDescription(
            'Scénario modèle généré depuis le formulaire « ' . $form->getName() . ' ».'
        );
        $scenario->save();

        try {
            $elementId = scenarioElement::saveAjaxElement([
                'id' => '',
                'name' => '',
                'type' => 'code',
                'options' => [],
                'order' => 0,
                'subElements' => [[
                    'id' => '',
                    'name' => 'code',
                    'type' => 'code',
                    'subtype' => 'action',
                    'options' => [
                        'enable' => 1,
                        'collapse' => 0
                    ],
                    'order' => 0,
                    'expressions' => [[
                        'id' => '',
                        'type' => 'code',
                        'subtype' => '',
                        'expression' => $generatedCode ?? self::buildScenarioTemplateCode($form),
                        'options' => [],
                        'order' => 0
                    ]]
                ]]
            ]);

            if (intval($elementId) <= 0) {
                throw new Exception('Impossible de créer le bloc Code du scénario');
            }

            $scenario->setScenarioElement([intval($elementId)]);
            $scenario->save();
            return $scenario;
        } catch (Throwable $e) {
            $scenario->remove();
            throw $e;
        }
    }

    public static function buildGuidedExampleCode(scenarioformForm $form): string
    {
        $code = self::buildScenarioTemplateCode($form);
        $businessCode = implode("\n", [
            "        if (\$sf_retour === '') {",
            "            throw new Exception('La date de retour est obligatoire.');",
            "        }",
            '',
            "        \$dateRetour = DateTimeImmutable::createFromFormat('!Y-m-d', \$sf_retour);",
            '',
            "        if (!\$dateRetour) {",
            "            throw new Exception('La date de retour est invalide.');",
            "        }",
            '',
            "        \$scenario->setLog(",
            "            'Retour prévu le ' . \$dateRetour->format('d/m/Y') .",
            "            (\$sf_commentaire !== '' ? ' — ' . \$sf_commentaire : '')",
            "        );"
        ]);

        $code = str_replace('        // Votre code ici.', $businessCode, $code);
        return str_replace(
            "        \$message = 'Traitement terminé';",
            "        \$message = 'Retour enregistré pour le ' . \$dateRetour->format('d/m/Y') . '.';",
            $code
        );
    }

    /**
     * Envoie le résultat métier du scénario courant à ScenarioForm.
     *
     * Cette méthode est volontairement utilisable en une ligne depuis un bloc
     * Code Jeedom :
     * scenarioform::sendResult($scenario, 'accepted', 'Traitement terminé');
     *
     * Si le scénario n'a pas été lancé par ScenarioForm, l'appel est ignoré
     * proprement afin que le même scénario reste exécutable manuellement.
     */
    public static function sendResult($scenario, string $status, string $message = ''): array
    {
        $allowedStatuses = ['accepted', 'rejected', 'warning', 'error'];
        if (!in_array($status, $allowedStatuses, true)) {
            log::add('scenarioform', 'error', 'Retour métier ignoré : statut invalide');
            return ['success' => false, 'skipped' => false, 'message' => 'Statut invalide'];
        }

        if (!is_object($scenario) || !method_exists($scenario, 'getTags')) {
            log::add('scenarioform', 'error', 'Retour métier impossible : contexte scénario absent');
            return ['success' => false, 'skipped' => false, 'message' => 'Contexte scénario absent'];
        }

        $tags = $scenario->getTags();
        return self::sendResultWithTags($tags, $status, $message);
    }

    public static function getInternalCallbackUrl(): string
    {
        $baseUrl = rtrim((string) network::getNetworkAccess('internal'), '/');
        $parts = parse_url($baseUrl);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        if ($baseUrl === '' || !in_array($scheme, ['http', 'https'], true) || empty($parts['host'])) {
            throw new Exception('Adresse interne Jeedom invalide pour le retour ScenarioForm');
        }

        return $baseUrl . '/plugins/scenarioform/core/api/scenarioform.php';
    }

    /**
     * Vérifie que le scénario possède un contexte ScenarioForm encore actif.
     * Cette validation protège notamment contre les tags résiduels conservés
     * par Jeedom après une exécution précédente.
     */
    public static function isScenarioFormContext($scenario): bool
    {
        if (!is_object($scenario) || !method_exists($scenario, 'getTags')) {
            return false;
        }

        $tags = $scenario->getTags();
        return is_array($tags) && self::isActiveScenarioFormTags($tags, true);
    }

    public static function isActiveScenarioFormTags(array $tags, bool $consumeLaunchTicket = false): bool
    {
        if (trim((string) ($tags['#scenarioform_origin#'] ?? '')) !== 'scenarioform') {
            return false;
        }

        $responseId = intval($tags['#scenarioform_response_id#'] ?? 0);
        $scenarioId = intval($tags['#scenarioform_scenario_id#'] ?? 0);
        $token = trim((string) ($tags['#scenarioform_callback_token#'] ?? ''));
        $callbackUrl = trim((string) ($tags['#scenarioform_callback_url#'] ?? ''));
        $launchNonce = trim((string) ($tags['#scenarioform_launch_nonce#'] ?? ''));

        if ($responseId <= 0 || $scenarioId <= 0 || $token === '' ||
            $callbackUrl === '' || $launchNonce === '') {
            return false;
        }

        $contextKey = $responseId . '::' . $scenarioId . '::' . hash('sha256', $launchNonce);
        if ($consumeLaunchTicket && !isset(self::$validatedLaunchContexts[$contextKey])) {
            $cacheKey = 'scenarioformLaunchContext::' . $responseId . '::' . $scenarioId;
            $ticketCache = cache::byKey($cacheKey);
            $ticket = $ticketCache->getValue();

            if (!is_array($ticket) ||
                intval($ticket['expires_at'] ?? 0) < time() ||
                !hash_equals(
                    (string) ($ticket['nonce_hash'] ?? ''),
                    hash('sha256', $launchNonce)
                )) {
                return false;
            }

            $ticketCache->remove();
            self::$validatedLaunchContexts[$contextKey] = true;
        }

        if (!$consumeLaunchTicket && !isset(self::$validatedLaunchContexts[$contextKey])) {
            $cacheKey = 'scenarioformLaunchContext::' . $responseId . '::' . $scenarioId;
            $ticket = cache::byKey($cacheKey)->getValue();
            if (!is_array($ticket) ||
                intval($ticket['expires_at'] ?? 0) < time() ||
                !hash_equals(
                    (string) ($ticket['nonce_hash'] ?? ''),
                    hash('sha256', $launchNonce)
                )) {
                return false;
            }
        }

        $row = DB::Prepare(
            'SELECT token, configuration
             FROM scenarioform_response
             WHERE id = :id
             LIMIT 1',
            ['id' => $responseId],
            DB::FETCH_TYPE_ROW
        );

        if (!is_array($row) ||
            !hash_equals((string) ($row['token'] ?? ''), hash('sha256', $token))) {
            return false;
        }

        $configuration = json_decode((string) ($row['configuration'] ?? ''), true);
        if (!is_array($configuration)) {
            return false;
        }

        $history = $configuration['history'] ?? [];
        $expiresAt = strtotime((string) ($history['result_expires_at'] ?? ''));
        if ($expiresAt !== false && time() >= $expiresAt) {
            return false;
        }

        foreach (($history['scenario_results'] ?? []) as $result) {
            if (intval($result['scenario_id'] ?? 0) === $scenarioId &&
                (string) ($result['status'] ?? 'pending') === 'pending') {
                return true;
            }
        }

        return false;
    }

    /**
     * Variante interne utilisée par les commandes d'action natives.
     */
    public static function sendResultWithTags(
        array $tags,
        string $status,
        string $message = ''
    ): array {
        $allowedStatuses = ['accepted', 'rejected', 'warning', 'error'];
        if (!in_array($status, $allowedStatuses, true)) {
            log::add('scenarioform', 'error', 'Retour métier ignoré : statut invalide');
            return ['success' => false, 'skipped' => false, 'message' => 'Statut invalide'];
        }

        $tagUrl = trim((string) ($tags['#scenarioform_callback_url#'] ?? ''));
        $responseId = intval($tags['#scenarioform_response_id#'] ?? 0);
        $scenarioId = intval($tags['#scenarioform_scenario_id#'] ?? 0);
        $token = trim((string) ($tags['#scenarioform_callback_token#'] ?? ''));

        if ($tagUrl === '' || $responseId <= 0 || $scenarioId <= 0 || $token === '') {
            log::add(
                'scenarioform',
                'debug',
                'Retour métier ignoré : scénario lancé hors de ScenarioForm'
            );
            return [
                'success' => true,
                'skipped' => true,
                'message' => 'Scénario lancé hors de ScenarioForm'
            ];
        }

        if (!self::isActiveScenarioFormTags($tags, true)) {
            log::add(
                'scenarioform',
                'debug',
                'Retour métier ignoré : contexte ScenarioForm absent, terminé ou expiré'
            );
            return [
                'success' => true,
                'skipped' => true,
                'message' => 'Contexte ScenarioForm inactif'
            ];
        }

        // La destination réseau est reconstruite depuis la configuration
        // interne de Jeedom. Une URL modifiée dans les tags ne peut ainsi pas
        // transformer le retour métier en requête vers un hôte arbitraire.
        $url = self::getInternalCallbackUrl();

        $payload = http_build_query([
            'response_id' => $responseId,
            'scenario_id' => $scenarioId,
            'token' => $token,
            'status' => $status,
            'message' => function_exists('mb_substr')
                ? mb_substr(trim($message), 0, 500)
                : substr(trim($message), 0, 500)
        ]);

        if (!function_exists('curl_init')) {
            log::add('scenarioform', 'error', 'Retour métier impossible : extension cURL absente');
            return ['success' => false, 'skipped' => false, 'message' => 'Extension cURL absente'];
        }

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
        ]);

        $body = curl_exec($curl);
        $curlError = curl_error($curl);
        $httpCode = intval(curl_getinfo($curl, CURLINFO_HTTP_CODE));
        curl_close($curl);

        $decoded = is_string($body) ? json_decode($body, true) : null;
        $apiSuccess = is_array($decoded) && ($decoded['success'] ?? false) === true;

        if ($curlError !== '' || $httpCode !== 200 || !$apiSuccess) {
            $detail = $curlError !== ''
                ? $curlError
                : (is_array($decoded) ? (string) ($decoded['message'] ?? '') : 'Réponse invalide');
            log::add(
                'scenarioform',
                'error',
                'Retour métier refusé pour réponse ' . $responseId .
                ', scénario ' . $scenarioId . ' (HTTP ' . $httpCode . ') : ' . $detail
            );
            return [
                'success' => false,
                'skipped' => false,
                'http_code' => $httpCode,
                'message' => $detail
            ];
        }

        log::add(
            'scenarioform',
            'info',
            'Retour métier enregistré pour réponse ' . $responseId .
            ', scénario ' . $scenarioId . ' : ' . $status
        );

        return [
            'success' => true,
            'skipped' => false,
            'http_code' => $httpCode,
            'message' => (string) ($decoded['message'] ?? 'Résultat métier enregistré')
        ];
    }
}

class scenarioformCmd extends cmd
{
    /**
     * Exécute une action graphique ScenarioForm depuis un scénario Jeedom.
     */
    public function execute($_options = [])
    {
        $status = (string) $this->getLogicalId();
        $message = trim((string) ($_options['message'] ?? ''));
        $tags = [];
        $targetScenarioId = intval($this->getConfiguration('target_scenario_id', 0));

        if (isset($_options['tags']) && is_array($_options['tags'])) {
            $tags = $_options['tags'];
        } elseif (isset($_options['scenario_tags']) && is_array($_options['scenario_tags'])) {
            $tags = $_options['scenario_tags'];
        }

        if (count($tags) === 0) {
            $scenarioId = intval($_options['scenario_id'] ?? $targetScenarioId);
            $currentScenario = $scenarioId > 0 ? scenario::byId($scenarioId) : null;

            if (is_object($currentScenario) && method_exists($currentScenario, 'getTags')) {
                $tags = $currentScenario->getTags();
            }
        }

        /*
         * Les commandes d'action sont exécutées par scenarioExpression. Selon
         * la version du core, l'objet scénario rechargé ne conserve pas les
         * tags propres au lancement. On les récupère alors directement depuis
         * le contexte d'expression encore actif.
         */
        $requiredTags = [
            '#scenarioform_response_id#',
            '#scenarioform_scenario_id#',
            '#scenarioform_callback_token#',
            '#scenarioform_callback_url#'
        ];

        foreach ($requiredTags as $tagName) {
            if (isset($tags[$tagName]) && trim((string) $tags[$tagName]) !== '') {
                continue;
            }

            $plainName = trim($tagName, '#');
            try {
                $resolvedValue = scenarioExpression::tag($plainName, '');
            } catch (Throwable $e) {
                $resolvedValue = '';
            }

            if (trim((string) $resolvedValue) !== '') {
                $tags[$tagName] = $resolvedValue;
            }
        }

        $hasCallbackTags =
            trim((string) ($tags['#scenarioform_response_id#'] ?? '')) !== '' &&
            trim((string) ($tags['#scenarioform_scenario_id#'] ?? '')) !== '' &&
            trim((string) ($tags['#scenarioform_callback_token#'] ?? '')) !== '' &&
            trim((string) ($tags['#scenarioform_callback_url#'] ?? '')) !== '';

        if ($hasCallbackTags && scenarioform::isActiveScenarioFormTags($tags)) {
            return scenarioform::sendResultWithTags($tags, $status, $message);
        }

        if ($targetScenarioId <= 0) {
            log::add('scenarioform', 'error', 'Action métier sans scénario cible');
            return ['success' => false, 'message' => 'Scénario cible absent'];
        }

        include_file('core', 'scenarioformResponse', 'class', 'scenarioform');
        return scenarioformResponse::recordLatestPendingScenarioResult(
            $targetScenarioId,
            $status,
            $message
        );
    }
}

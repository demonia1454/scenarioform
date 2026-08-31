<?php

class scenarioformResponse
{
    private ?int $id = null;

    private ?int $formId = null;

    private ?string $token = null;

    private ?string $source = null;

    private ?string $configuration = null;

    private ?string $created = null;

    private ?string $updated = null;

    /**
     * Table associée
     */
    public static function getTableName(): string
    {
        return 'scenarioform_response';
    }


    /* =========================
     * Getters / Setters
     * ========================= */

    public function getId(): ?int
    {
        return $this->id;
    }


    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }


    public function getFormId(): ?int
    {
        return $this->formId;
    }


    public function setFormId(?int $formId): self
    {
        $this->formId = $formId;
        return $this;
    }


    public function getToken(): ?string
    {
        return $this->token;
    }


    public function setToken(?string $token): self
    {
        $this->token = $token;
        return $this;
    }


    public function getSource(): ?string
    {
        return $this->source;
    }

    public function getConfiguration(): array
    {
    if (empty($this->configuration)) {
        return [];
    }

    $decoded = json_decode($this->configuration, true);

        return is_array($decoded) ? $decoded : [];
    }

    public function setConfiguration(array $configuration): self
    {
        $this->configuration = json_encode($configuration);
        return $this;
    }

    public function setSource(?string $source): self
    {
        $this->source = $source;
        return $this;
    }


    public function getCreated(): ?string
    {
        return $this->created;
    }


    public function getUpdated(): ?string
    {
        return $this->updated;
    }

    public function setCreated(?string $created): self
    {
    $this->created = $created;
    return $this;
    }

    public function setUpdated(?string $updated): self
    {
    $this->updated = $updated;
    return $this;
    }

    /* =========================
     * Relations
     * ========================= */

    public function getForm(): ?scenarioformForm
    {
        if ($this->formId === null) {
            return null;
        }

        return scenarioformForm::byId($this->formId);
    }


public function getValues(): array
{
    if ($this->id === null) {
        log::add(
            'scenarioform',
            'error',
            'GET VALUES - ID RESPONSE NULL'
        );

        return [];
    }

    $values = scenarioformResponseValue::allByResponse(
        $this->id
    );

    return $values;
}
    /**
     * Génération des tags scénario
     */

public function getTags(): array
{
    $tags = [];


    /*
     * ==========================================
     * TAG SYSTÈME : NOM DU FORMULAIRE
     * ==========================================
     */

    $form = scenarioformForm::byId(
        $this->getFormId()
    );

    if ($form !== null) {

        $tags['#formulaire#'] =
            $form->getName();
    }


    /*
     * ==========================================
     * TAGS PROVENANT DES CHAMPS
     * ==========================================
     */

    foreach ($this->getValues() as $responseValue) {

        $field = $responseValue->getField();

        if ($field === null) {
            continue;
        }


        $tag = $field->getTag();

        if (empty($tag)) {
            continue;
        }


        $tags['#' . $tag . '#'] =
            $responseValue->getValue();
    }


    return $tags;
}



        /**
         * Lance les scénarios associés à cette réponse
         */

    public function launchScenarios(array $additionalTags = []): array
    {

        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');

            $tags = array_merge($this->getTags(), $additionalTags);

            $launched = [];

            $form = $this->getForm();

            if ($form === null) {
                throw new Exception(
                    'Formulaire associé introuvable'
                );
            }


            $scenarios = $form->getScenarios();

            if (count($scenarios) === 0) {
                throw new Exception(
                    'Aucun scénario actif associé à ce formulaire'
                );
            }

            foreach ($scenarios as $scenario) {
                $scenarioTags = $tags;
                $scenarioTags['#scenarioform_scenario_id#'] = $scenario->getId();
                $launchNonce = bin2hex(random_bytes(24));
                $scenarioTags['#scenarioform_launch_nonce#'] = $launchNonce;
                $launchCacheKey =
                    'scenarioformLaunchContext::' . intval($this->getId()) .
                    '::' . intval($scenario->getId());
                cache::set($launchCacheKey, [
                    'nonce_hash' => hash('sha256', $launchNonce),
                    'expires_at' => time() + 120
                ]);
                $scenario->setTags($scenarioTags);
                $result = $scenario->launch();
                if ($result === false) {
                    cache::byKey($launchCacheKey)->remove();
                }
                $launched[] = [
                    'id'     => $scenario->getId(),
                    'name'   => $scenario->getName(),
                    'result' => $result
                ];
            }
            return $launched;
    }

    /**
     * Termine les retours restés en attente après leur échéance.
     * Le verrou évite d'écraser un callback reçu au même instant.
     */
    public function expirePendingScenarioResults(int $fallbackTimeoutSeconds): bool
    {
        if ($this->id === null) {
            return false;
        }

        $connection = DB::getConnection();
        $connection->beginTransaction();

        try {
            $statement = $connection->prepare(
                'SELECT configuration, created FROM scenarioform_response WHERE id = :id FOR UPDATE'
            );
            $statement->execute(['id' => $this->id]);
            $row = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $connection->rollBack();
                return false;
            }

            $configuration = json_decode((string) ($row['configuration'] ?? ''), true);
            if (!is_array($configuration)) {
                $configuration = [];
            }

            $results = $configuration['history']['scenario_results'] ?? [];
            $expiresAt = (string) ($configuration['history']['result_expires_at'] ?? '');
            $expiresTimestamp = $expiresAt === '' ? false : strtotime($expiresAt);

            if ($expiresTimestamp === false) {
                $createdTimestamp = strtotime((string) ($row['created'] ?? ''));
                if ($createdTimestamp === false) {
                    $createdTimestamp = time();
                }
                $expiresTimestamp = $createdTimestamp + max(30, $fallbackTimeoutSeconds);
            }

            if (time() < $expiresTimestamp) {
                $connection->rollBack();
                return false;
            }

            $changed = false;
            $now = date('Y-m-d H:i:s');
            foreach ($results as &$result) {
                if ((string) ($result['status'] ?? 'pending') !== 'pending') {
                    continue;
                }
                $result['status'] = 'timeout';
                $result['message'] = '';
                $result['updated_at'] = $now;
                $changed = true;
            }
            unset($result);

            if (!$changed) {
                $connection->rollBack();
                return false;
            }

            $configuration['history']['scenario_results'] = $results;
            $configuration['history']['overall_status'] = self::computeOverallStatus($results);

            $statement = $connection->prepare(
                'UPDATE scenarioform_response SET configuration = :configuration, updated = :updated WHERE id = :id'
            );
            $statement->execute([
                'configuration' => json_encode($configuration),
                'updated' => $now,
                'id' => $this->id
            ]);
            $connection->commit();

            $this->configuration = json_encode($configuration);
            $this->updated = $now;
            return true;
        } catch (Throwable $e) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $e;
        }
    }

    public static function computeOverallStatus(array $results): string
    {
        $statuses = array_map(
            static fn(array $result): string => (string) ($result['status'] ?? 'pending'),
            $results
        );

        foreach (['pending', 'rejected', 'error', 'timeout', 'warning'] as $status) {
            if (in_array($status, $statuses, true)) {
                return $status;
            }
        }

        return 'accepted';
    }

    public static function recordLatestPendingScenarioResult(
        int $scenarioId,
        string $status,
        string $message = ''
    ): array {
        $allowedStatuses = ['accepted', 'rejected', 'warning', 'error'];
        if ($scenarioId <= 0 || !in_array($status, $allowedStatuses, true)) {
            return ['success' => false, 'message' => 'Paramètres de résultat invalides'];
        }

        $connection = DB::getConnection();
        $connection->beginTransaction();

        try {
            $statement = $connection->prepare(
                'SELECT id, configuration FROM scenarioform_response
                 ORDER BY created DESC, id DESC LIMIT 100 FOR UPDATE'
            );
            $statement->execute();
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
            $matchedResponseId = 0;
            $matchedConfiguration = null;

            foreach ($rows as $row) {
                $configuration = json_decode((string) ($row['configuration'] ?? ''), true);
                if (!is_array($configuration)) {
                    continue;
                }

                $results = $configuration['history']['scenario_results'] ?? [];
                foreach ($results as $result) {
                    if (
                        intval($result['scenario_id'] ?? 0) === $scenarioId &&
                        (string) ($result['status'] ?? 'pending') === 'pending'
                    ) {
                        $matchedResponseId = intval($row['id']);
                        $matchedConfiguration = $configuration;
                        break 2;
                    }
                }
            }

            if ($matchedResponseId <= 0 || !is_array($matchedConfiguration)) {
                $connection->rollBack();
                log::add(
                    'scenarioform',
                    'debug',
                    'Action métier ignorée : aucune réponse en attente pour scénario ' . $scenarioId
                );
                return [
                    'success' => true,
                    'skipped' => true,
                    'message' => 'Aucune réponse ScenarioForm en attente'
                ];
            }

            $results = $matchedConfiguration['history']['scenario_results'] ?? [];
            $now = date('Y-m-d H:i:s');
            foreach ($results as &$result) {
                if (
                    intval($result['scenario_id'] ?? 0) === $scenarioId &&
                    (string) ($result['status'] ?? 'pending') === 'pending'
                ) {
                    $result['status'] = $status;
                    $result['message'] = function_exists('mb_substr')
                        ? mb_substr(trim($message), 0, 500)
                        : substr(trim($message), 0, 500);
                    $result['updated_at'] = $now;
                    break;
                }
            }
            unset($result);

            $matchedConfiguration['history']['scenario_results'] = $results;
            $matchedConfiguration['history']['overall_status'] = self::computeOverallStatus($results);

            $statement = $connection->prepare(
                'UPDATE scenarioform_response
                 SET configuration = :configuration, updated = :updated
                 WHERE id = :id'
            );
            $statement->execute([
                'configuration' => json_encode($matchedConfiguration),
                'updated' => $now,
                'id' => $matchedResponseId
            ]);
            $connection->commit();

            log::add(
                'scenarioform',
                'info',
                'Résultat local enregistré pour réponse ' . $matchedResponseId .
                ', scénario ' . $scenarioId . ' : ' . $status
            );

            return [
                'success' => true,
                'skipped' => false,
                'response_id' => $matchedResponseId,
                'scenario_id' => $scenarioId,
                'status' => $status
            ];
        } catch (Throwable $e) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            log::add('scenarioform', 'error', 'Résultat local impossible : ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur interne du retour local'];
        }
    }

        /* =========================
        * ORM Jeedom
        * ========================= */

    public function initialize(): void
    {
        // Le JSON est décodé à la demande par getConfiguration().
    }

    public function preSave(): void
    {
            $now = date('Y-m-d H:i:s');

            if ($this->created === null) {
                $this->created = $now;
            }

        $this->updated = $now;
    }


public function save(): bool
{
    $this->preSave();

    log::add(
        'scenarioform',
        'debug',
        'RESPONSE SAVE - DEBUT - id=' . var_export($this->id, true)
    );

    try {

        $connection = DB::getConnection();

        if ($this->id === null) {

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - INSERT'
            );

            $sql = '
                INSERT INTO scenarioform_response
                (
                    form_id,
                    token,
                    source,
                    configuration,
                    created,
                    updated
                )
                VALUES
                (
                    :form_id,
                    :token,
                    :source,
                    :configuration,
                    :created,
                    :updated
                )
            ';

            $params = [
                'form_id'       => $this->formId,
                'token'         => $this->token,
                'source'        => $this->source,
                'configuration' => $this->configuration,
                'created'       => $this->created,
                'updated'       => $this->updated
            ];

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - AVANT PDO PREPARE'
            );

            $stmt = $connection->prepare($sql);

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - APRES PDO PREPARE'
            );

            $stmt->execute($params);

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - APRES PDO EXECUTE'
            );

            $this->id = (int) $connection->lastInsertId();

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - INSERT ID=' . $this->id
            );

        } else {

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - UPDATE ID=' . $this->id
            );

            $sql = '
                UPDATE scenarioform_response
                SET
                    form_id = :form_id,
                    token = :token,
                    source = :source,
                    configuration = :configuration,
                    updated = :updated
                WHERE id = :id
            ';

            $params = [
                'id'            => $this->id,
                'form_id'       => $this->formId,
                'token'         => $this->token,
                'source'        => $this->source,
                'configuration' => $this->configuration,
                'updated'       => $this->updated
            ];

            $stmt = $connection->prepare($sql);

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - UPDATE PREPARE OK'
            );

            $stmt->execute($params);

            log::add(
                'scenarioform',
                'debug',
                'RESPONSE SAVE - UPDATE EXECUTE OK'
            );
        }

        log::add(
            'scenarioform',
            'debug',
            'RESPONSE SAVE - FIN OK id=' . $this->id
        );

        return true;

    } catch (Throwable $e) {

        log::add(
            'scenarioform',
            'error',
            'RESPONSE SAVE - ERREUR : '
            . $e->getMessage()
            . ' | fichier=' . $e->getFile()
            . ' | ligne=' . $e->getLine()
        );

        throw $e;
    }
}



    public function remove(): bool
    {
        return DB::remove($this);
    }

    /**
     * Supprime une réponse et toutes ses valeurs.
     */
    public function removeWithValues(): bool
    {
        if ($this->id === null) {
            throw new Exception('Réponse non sauvegardée');
        }

        $connection = DB::getConnection();

        try {
            $connection->beginTransaction();

            $statement = $connection->prepare(
                'DELETE FROM scenarioform_response_value WHERE response_id = :response_id'
            );
            $statement->execute(['response_id' => $this->id]);

            $statement = $connection->prepare(
                'DELETE FROM scenarioform_response WHERE id = :id'
            );
            $statement->execute(['id' => $this->id]);

            $connection->commit();
            return true;

        } catch (Throwable $e) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Vide l'historique d'un formulaire et renvoie le nombre de réponses supprimées.
     */
    public static function removeAllByForm(int $formId): int
    {
        $connection = DB::getConnection();

        try {
            $connection->beginTransaction();

            $statement = $connection->prepare(
                'DELETE rv FROM scenarioform_response_value rv
                 INNER JOIN scenarioform_response r ON r.id = rv.response_id
                 WHERE r.form_id = :form_id'
            );
            $statement->execute(['form_id' => $formId]);

            $statement = $connection->prepare(
                'DELETE FROM scenarioform_response WHERE form_id = :form_id'
            );
            $statement->execute(['form_id' => $formId]);
            $removed = $statement->rowCount();

            $connection->commit();
            return $removed;

        } catch (Throwable $e) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $e;
        }
    }

    /* =========================
     * Lecture
     * ========================= */

    public static function byId(int $id): ?self
    {
        $response = DB::Prepare(
            '
            SELECT 
                id,
                form_id AS formId,
                token,
                source,
                configuration,
                created,
                updated
            FROM scenarioform_response
            WHERE id = :id
            ',
            [
                'id' => $id
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($response === false || $response === null) {
            return null;
        }

        $response->initialize();

        return $response;
    }


    public static function all(): array
    {
        $responses = DB::Prepare(
            '
            SELECT
                id,
                form_id AS formId,
                token,
                source,
                configuration,
                created,
                updated
            FROM scenarioform_response
            ORDER BY created DESC
            ',
            [],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($responses === false || $responses === null) {
            return [];
        }

        foreach ($responses as $response) {
            $response->initialize();
        }

        return $responses;
    }


    public static function allByForm(int $formId): array
    {
        $responses = DB::Prepare(
            '
            SELECT 
                id,
                form_id AS formId,
                token,
                source,
                configuration,
                created,
                updated
            FROM scenarioform_response
            WHERE form_id = :form_id
            ORDER BY created DESC
            ',
            [
                'form_id' => $formId
            ],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($responses === false || $responses === null) {
            return [];
        }

        foreach ($responses as $response) {
            $response->initialize();
        }

        return $responses;
    }
}

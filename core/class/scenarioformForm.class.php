<?php

class scenarioformForm
{
    private ?int $id = null;

    private string $name = '';

    private string $description = '';

    private ?int $request_id = null;

    private $configuration = [];

    private bool $isEnable = true;

    private int $displayOrder = 0;

    private ?string $created = null;

    private ?string $updated = null;


     /**
     * Nom de la table associée
     */

    
    public function getRequestId(): ?int
    {
        return $this->request_id;
    }

    public function setRequestId(?int $requestId): self
    {
        $this->request_id = $requestId;
        return $this;
    }

    public function getRequest(): ?scenarioformRequest
    {
        if ($this->request_id === null) {
            return null;
        }

        return scenarioformRequest::byId($this->request_id);
    }

    public static function getTableName(): string
    {
        return 'scenarioform_form';
    }

    public static function getClassName(): string
    {
    return self::class;
    }

    public function getId(): ?int
    {
        return $this->id;
    }


    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getFields(): array
    {
    if ($this->id === null) {
        return [];
    }

    return scenarioformField::allByForm($this->id);
    }

    public function getName(): string
    {
        return $this->name;
    }


    public function setName(string $name): self
    {
        $this->name = trim($name);
        return $this;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getConfiguration($_key = null, $_default = null)
{
    if ($_key === null) {

        return $this->configuration;

    }

    return $this->configuration[$_key] ?? $_default;
}

public function setConfiguration($_key, $_value = null): self
{
    if ($_value === null && is_array($_key)) {

        $this->configuration = $_key;

    } else {

        $this->configuration[$_key] = $_value;

    }

    return $this;
}

    public function getIsEnable(): bool
    {
        return $this->isEnable;
    }


    public function setIsEnable(bool $isEnable): self
    {
        $this->isEnable = $isEnable;
        return $this;
    }


    public function getDisplayOrder(): int
    {
        return $this->displayOrder;
    }


    public function setDisplayOrder(int $displayOrder): self
    {
        $this->displayOrder = $displayOrder;
        return $this;
    }


    public function getCreated(): ?string
    {
        return $this->created;
    }


    public function setCreated(?string $created): self
    {
        $this->created = $created;
        return $this;
    }


    public function getUpdated(): ?string
    {
        return $this->updated;
    }


    public function setUpdated(?string $updated): self
    {
        $this->updated = $updated;
        return $this;
    }


    /**
     * Chargement automatique après lecture DB
     */
    public function initialize(): void
    {
        if ($this->configuration === null) {

            $this->configuration = [];

            return;
        }


        if (is_string($this->configuration)) {

            $this->configuration = json_decode(
                $this->configuration,
                true
            ) ?: [];

        }
    }

    /**
     * Avant sauvegarde
     */
    public function preSave(): void
    {
        $now = date('Y-m-d H:i:s');

        if ($this->created === null) {
            $this->created = $now;
        }

        $this->updated = $now;

        if (is_array($this->configuration)) {

            $this->configuration = json_encode(
                $this->configuration
            );

        }
    }

    /**
     * Recherche par ID
     */

    public static function byId(int $id): ?self
    {
        $form = DB::Prepare(
            '
            SELECT
                id,
                name,
                description,
                request_id,
                configuration,
                isEnable,
                displayOrder,
                created,
                updated
            FROM scenarioform_form
            WHERE id = :id
            ',
            [
                'id' => $id
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($form === false || $form === null) {
            return null;
        }

        $form->initialize();

        return $form;
    }


    /**
     * Recherche du formulaire associé à une requête
     */

    public static function byRequest(int $requestId): ?self
    {
        $form = DB::Prepare(
            '
            SELECT
                id,
                name,
                description,
                request_id,
                configuration,
                isEnable,
                displayOrder,
                created,
                updated
            FROM scenarioform_form
            WHERE request_id = :request_id
            AND isEnable = 1
            ORDER BY displayOrder ASC
            LIMIT 1
            ',
            [
                'request_id' => $requestId
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );


        if ($form === false || $form === null) {
            return null;
        }


        $form->initialize();

        return $form;
    }

    /**
     * Tous les formulaires actifs d'une requête, dans l'ordre d'affichage.
     */
    public static function allByRequest(int $requestId, bool $enabledOnly = true): array
    {
        $enabledClause = $enabledOnly ? ' AND isEnable = 1' : '';
        $forms = DB::Prepare(
            'SELECT id, name, description, request_id, configuration, isEnable,
                    displayOrder, created, updated
             FROM scenarioform_form
             WHERE request_id = :request_id' . $enabledClause . '
             ORDER BY displayOrder ASC, id ASC',
            ['request_id' => $requestId],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if (!is_array($forms)) {
            return [];
        }

        foreach ($forms as $form) {
            $form->initialize();
        }

        return $forms;
    }

    public static function nextDisplayOrder(int $requestId): int
    {
        $row = DB::Prepare(
            'SELECT MAX(displayOrder) AS max_order
             FROM scenarioform_form
             WHERE request_id = :request_id',
            ['request_id' => $requestId],
            DB::FETCH_TYPE_ROW
        );
        return intval($row['max_order'] ?? 0) + 1;
    }

    public function getScenarioLinks(): array
    {
        if ($this->id === null) {
            return [];
        }
        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');
        return scenarioformFormScenario::allByForm($this->id);
    }

    public function getScenarios(): array
    {
        $scenarios = [];
        foreach ($this->getScenarioLinks() as $link) {
            $scenario = $link->getScenario();
            if ($scenario !== null && $scenario->getIsActive()) {
                $scenarios[] = $scenario;
            }
        }
        return $scenarios;
    }

    /**
     * Synchronise la liste ordonnée sans recréer les associations conservées.
     */
    public function syncScenarios(array $scenarioIds): void
    {
        if ($this->id === null) {
            throw new Exception('Formulaire non sauvegardé');
        }

        include_file('core', 'scenarioformFormScenario', 'class', 'scenarioform');

        $normalized = [];
        foreach ($scenarioIds as $scenarioItem) {
            $scenarioId = intval(is_array($scenarioItem) ? ($scenarioItem['id'] ?? 0) : $scenarioItem);
            if ($scenarioId <= 0 || isset($normalized[$scenarioId])) {
                continue;
            }
            if (scenario::byId($scenarioId) === null) {
                throw new Exception('Scénario introuvable : ' . $scenarioId);
            }
            $normalized[$scenarioId] = is_array($scenarioItem)
                ? !empty($scenarioItem['expect_result'])
                : null;
        }

        DB::Prepare('START TRANSACTION', []);
        try {
            $existing = scenarioformFormScenario::allByForm($this->id, false);
            $byScenario = [];
            foreach ($existing as $link) {
                $byScenario[$link->getScenarioId()] = $link;
            }

            $order = 1;
            foreach ($normalized as $scenarioId => $expectResult) {
                $link = $byScenario[$scenarioId] ?? new scenarioformFormScenario();
                $link->setFormId($this->id)
                    ->setScenarioId($scenarioId)
                    ->setDisplayOrder($order++)
                    ->setIsEnable(true);
                if ($expectResult !== null) {
                    $link->setExpectResult($expectResult);
                }
                if (!$link->save()) {
                    throw new Exception('Impossible de sauvegarder l’association formulaire/scénario');
                }
                unset($byScenario[$scenarioId]);
            }

            foreach ($byScenario as $obsolete) {
                if (!$obsolete->remove()) {
                    throw new Exception('Impossible de supprimer une association formulaire/scénario');
                }
            }

            DB::Prepare('COMMIT', []);

            include_file('core', 'scenarioform', 'class', 'scenarioform');
            scenarioform::ensureResultActionEquipment();
        } catch (Throwable $e) {
            DB::Prepare('ROLLBACK', []);
            throw $e;
        }
    }

    /**
     * Liste des formulaires
     */
    public static function all(): array
    {
        $forms = DB::Prepare(
            '
            SELECT
                id,
                name,
                description,
                request_id,
                configuration,
                isEnable,
                displayOrder,
                created,
                updated
            FROM scenarioform_form
            ORDER BY displayOrder ASC, name ASC
            ',
            [],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($forms === false || $forms === null) {
            return [];
        }

        foreach ($forms as $form) {
            $form->initialize();
        }

        return $forms;
    }

    public static function getFormList(): array
    {
        $result = [];

        foreach (scenarioformForm::all() as $form) {

            if (!$form->getIsEnable()) {
                continue;
            }

            $result[] = [
                'id'          => $form->getId(),
                'name'        => $form->getName(),
                'description' => $form->getDescription(),
                'request_id'   => $form->getRequestId(),
                'isEnable'     => $form->getIsEnable(),
                'displayOrder' => $form->getDisplayOrder()
        ];

        }
        return $result;

    }
    //
    // Sauvegarde Jeedom native
    //
    public function save(): bool
    {
        $this->preSave();

        $configuration = $this->configuration;

        if (is_array($configuration)) {
            $this->configuration = json_encode($configuration);
        }

        DB::save($this);

        $this->configuration = $configuration;

        return true;
    }

    //
     // Suppression Jeedom native
     //
    public function remove(): bool
    {
        try {

            DB::remove($this);

            include_file('core', 'scenarioform', 'class', 'scenarioform');
            scenarioform::ensureResultActionEquipment();

            return true;

        } catch (Throwable $e) {

            log::add(
                'scenarioform',
                'error',
                $e->getMessage()
            );

            return false;
        }
    }   

}

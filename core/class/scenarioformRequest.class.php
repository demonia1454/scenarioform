<?php

class scenarioformRequest
{
    private ?int $id = null;

    private string $name = '';

    private string $description = '';

    private $configuration = [];

    private int $displayOrder = 0;

    private bool $isEnable = true;

    private ?string $created = null;

    private ?string $updated = null;


    /**
     * Table associée
     */
    public static function getTableName(): string
    {
        return 'scenarioform_request';
    }

    public static function getClassName(): string
    {
        return self::class;
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


    public function getDisplayOrder(): int
    {
        return $this->displayOrder;
    }

    public function setDisplayOrder(int $displayOrder): self
    {
        $this->displayOrder = $displayOrder;
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


    /* =========================
     * Relations
     * ========================= */

	public function getForm(): ?scenarioformForm
	{
    		if ($this->id === null) {
        	return null;
    	}

   		return scenarioformForm::byRequest($this->id);
	}

    public function getScenarioLinks(): array
    {
        if ($this->id === null) {
            return [];
        }

        return scenarioformRequestScenario::allByRequest(
            $this->id
        );
    }


    public function getScenarioIds(): array
    {
        return array_map(
            fn($link) => $link->getScenarioId(),
            $this->getScenarioLinks()
        );
    }


    public function getScenarios(): array
    {
        $scenarios = [];

        foreach ($this->getScenarioLinks() as $link) {

            $scenario = $link->getScenario();

            if ($scenario === null) {
                continue;
            }


            if (!$scenario->getIsActive()) {
                continue;
            }


            $scenarios[] = $scenario;
        }


        return $scenarios;
    }


    /* =========================
     * Gestion associations
     * ========================= */

    public function hasScenario(int $scenarioId): bool
    {
            if ($this->id === null) {
                return false;
            }

            $link = scenarioformRequestScenario::byRequestScenario(
                $this->id,
                $scenarioId
            );

            return $link !== null;
    }

    public function addScenario(int $scenarioId, int $displayOrder = 0, ): bool 
    {

        log::add(
            'scenarioform',
            'debug',
            'addScenario request='.$this->id.' scenario='.$scenarioId
        );


        if ($this->id === null) {

            log::add(
                'scenarioform',
                'debug',
                'ID requête NULL'
            );

            return false;
        }


        if ($this->hasScenario($scenarioId)) {

            log::add(
                'scenarioform',
                'debug',
                'Association déjà existante'
            );

            return true;
        }


        $scenario = scenario::byId($scenarioId);

        if ($scenario === null) {

            log::add(
                'scenarioform',
                'error',
                'Scénario inexistant : '.$scenarioId
            );

            return false;
        }


        if ($displayOrder <= 0) {

            $displayOrder = scenarioformRequestScenario::nextDisplayOrder(
                $this->id
            );

        }


        $link = new scenarioformRequestScenario();

        $link->setRequestId($this->id);
        $link->setScenarioId($scenarioId);
        $link->setDisplayOrder($displayOrder);


        log::add(
            'scenarioform',
            'debug',
            'Création lien request='.$this->id.
            ' scenario='.$scenarioId.
            ' order='.$displayOrder
        );


        $result = $link->save();


        log::add(
            'scenarioform',
            'debug',
            'Résultat save association='.($result ? 'OK' : 'KO')
        );


        return $result;
    }

    public function removeScenario(int $scenarioId): bool
    {
            if ($this->id === null) {
                log::add(
                'scenarioform',
                'debug',
                'removeScenario : ID requête NULL'
            );
            return false;
            }


            $link = scenarioformRequestScenario::byRequestScenario(
                $this->id,
                $scenarioId
            );


            if ($link === null) {
                log::add(
                'scenarioform',
                'debug',
                'removeScenario : association absente request='.
                $this->id.
                ' scenario='.
                $scenarioId
            );
                return true;
            }


            return $link->remove();
    }

    public function clearScenarios(): void
    {
        $links = $this->getScenarioLinks();

        log::add(
            'scenarioform',
            'debug',
            'clearScenarios : '.count($links).' association(s)'
        );


        foreach ($links as $link) {

            log::add(
                'scenarioform',
                'debug',
                'Lien chargé : id='.
                $link->getId().
                ' request='.
                $link->getRequestId().
                ' scenario='.
                $link->getScenarioId()
            );
            if (!$link->remove()) {

                log::add(
                    'scenarioform',
                    'error',
                    'Impossible de supprimer le lien scenario='.
                    $link->getScenarioId()
                );

            } else {

                log::add(
                    'scenarioform',
                    'debug',
                    'Suppression OK scenario='.
                    $link->getScenarioId()
                );

            }
        }
    }


    /* =========================
     * ORM Jeedom
     * ========================= */


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

        try {

            $this->preSave();

            $configuration = json_encode(
                $this->getConfiguration()
            );


            if ($this->getId() === null) {

                DB::Prepare(
                    '
                    INSERT INTO scenarioform_request
                    (
                        name,
                        description,
                        configuration,
                        displayOrder,
                        isEnable,
                        created,
                        updated
                    )
                    VALUES
                    (
                        :name,
                        :description,
                        :configuration,
                        :displayOrder,
                        :isEnable,
                        :created,
                        :updated
                    )
                    ',
                    [
                        'name' => $this->getName(),
                        'description' => $this->getDescription(),
                        'configuration' => $configuration,
                        'displayOrder' => $this->getDisplayOrder(),
                        'isEnable' => $this->getIsEnable() ? 1 : 0,
                        'created' => $this->getCreated(),
                        'updated' => $this->getUpdated()
                    ],
                    DB::FETCH_TYPE_ROW
                );


                $result = DB::Prepare(
                    'SELECT LAST_INSERT_ID() AS id',
                    [],
                    DB::FETCH_TYPE_ROW
                );


                $this->setId(
                    (int)$result['id']
                );


            } else {


                DB::Prepare(
                    '
                    UPDATE scenarioform_request
                    SET
                        name = :name,
                        description = :description,
                        configuration = :configuration,
                        displayOrder = :displayOrder,
                        isEnable = :isEnable,
                        updated = :updated
                    WHERE id = :id
                    ',
                    [
                        'id' => $this->getId(),
                        'name' => $this->getName(),
                        'description' => $this->getDescription(),
                        'configuration' => $configuration,
                        'displayOrder' => $this->getDisplayOrder(),
                        'isEnable' => $this->getIsEnable() ? 1 : 0,
                        'updated' => $this->getUpdated()
                    ],
                    DB::FETCH_TYPE_ROW
                );

            }


            return true;


        } catch(Throwable $e) {


            log::add(
                'scenarioform',
                'error',
                $e->__toString()
            );


            return false;
        }
    }
    
    public function remove(): bool
    {
        try {

            DB::remove($this);

            return true;

        } catch (Throwable $e) {

            return false;
        }
    }

    /* =========================
     * Lecture
     * ========================= */

    public static function byName(string $name): ?self
    {
        $request = DB::Prepare(
            '
            SELECT 
                    id,
                    name,
                description,
                    configuration,
                    displayOrder,
                    isEnable,
                    created,
                    updated
            FROM scenarioform_request
            WHERE name = :name
            LIMIT 1
            ',
            [
                'name' => $name
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($request === false || $request === null) {
            return null;
        }

        $request->initialize();

        return $request;
    }

    public static function byId(int $id): ?self
    {
        $request = DB::Prepare(
            '
            SELECT 
                id,
                name,
                description,
                configuration,
                displayOrder,
                isEnable,
                created,
                updated
            FROM scenarioform_request
            WHERE id = :id
            ',
            [
                'id' => $id
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );


        if ($request === false || $request === null) {
            return null;
        }


        $request->initialize();

        return $request;
    }

    public static function all(): array
    {
        $requests = DB::Prepare(
            '
            SELECT 
              id,
        name,
        description,
        configuration,
        displayOrder,
        isEnable,
        created,
        updated
                FROM scenarioform_request
                ORDER BY displayOrder ASC, name ASC
                ',
                [],
                DB::FETCH_TYPE_ALL,
                PDO::FETCH_CLASS,
                self::class
            );


            if ($requests === false || $requests === null) {
                return [];
            }


            foreach ($requests as $request) {
                $request->initialize();
            }


            return $requests;
    }
       
    public static function nextDisplayOrder(): int
    {
        $order = DB::Prepare(
            '
            SELECT MAX(displayOrder)
            FROM scenarioform_request
            ',
            [],
            DB::FETCH_TYPE_ROW
        );


        return intval($order['MAX(displayOrder)'] ?? 0) + 1;
    }
}

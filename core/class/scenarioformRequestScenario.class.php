<?php

class scenarioformRequestScenario
{
    private ?int $id = null;

    private ?int $request_id = null;

    private ?int $scenario_id = null;

    private int $displayOrder = 0;

    private bool $isEnable = true;

    private ?string $created = null;

    private ?string $updated = null;


    /**
     * Table associée
     */
    public static function getTableName(): string
    {
        return 'scenarioform_request_scenario';
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

    public function getRequestId(): ?int
    {
        return $this->request_id;
    }

    public function getScenarioId(): ?int
    {
        return $this->scenario_id;
    }

      public function getDisplayOrder(): int
    {
        return $this->displayOrder;
    }

      public function getIsEnable(): bool
    {
        return $this->isEnable;
    }

    public function getCreated(): ?string
    {
        return $this->created;
    }

      public function getUpdated(): ?string
    {
        return $this->updated;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function setRequestId(?int $requestId): self
    {
        $this->request_id = $requestId;
        return $this;
    }
 
    public function setScenarioId(?int $scenarioId): self
    {
        $this->scenario_id = $scenarioId;
        return $this;
    }

    public function setDisplayOrder(int $displayOrder): self
    {
        $this->displayOrder = $displayOrder;
        return $this;
    }

    public function setIsEnable(bool $isEnable): self
    {
        $this->isEnable = $isEnable;
        return $this;
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

    public function getRequest(): ?scenarioformRequest
    {
        if ($this->request_id === null) {
            return null;
        }

        return scenarioformRequest::byId($this->request_id);
    }


    public function getScenario(): ?scenario
    {
        if ($this->scenario_id === null) {
            return null;
        }

        $scenario = scenario::byId($this->scenario_id);
        return is_object($scenario) ? $scenario : null;
    }


    /* =========================
     * ORM Jeedom
     * ========================= */

    public function initialize(): void
    {
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
        return DB::save($this);
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
     * Lecture   By ID
     * ========================= */

	public static function byId(int $id): ?self
	{
	    $link = DB::Prepare(
        '
        SELECT
            id,
            request_id,
            scenario_id,
            displayOrder,
            isEnable,
            created,
            updated
        FROM scenarioform_request_scenario
        WHERE id = :id
        ',
        [
            'id' => $id
        ],
        DB::FETCH_TYPE_ROW,
        PDO::FETCH_CLASS,
        self::class
    );


    if ($link === false || $link === null) {
        return null;
    }


    $link->initialize();

    return $link;
}

    /* =========================
     * Lecture   By request
     * ========================= */

public static function allByRequest(int $requestId): array
{
    $links = DB::Prepare(
        '
        SELECT
            id,
            request_id,
            scenario_id,
            displayOrder,
            isEnable,
            created,
            updated
        FROM scenarioform_request_scenario
        WHERE request_id = :request_id
        AND isEnable = 1
        ORDER BY request_id ASC, displayOrder ASC
        ',
        [
            'request_id' => $requestId
        ],
        DB::FETCH_TYPE_ALL,
        PDO::FETCH_CLASS,
        self::class
    );


    if ($links === false || $links === null) {
        return [];
    }


    foreach ($links as $link) {
        $link->initialize();
    }


    return $links;
}

    /* ============================
     * Lecture by requête/scenario
     * =========================== */
	public static function byRequestScenario(
    	int $requestId,
    	int $scenarioId
	): ?self
	{
    	$link = DB::Prepare(
        '
        SELECT
            id,
            request_id,
            scenario_id,
            displayOrder,
            isEnable,
            created,
            updated
        FROM scenarioform_request_scenario
        WHERE request_id = :request_id
        AND scenario_id = :scenario_id
        ',
        [
            'request_id' => $requestId,
            'scenario_id' => $scenarioId
        ],
        DB::FETCH_TYPE_ROW,
        PDO::FETCH_CLASS,
        self::class
    );


    if ($link === false || $link === null) {
        return null;
    }


    $link->initialize();

    return $link;
}

    /* =========================
     * Lecture   All
     * ========================= */

     public static function all(): array
{
    $links = DB::Prepare(
        '
	SELECT
    	id,
    	request_id,
	    scenario_id,
    	displayOrder,
    	isEnable,
    	created,
    	updated
	FROM scenarioform_request_scenario
	ORDER BY request_id ASC, displayOrder ASC        ',
        [],
        DB::FETCH_TYPE_ALL,
        PDO::FETCH_CLASS,
        self::class
    );


    if ($links === false || $links === null) {
        return [];
    }


    foreach ($links as $link) {
        $link->initialize();
    }


    return $links;
}

 /* 
    =========================
    = Nesx display Order
    =========================== 
*/

public static function nextDisplayOrder(int $requestId): int
{
    $order = DB::Prepare(
        '
        SELECT MAX(displayOrder)
        FROM scenarioform_request_scenario
        WHERE request_id = :request_id
        ',
        [
            'request_id' => $requestId
        ],
        DB::FETCH_TYPE_ROW
    );


    return intval($order['MAX(displayOrder)'] ?? 0) + 1;
}
}

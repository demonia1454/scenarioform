<?php

class scenarioformFormScenario
{
    private ?int $id = null;
    private ?int $form_id = null;
    private ?int $scenario_id = null;
    private int $displayOrder = 0;
    private bool $isEnable = true;
    private bool $expectResult = true;
    private ?string $created = null;
    private ?string $updated = null;

    public static function getTableName(): string
    {
        return 'scenarioform_form_scenario';
    }

    public static function getClassName(): string
    {
        return self::class;
    }

    public function getId(): ?int { return $this->id; }
    public function getFormId(): ?int { return $this->form_id; }
    public function getScenarioId(): ?int { return $this->scenario_id; }
    public function getDisplayOrder(): int { return $this->displayOrder; }
    public function getIsEnable(): bool { return $this->isEnable; }
    public function getExpectResult(): bool { return $this->expectResult; }
    public function getCreated(): ?string { return $this->created; }
    public function getUpdated(): ?string { return $this->updated; }

    public function setId(?int $id): self { $this->id = $id; return $this; }
    public function setFormId(?int $formId): self { $this->form_id = $formId; return $this; }
    public function setScenarioId(?int $scenarioId): self { $this->scenario_id = $scenarioId; return $this; }
    public function setDisplayOrder(int $order): self { $this->displayOrder = $order; return $this; }
    public function setIsEnable(bool $enabled): self { $this->isEnable = $enabled; return $this; }
    public function setExpectResult(bool $expected): self { $this->expectResult = $expected; return $this; }
    public function setCreated(?string $created): self { $this->created = $created; return $this; }
    public function setUpdated(?string $updated): self { $this->updated = $updated; return $this; }

    public function getScenario(): ?scenario
    {
        if ($this->scenario_id === null) {
            return null;
        }

        $scenario = scenario::byId($this->scenario_id);
        return is_object($scenario) ? $scenario : null;
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
        DB::save($this);
        return true;
    }

    public function remove(): bool
    {
        DB::remove($this);
        return true;
    }

    public static function allByForm(int $formId, bool $enabledOnly = true): array
    {
        $enabledClause = $enabledOnly ? ' AND isEnable = 1' : '';
        $links = DB::Prepare(
            'SELECT id, form_id, scenario_id, displayOrder, isEnable, expectResult, created, updated
             FROM scenarioform_form_scenario
             WHERE form_id = :form_id' . $enabledClause . '
             ORDER BY displayOrder ASC, id ASC',
            ['form_id' => $formId],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );
        return is_array($links) ? $links : [];
    }

    public static function byFormScenario(int $formId, int $scenarioId): ?self
    {
        $link = DB::Prepare(
            'SELECT id, form_id, scenario_id, displayOrder, isEnable, expectResult, created, updated
             FROM scenarioform_form_scenario
             WHERE form_id = :form_id AND scenario_id = :scenario_id
             LIMIT 1',
            ['form_id' => $formId, 'scenario_id' => $scenarioId],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );
        return ($link === false || $link === null) ? null : $link;
    }
}

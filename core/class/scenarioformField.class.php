<?php

class scenarioformField
{
    private ?int $id = null;

    private ?int $form_id = null;

    private string $name = '';

    private string $type = '';

    private string $label = '';

    private $configuration = [];

    private int $displayOrder = 0;

    private bool $isEnable = true;

    private int $required = 0;

    private ?string $created = null;

    private ?string $updated = null;

  

    /**
     * Table associée
     */
    public static function getTableName(): string
    {
        return 'scenarioform_field';
    }

    /* =========================
     * Getters / Setters
     * ========================= */

    public function getId(): ?int
    {
        return $this->id;
    }

     public function getFormId(): ?int
    {
        return $this->form_id;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function setFormId(?int $formId): self
    {
        $this->form_id = $formId;
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


    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getTag(): string
    {
    return trim($this->name);
    }

    public function setLabel(string $label): self
    {
        $this->label = $label;
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

    public function getRequired(): int
    {
        return $this->required;
    }

    public function setRequired(bool|int $required): self
    {
        $this->required = $required ? 1 : 0;
        return $this;
    }

    /******************************
    * Relation avec le formulaire * 
    ******************************/

        public function getForm(): ?scenarioformForm
        {
        if ($this->form_id === null) {
            return null;
        }

        return scenarioformForm::byId($this->form_id);
    }

    /******************************
    *    Initialisation JSON      *
    ******************************/

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
    /******************************
    *       Avant sauvegarde      *
    ******************************/

    public function preSave(): void
    {
        $now = date('Y-m-d H:i:s');

        if ($this->created === null) {
            $this->created = $now;
        }

        $this->updated = $now;
    }

    /******************************
    *      Lecture par ID         *
    ******************************/

    public static function byId(int $id): ?self
    {
        $field = DB::Prepare(
            '
        SELECT *
        FROM scenarioform_field
        WHERE id = :id           
            ',
            [
                'id' => $id
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($field === false || $field === null) {
            return null;
        }

        $field->initialize();

        return $field;
    }
    /******************************
    *   Champs d'un formulaire     *
    ******************************/

    public static function allByForm(int $formId): array
    {
        $fields = DB::Prepare(
            '
            SELECT *
            FROM scenarioform_field
            WHERE form_id = :form_id
            ORDER BY displayOrder ASC, id ASC
            ',
            [
                'form_id' => $formId
            ],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($fields === false || $fields === null) {
            return [];
        }

        foreach ($fields as $field) {
            $field->initialize();
        }

        return $fields;
    }

    /**
     * Prochain ordre disponible pour un nouveau champ du formulaire.
     *
     * Le calcul est volontairement réalisé côté serveur : l'interface peut
     * afficher cette valeur, mais elle ne doit pas être la source d'autorité.
     */
    public static function nextDisplayOrder(int $formId): int
    {
        $row = DB::Prepare(
            '
            SELECT COALESCE(MAX(displayOrder), 0) AS max_order
            FROM scenarioform_field
            WHERE form_id = :form_id
            ',
            ['form_id' => $formId],
            DB::FETCH_TYPE_ROW
        );

        return intval($row['max_order'] ?? 0) + 1;
    }

    /************************
    *       Persistance     *
    ************************/

    public function save(): bool
    {
        $this->preSave();

        $configurationArray = $this->configuration;

        $this->configuration = json_encode(
            $configurationArray
        );

        DB::save($this);

        $this->configuration = $configurationArray;

        return true;
    }


    //
    // Suppression Jeedom native
    //
    public function remove(): bool
    {
        try {

            DB::remove($this);

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

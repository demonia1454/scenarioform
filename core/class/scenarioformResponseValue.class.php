<?php

class scenarioformResponseValue
{
    private ?int $id = null;

    private ?int $responseId = null;

    private ?int $fieldId = null;

    private ?string $value = null;

    private ?string $created = null;

    private ?string $updated = null;

    /**
     * Table associée
     */
    public static function getTableName(): string
    {
        return 'scenarioform_response_value';
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


    public function getResponseId(): ?int
    {
        return $this->responseId;
    }


    public function setResponseId(?int $responseId): self
    {
        $this->responseId = $responseId;
        return $this;
    }


    public function getFieldId(): ?int
    {
        return $this->fieldId;
    }


    public function setFieldId(?int $fieldId): self
    {
        $this->fieldId = $fieldId;
        return $this;
    }


    public function getValue(): ?string
    {
        return $this->value;
    }


    public function setValue(?string $value): self
    {
        $this->value = $value;
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

    public function getField(): ?scenarioformField
    {
        if ($this->fieldId === null) {
            return null;
        }

        return scenarioformField::byId($this->fieldId);
    }


    public function getResponse(): ?scenarioformResponse
    {
        if ($this->responseId === null) {
            return null;
        }

        return scenarioformResponse::byId($this->responseId);
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
    $this->preSave();

    try {

        $connection = DB::getConnection();

        if ($this->id === null) {

            $sql = '
                INSERT INTO scenarioform_response_value
                (
                    response_id,
                    field_id,
                    value,
                    created,
                    updated
                )
                VALUES
                (
                    :response_id,
                    :field_id,
                    :value,
                    :created,
                    :updated
                )
            ';

            $params = [
                'response_id' => $this->responseId,
                'field_id'    => $this->fieldId,
                'value'       => $this->value,
                'created'     => $this->created,
                'updated'     => $this->updated
            ];

            $stmt = $connection->prepare($sql);

            $stmt->execute($params);

            $this->id = (int) $connection->lastInsertId();

        } else {

            $sql = '
                UPDATE scenarioform_response_value
                SET
                    response_id = :response_id,
                    field_id = :field_id,
                    value = :value,
                    updated = :updated
                WHERE id = :id
            ';

            $params = [
                'id'          => $this->id,
                'response_id' => $this->responseId,
                'field_id'    => $this->fieldId,
                'value'       => $this->value,
                'updated'     => $this->updated
            ];

            $stmt = $connection->prepare($sql);

            $stmt->execute($params);
        }

        return true;

    } catch (Throwable $e) {

        log::add(
            'scenarioform',
            'error',
            'RESPONSE VALUE SAVE - ERREUR : '
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


    /* =========================
     * Lecture
     * ========================= */

    public static function byId(int $id): ?self
    {
        $value = DB::Prepare(
            '
            SELECT 
                id,
                response_id AS responseId,
                field_id AS fieldId,
                value,
                created
            FROM scenarioform_response_value
            WHERE id = :id
            ',
            [
                'id' => $id
            ],
            DB::FETCH_TYPE_ROW,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($value === false || $value === null) {
            return null;
        }

        $value->initialize();

        return $value;
    }


    public static function allByResponse(int $responseId): array
    {
        $values = DB::Prepare(
            '
            SELECT
                id,
                response_id AS responseId,
                field_id AS fieldId,
                value,
                created  
            FROM scenarioform_response_value
            WHERE response_id = :response_id
            ORDER BY id
            ',
            [
                'response_id' => $responseId
            ],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($values === false || $values === null) {
            return [];
        }

        foreach ($values as $value) {
            $value->initialize();
        }

        return $values;
    }


    public static function allByField(int $fieldId): array
    {
        $values = DB::Prepare(
            '
            SELECT 
                id,
                response_id AS responseId,
                field_id AS fieldId,
                value,
                created
            FROM scenarioform_response_value
            WHERE field_id = :field_id
            ORDER BY id
            ',
            [
                'field_id' => $fieldId
            ],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($values === false || $values === null) {
            return [];
        }
 foreach ($values as $value) {
            $value->initialize();
        }
        return $values;
    }


    public static function all(): array
    {
        $values = DB::Prepare(
            '
            SELECT 
                id,
                response_id AS responseId,
                field_id AS fieldId,
                value,
                created
            FROM scenarioform_response_value
            ORDER BY id
            ',
            [],
            DB::FETCH_TYPE_ALL,
            PDO::FETCH_CLASS,
            self::class
        );

        if ($values === false || $values === null) {
            return [];
        }
 foreach ($values as $value) {
            $value->initialize();
        }
        return $values;
    }
}

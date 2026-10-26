<?php

/**
 * Accès aux correspondances entre réponses ScenarioForm et événements Google Agenda.
 * La création de la table reste gérée par plugin_info/install.php.
 */
class scenarioformGoogleCalendar
{
    public static function getTableName(): string
    {
        return 'scenarioform_googlecalendar';
    }

    public static function byResponseId(int $responseId, ?PDO $connection = null): array
    {
        $connection = $connection ?? DB::getConnection();
        $statement = $connection->prepare('SELECT * FROM scenarioform_googlecalendar WHERE response_id = :response_id ORDER BY id ASC');
        $statement->execute(['response_id' => $responseId]);
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function byGoogleEvent(string $calendarId, string $googleEventId, ?PDO $connection = null): ?array
    {
        $connection = $connection ?? DB::getConnection();
        $statement = $connection->prepare('SELECT * FROM scenarioform_googlecalendar WHERE calendar_id = :calendar_id AND google_event_id = :google_event_id LIMIT 1');
        $statement->execute(['calendar_id' => $calendarId, 'google_event_id' => $googleEventId]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    public static function save(int $responseId, string $eventType, string $googleEventId, string $calendarId = '', ?PDO $connection = null): void
    {
        $connection = $connection ?? DB::getConnection();
        $statement = $connection->prepare('INSERT INTO scenarioform_googlecalendar (response_id, event_type, google_event_id, calendar_id) VALUES (:response_id, :event_type, :google_event_id, :calendar_id) ON DUPLICATE KEY UPDATE response_id = VALUES(response_id), event_type = VALUES(event_type)');
        $statement->execute(['response_id' => $responseId, 'event_type' => $eventType, 'google_event_id' => $googleEventId, 'calendar_id' => $calendarId]);
    }

    public static function deleteByResponseId(int $responseId, ?PDO $connection = null): int
    {
        $connection = $connection ?? DB::getConnection();
        $statement = $connection->prepare('DELETE FROM scenarioform_googlecalendar WHERE response_id = :response_id');
        $statement->execute(['response_id' => $responseId]);
        return $statement->rowCount();
    }

    public static function deleteByGoogleEvent(string $calendarId, string $googleEventId, ?PDO $connection = null): int
    {
        $connection = $connection ?? DB::getConnection();
        $statement = $connection->prepare('DELETE FROM scenarioform_googlecalendar WHERE calendar_id = :calendar_id AND google_event_id = :google_event_id');
        $statement->execute(['calendar_id' => $calendarId, 'google_event_id' => $googleEventId]);
        return $statement->rowCount();
    }
}

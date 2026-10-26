<?php

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
require_once dirname(__FILE__) . '/../class/scenarioformGoogleCalendar.class.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function scenarioform_api_response(
    bool $success,
    string $message,
    array $data = [],
    ?int $statusCode = null
): void
{
    http_response_code($statusCode ?? ($success ? 200 : 400));
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

try {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
        scenarioform_api_response(false, 'Méthode non autorisée', [], 405);
    }

    $clientAddress = function_exists('getClientIp') ? (string) getClientIp() : 'unknown';
    $rateLimitKey = 'scenarioformCallbackRate::' . hash('sha256', $clientAddress);
    $rateLimitCache = cache::byKey($rateLimitKey);
    $rateLimit = $rateLimitCache->getValue();
    $nowTimestamp = time();
    if (!is_array($rateLimit) || intval($rateLimit['reset_at'] ?? 0) <= $nowTimestamp) {
        $rateLimit = ['count' => 0, 'reset_at' => $nowTimestamp + 60];
    }
    $rateLimit['count'] = intval($rateLimit['count'] ?? 0) + 1;
    cache::set($rateLimitKey, $rateLimit);
    if ($rateLimit['count'] > 120) {
        scenarioform_api_response(false, 'Trop de retours reçus', [], 429);
    }

    $payload = $_POST;
    $contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? '');

    if (stripos($contentType, 'application/json') !== false) {
        $decoded = json_decode((string) file_get_contents('php://input'), true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    $responseId = intval($payload['response_id'] ?? 0);
    $scenarioId = intval($payload['scenario_id'] ?? 0);
    $token = trim((string) ($payload['token'] ?? ''));
    $status = trim((string) ($payload['status'] ?? ''));
    $message = trim((string) ($payload['message'] ?? ''));
    $document = [];
    if (isset($payload['document']) && $payload['document'] !== '') {
        $decodedDocument = is_array($payload['document'])
            ? $payload['document'] : json_decode((string) $payload['document'], true);
        if (!is_array($decodedDocument)) {
            scenarioform_api_response(false, 'Compte rendu invalide');
        }
        $document = scenarioform::normalizeResultDocument($decodedDocument);
    }
    $allowedStatuses = ['accepted', 'rejected', 'warning', 'error'];

    if ($responseId <= 0 || $scenarioId <= 0 || $token === '' ||
        !in_array($status, $allowedStatuses, true)) {
        scenarioform_api_response(false, 'Paramètres de retour invalides');
    }

    $message = function_exists('mb_substr')
        ? mb_substr($message, 0, 500)
        : substr($message, 0, 500);

    $connection = DB::getConnection();
    $connection->beginTransaction();

    $statement = $connection->prepare(
        'SELECT token, configuration
         FROM scenarioform_response
         WHERE id = :id
         FOR UPDATE'
    );
    $statement->execute(['id' => $responseId]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$row || !hash_equals((string) $row['token'], hash('sha256', $token))) {
        $connection->rollBack();
        scenarioform_api_response(false, 'Retour non autorisé');
    }

    $configuration = json_decode((string) ($row['configuration'] ?? ''), true);
    if (!is_array($configuration)) {
        $configuration = [];
    }

    $results = $configuration['history']['scenario_results'] ?? [];
    $matched = false;
    $now = date('Y-m-d H:i:s');

    foreach ($results as &$result) {
        if (intval($result['scenario_id'] ?? 0) !== $scenarioId) {
            continue;
        }

        $matched = true;
        $currentStatus = (string) ($result['status'] ?? 'pending');
        if ($currentStatus !== 'pending' && $currentStatus !== $status) {
            unset($result);
            $connection->rollBack();
            scenarioform_api_response(false, 'Ce scénario a déjà fourni un résultat définitif');
        }

        $result['status'] = $status;
        $result['message'] = $message;
        $result['updated_at'] = $now;
        break;
    }
    unset($result);

    if (!$matched) {
        $connection->rollBack();
        scenarioform_api_response(false, 'Scénario non associé à cette réponse');
    }

    $scenarioStatement = $connection->prepare(
        'SELECT id FROM scenarioform_response_scenario
         WHERE response_id = :response_id AND scenario_id = :scenario_id
         LIMIT 1 FOR UPDATE'
    );
    $scenarioStatement->execute(['response_id' => $responseId, 'scenario_id' => $scenarioId]);
    $responseScenarioId = intval($scenarioStatement->fetchColumn());
    if ($responseScenarioId <= 0) {
        $connection->rollBack();
        scenarioform_api_response(false, 'Résultat de scénario normalisé introuvable');
    }

    $scenarioUpdate = $connection->prepare(
        'UPDATE scenarioform_response_scenario
         SET business_status = :status, business_message = :message, updated = :updated
         WHERE id = :id'
    );
    $scenarioUpdate->execute(['id' => $responseScenarioId, 'status' => $status, 'message' => $message, 'updated' => $now]);

    if ($document !== []) {
        $documentDelete = $connection->prepare(
            'DELETE FROM scenarioform_response_document WHERE response_scenario_id = :response_scenario_id'
        );
        $documentDelete->execute(['response_scenario_id' => $responseScenarioId]);
        $documentInsert = $connection->prepare(
            'INSERT INTO scenarioform_response_document
             (response_scenario_id, title, summary, content, format_version, event_at, created, updated)
             VALUES (:response_scenario_id, :title, :summary, :content, 1, :event_at, :created, :updated)'
        );
        $documentInsert->execute([
            'response_scenario_id' => $responseScenarioId,
            'title' => $document['title'], 'summary' => $document['summary'],
            'content' => json_encode(['sections' => $document['sections']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'event_at' => $document['event_at'] !== '' ? $document['event_at'] : null,
            'created' => $now, 'updated' => $now
        ]);
    }

    $statuses = array_map(
        static fn(array $result): string => (string) ($result['status'] ?? 'pending'),
        $results
    );

    if (in_array('pending', $statuses, true)) {
        $overallStatus = 'pending';
    } elseif (in_array('rejected', $statuses, true)) {
        $overallStatus = 'rejected';
    } elseif (in_array('error', $statuses, true)) {
        $overallStatus = 'error';
    } elseif (in_array('timeout', $statuses, true)) {
        $overallStatus = 'timeout';
    } elseif (in_array('warning', $statuses, true)) {
        $overallStatus = 'warning';
    } else {
        $overallStatus = 'accepted';
    }

    $configuration['history']['scenario_results'] = $results;
    $configuration['history']['overall_status'] = $overallStatus;

    $statement = $connection->prepare(
        'UPDATE scenarioform_response
         SET configuration = :configuration, overall_status = :overall_status,
             result_excerpt = :result_excerpt, completed = :completed, updated = :updated
         WHERE id = :id'
    );
    $statement->execute([
        'id' => $responseId,
        'configuration' => json_encode($configuration),
        'overall_status' => $overallStatus,
        'result_excerpt' => $message,
        'completed' => $overallStatus === 'pending' ? null : $now,
        'updated' => $now
    ]);

    // Suppression : seule une confirmation acceptée, associée au token
    // de la réponse et à l'opération en attente, autorise l'effacement.
    $pendingOperation = (string) ($configuration['history']['pending_operation'] ?? '');
    if ($pendingOperation === 'Suppression' && $status === 'accepted') {
        // Le 107 ne doit envoyer accepted qu'après confirmation explicite du 108.
        // Nettoyage SQL et effacement ScenarioForm dans une même transaction.
        scenarioformGoogleCalendar::deleteByResponseId($responseId, $connection);
        $delete = $connection->prepare('DELETE FROM scenarioform_response WHERE id = :id');
        $delete->execute(['id' => $responseId]);
        if ($delete->rowCount() !== 1) {
            throw new Exception('Réponse non supprimée');
        }
        $connection->commit();
        scenarioform_api_response(true, 'Suppression confirmée', [
            'response_id' => $responseId, 'deleted' => true
        ]);
    }
    if ($pendingOperation === 'Suppression') {
        unset($configuration['history']['pending_operation']);
        $clear = $connection->prepare('UPDATE scenarioform_response SET configuration = :configuration WHERE id = :id');
        $clear->execute(['configuration' => json_encode($configuration), 'id' => $responseId]);
    }
    $connection->commit();

    scenarioform_api_response(true, 'Résultat métier enregistré', [
        'response_id' => $responseId,
        'scenario_id' => $scenarioId,
        'status' => $status,
        'overall_status' => $overallStatus
    ]);

} catch (Throwable $e) {
    if (isset($connection) && $connection->inTransaction()) {
        $connection->rollBack();
    }
    log::add('scenarioform', 'error', 'CALLBACK SCENARIO - ' . $e->getMessage());
    scenarioform_api_response(false, 'Erreur interne lors du retour métier');
}

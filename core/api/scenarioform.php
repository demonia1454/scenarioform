<?php

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';

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
         SET configuration = :configuration, updated = :updated
         WHERE id = :id'
    );
    $statement->execute([
        'id' => $responseId,
        'configuration' => json_encode($configuration),
        'updated' => $now
    ]);

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

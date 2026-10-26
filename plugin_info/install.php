<?php

/**
 * Charge explicitement les classes du plugin pendant les hooks d'installation.
 * L'autoload Jeedom peut ne pas encore les connaître lors d'une installation
 * fraîche ou immédiatement après la mise à jour des fichiers.
 */
function scenarioform_load_plugin_classes(): void
{
    $classDirectory = dirname(__FILE__) . '/../core/class/';
    foreach ([
        'scenarioformRequest',
        'scenarioformRequestScenario',
        'scenarioformForm',
        'scenarioformFormScenario',
        'scenarioformField',
        'scenarioformResponse',
        'scenarioformResponseValue',
        'scenarioform'
    ] as $className) {
        require_once $classDirectory . $className . '.class.php';
    }
}

function scenarioform_run_queries(array $queries): void
{
    foreach ($queries as $query) {
        try {
            DB::Prepare($query, []);
        } catch (Throwable $e) {
            throw new Exception('Erreur pendant la migration ScenarioForm : ' . $e->getMessage());
        }
    }
}

/**
 * Ajoute une clé étrangère uniquement si elle n'existe pas déjà.
 *
 * Les installations historiques peuvent déjà contenir ces contraintes :
 * la migration doit donc rester idempotente.
 */
function scenarioform_ensure_foreign_key(
    string $table,
    string $constraint,
    string $definition
): void {
    $row = DB::Prepare(
        "SELECT COUNT(*) AS constraint_count
         FROM information_schema.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND CONSTRAINT_NAME = :constraint_name
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
        [
            'table_name' => $table,
            'constraint_name' => $constraint
        ],
        DB::FETCH_TYPE_ROW
    );

    if (intval($row['constraint_count'] ?? 0) > 0) {
        return;
    }

    try {
        DB::Prepare(
            'ALTER TABLE `' . $table . '` ADD CONSTRAINT `' . $constraint . '` ' . $definition,
            []
        );
    } catch (Throwable $e) {
        throw new Exception(
            'Impossible d’ajouter la contrainte ' . $constraint .
            ' (vérifiez l’absence de données orphelines) : ' . $e->getMessage()
        );
    }
}

function scenarioform_install()
{
    if (config::byKey('displayMobilePanel', 'scenarioform', null) === null) {
        config::save('displayMobilePanel', 1, 'scenarioform');
    }
    scenarioform_load_plugin_classes();

    scenarioform_run_queries([
        "CREATE TABLE IF NOT EXISTS `scenarioform_googlecalendar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `response_id` int(10) unsigned NOT NULL,
  `event_type` varchar(100) NOT NULL DEFAULT 'principal',
  `google_event_id` varchar(255) NOT NULL,
  `calendar_id` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_google_event` (`calendar_id`,`google_event_id`),
  KEY `idx_response` (`response_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_request` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `configuration` LONGTEXT NULL,
            `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
            `displayOrder` INT NOT NULL DEFAULT 0,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            KEY `idx_scenarioform_request_order` (`displayOrder`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_form` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `request_id` INT UNSIGNED NULL,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `configuration` LONGTEXT NULL,
            `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
            `displayOrder` INT NOT NULL DEFAULT 0,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            KEY `idx_scenarioform_form_request_order` (`request_id`, `displayOrder`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "ALTER TABLE `scenarioform_form` ADD COLUMN IF NOT EXISTS `request_id` INT UNSIGNED NULL AFTER `id`",
        "ALTER TABLE `scenarioform_form` ADD INDEX IF NOT EXISTS `idx_scenarioform_form_request_order` (`request_id`, `displayOrder`)",
        "CREATE TABLE IF NOT EXISTS `scenarioform_request_scenario` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `request_id` INT UNSIGNED NOT NULL,
            `scenario_id` INT UNSIGNED NOT NULL,
            `displayOrder` INT NOT NULL DEFAULT 0,
            `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_request_scenario` (`request_id`, `scenario_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_form_scenario` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `form_id` INT UNSIGNED NOT NULL,
            `scenario_id` INT UNSIGNED NOT NULL,
            `displayOrder` INT NOT NULL DEFAULT 0,
            `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
            `expectResult` TINYINT(1) NOT NULL DEFAULT 1,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_form_scenario` (`form_id`, `scenario_id`),
            KEY `idx_form_scenario_order` (`form_id`, `displayOrder`),
            CONSTRAINT `fk_scenarioform_form_scenario_form`
                FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "ALTER TABLE `scenarioform_form_scenario` ADD COLUMN IF NOT EXISTS `expectResult` TINYINT(1) NOT NULL DEFAULT 1 AFTER `isEnable`",
        "CREATE TABLE IF NOT EXISTS `scenarioform_field` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `form_id` INT UNSIGNED NOT NULL,
            `scenario_id` INT UNSIGNED NULL,
            `name` VARCHAR(255) NOT NULL DEFAULT '',
            `label` VARCHAR(255) NOT NULL DEFAULT '',
            `type` VARCHAR(50) NOT NULL DEFAULT '',
            `required` TINYINT(1) NOT NULL DEFAULT 0,
            `configuration` LONGTEXT NULL,
            `displayOrder` INT NOT NULL DEFAULT 0,
            `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            KEY `idx_form_id` (`form_id`),
            KEY `idx_form_scenario_fields` (`form_id`, `scenario_id`, `displayOrder`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_response` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `form_id` INT UNSIGNED NOT NULL,
            `scenario_id` INT UNSIGNED NULL,
            `user_id` INT UNSIGNED NULL,
            `request_name_snapshot` VARCHAR(255) NULL,
            `form_name_snapshot` VARCHAR(255) NULL,
            `overall_status` VARCHAR(32) NULL,
            `result_excerpt` VARCHAR(500) NULL,
            `completed` DATETIME NULL,
            `token` VARCHAR(64) NULL,
            `source` VARCHAR(50) NULL,
            `configuration` LONGTEXT NULL,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            KEY `idx_response_form_id` (`form_id`),
            KEY `idx_response_history` (`form_id`, `user_id`, `created`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_response_value` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `response_id` INT UNSIGNED NOT NULL,
            `field_id` INT UNSIGNED NOT NULL,
            `field_name_snapshot` VARCHAR(255) NULL,
            `field_label_snapshot` VARCHAR(255) NULL,
            `field_type_snapshot` VARCHAR(50) NULL,
            `value` LONGTEXT NULL,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            KEY `idx_response_id` (`response_id`),
            KEY `idx_field_id` (`field_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_response_scenario` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `response_id` INT UNSIGNED NOT NULL,
            `scenario_id` INT UNSIGNED NULL,
            `scenario_name_snapshot` VARCHAR(255) NOT NULL,
            `displayOrder` INT NOT NULL DEFAULT 0,
            `expectResult` TINYINT(1) NOT NULL DEFAULT 1,
            `launch_status` VARCHAR(32) NULL,
            `business_status` VARCHAR(32) NULL,
            `business_message` TEXT NULL,
            `created` DATETIME NULL,
            `updated` DATETIME NULL,
            PRIMARY KEY (`id`),
            KEY `idx_response_scenario_response` (`response_id`, `displayOrder`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS `scenarioform_response_document` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `response_scenario_id` INT UNSIGNED NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `summary` TEXT NULL,
            `content` LONGTEXT NOT NULL,
            `format_version` INT UNSIGNED NOT NULL DEFAULT 1,
            `event_at` DATETIME NULL,
            `created` DATETIME NOT NULL,
            `updated` DATETIME NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_response_document_scenario` (`response_scenario_id`),
            KEY `idx_response_document_scenario` (`response_scenario_id`, `created`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "ALTER TABLE `scenarioform_response_value` ADD COLUMN IF NOT EXISTS `updated` DATETIME NULL AFTER `created`",
        "ALTER TABLE `scenarioform_response_value` ADD COLUMN IF NOT EXISTS `field_name_snapshot` VARCHAR(255) NULL AFTER `field_id`",
        "ALTER TABLE `scenarioform_response_value` ADD COLUMN IF NOT EXISTS `field_label_snapshot` VARCHAR(255) NULL AFTER `field_name_snapshot`",
        "ALTER TABLE `scenarioform_response_value` ADD COLUMN IF NOT EXISTS `field_type_snapshot` VARCHAR(50) NULL AFTER `field_label_snapshot`",
        "ALTER TABLE `scenarioform_field` ADD COLUMN IF NOT EXISTS `required` TINYINT(1) NOT NULL DEFAULT 0",
        "ALTER TABLE `scenarioform_field` ADD COLUMN IF NOT EXISTS `scenario_id` INT UNSIGNED NULL AFTER `form_id`",
        "ALTER TABLE `scenarioform_field` ADD INDEX IF NOT EXISTS `idx_form_scenario_fields` (`form_id`, `scenario_id`, `displayOrder`)",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `scenario_id` INT UNSIGNED NULL AFTER `form_id`",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `user_id` INT UNSIGNED NULL AFTER `scenario_id`",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `request_name_snapshot` VARCHAR(255) NULL AFTER `user_id`",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `form_name_snapshot` VARCHAR(255) NULL AFTER `request_name_snapshot`",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `overall_status` VARCHAR(32) NULL AFTER `form_name_snapshot`",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `result_excerpt` VARCHAR(500) NULL AFTER `overall_status`",
        "ALTER TABLE `scenarioform_response` ADD COLUMN IF NOT EXISTS `completed` DATETIME NULL AFTER `result_excerpt`",
        "ALTER TABLE `scenarioform_response` ADD INDEX IF NOT EXISTS `idx_response_history` (`form_id`, `user_id`, `created`)",
        "UPDATE scenarioform_field f
         SET f.scenario_id = (
             SELECT fs.scenario_id FROM scenarioform_form_scenario fs
             WHERE fs.form_id = f.form_id AND fs.isEnable = 1
             ORDER BY fs.displayOrder ASC, fs.id ASC LIMIT 1
         )
         WHERE f.scenario_id IS NULL"
    ]);

    scenarioform_ensure_foreign_key(
        'scenarioform_field',
        'fk_scenarioform_field_form',
        'FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    scenarioform_ensure_foreign_key(
        'scenarioform_response_scenario',
        'fk_response_scenario_response',
        'FOREIGN KEY (`response_id`) REFERENCES `scenarioform_response` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    scenarioform_ensure_foreign_key(
        'scenarioform_response_document',
        'fk_response_document_scenario',
        'FOREIGN KEY (`response_scenario_id`) REFERENCES `scenarioform_response_scenario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    scenarioform_ensure_foreign_key(
        'scenarioform_response',
        'fk_scenarioform_response_form',
        'FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    scenarioform_ensure_foreign_key(
        'scenarioform_response_value',
        'fk_scenarioform_response_value_field',
        'FOREIGN KEY (`field_id`) REFERENCES `scenarioform_field` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    scenarioform_ensure_foreign_key(
        'scenarioform_response_value',
        'fk_scenarioform_response_value_response',
        'FOREIGN KEY (`response_id`) REFERENCES `scenarioform_response` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );

    scenarioform::ensureResultActionEquipment();
}

function scenarioform_update()
{
    scenarioform_install();
}

function scenarioform_remove()
{
    scenarioform_load_plugin_classes();
    foreach (scenarioform::byType('scenarioform', false) as $equipment) {
        $logicalId = (string) $equipment->getLogicalId();
        if (
            $logicalId === 'scenarioform_result_actions' ||
            strpos($logicalId, 'scenarioform_result_actions_') === 0
        ) {
            $equipment->remove();
        }
    }

    // Conservation volontaire des réponses et de la configuration métier.
}

CREATE TABLE IF NOT EXISTS `scenarioform_request` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `configuration` LONGTEXT NULL,
  `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `created` DATETIME NULL,
  `updated` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_form` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_form_scenario` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_field` (
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
  KEY `idx_form_scenario_fields` (`form_id`, `scenario_id`, `displayOrder`),
  CONSTRAINT `fk_scenarioform_field_form`
    FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_response` (
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
  KEY `idx_response_history` (`form_id`, `user_id`, `created`),
  CONSTRAINT `fk_scenarioform_response_form`
    FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_response_value` (
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
  KEY `idx_field_id` (`field_id`),
  CONSTRAINT `fk_scenarioform_response_value_response`
    FOREIGN KEY (`response_id`) REFERENCES `scenarioform_response` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scenarioform_response_value_field`
    FOREIGN KEY (`field_id`) REFERENCES `scenarioform_field` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_response_scenario` (
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
  KEY `idx_response_scenario_response` (`response_id`, `displayOrder`),
  CONSTRAINT `fk_response_scenario_response`
    FOREIGN KEY (`response_id`) REFERENCES `scenarioform_response` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_response_document` (
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
  KEY `idx_response_document_scenario` (`response_scenario_id`, `created`),
  CONSTRAINT `fk_response_document_scenario`
    FOREIGN KEY (`response_scenario_id`) REFERENCES `scenarioform_response_scenario` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_googlecalendar` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

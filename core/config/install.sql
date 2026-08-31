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
  CONSTRAINT `fk_scenarioform_field_form`
    FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_response` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `form_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(64) NULL,
  `source` VARCHAR(50) NULL,
  `configuration` LONGTEXT NULL,
  `created` DATETIME NULL,
  `updated` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_response_form_id` (`form_id`),
  CONSTRAINT `fk_scenarioform_response_form`
    FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scenarioform_response_value` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `response_id` INT UNSIGNED NOT NULL,
  `field_id` INT UNSIGNED NOT NULL,
  `value` LONGTEXT NULL,
  `created` DATETIME NULL,
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

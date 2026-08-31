-- ScenarioForm V2
--
-- Schéma documentaire. La migration officielle et idempotente est exécutée
-- par plugin_info/install.php via scenarioform_update().

CREATE TABLE IF NOT EXISTS `scenarioform_form_scenario` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `form_id` INT UNSIGNED NOT NULL,
  `scenario_id` INT UNSIGNED NOT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `isEnable` TINYINT(1) NOT NULL DEFAULT 1,
  `created` DATETIME NULL,
  `updated` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_form_scenario` (`form_id`, `scenario_id`),
  KEY `idx_form_scenario_order` (`form_id`, `displayOrder`),
  CONSTRAINT `fk_scenarioform_form_scenario_form`
    FOREIGN KEY (`form_id`) REFERENCES `scenarioform_form` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

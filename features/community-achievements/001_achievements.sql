-- Cryptódromo · aditiva, MySQL/MariaDB 10.4+; NO DROP, NO ALTER de tablas existentes.
-- user_id sin FK temporal hasta conocer tipo/identidad de la tabla users real.
CREATE TABLE IF NOT EXISTS community_profiles (
 user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 handle VARCHAR(32) NOT NULL,
 display_name VARCHAR(80) NOT NULL,
 bio VARCHAR(240) NOT NULL DEFAULT '',
 avatar_key VARCHAR(120) DEFAULT NULL,
 favorite_symbol VARCHAR(24) DEFAULT NULL,
 visibility ENUM('private','public') NOT NULL DEFAULT 'private',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_handle (handle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievement_definitions (
 code VARCHAR(40) NOT NULL PRIMARY KEY,
 title VARCHAR(80) NOT NULL,
 description VARCHAR(220) NOT NULL,
 category VARCHAR(24) NOT NULL,
 rarity ENUM('common','uncommon','rare','legendary') NOT NULL DEFAULT 'common',
 event_type VARCHAR(40) DEFAULT NULL,
 target_count INT UNSIGNED NOT NULL DEFAULT 1,
 icon_key VARCHAR(60) NOT NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 CHECK (target_count > 0),
 INDEX ix_achievement_event (event_type,is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_events (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 event_key VARCHAR(160) NOT NULL,
 event_type VARCHAR(40) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_user_event (user_id,event_key),
 INDEX ix_user_type (user_id,event_type,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievement_progress (
 user_id BIGINT UNSIGNED NOT NULL,
 event_type VARCHAR(40) NOT NULL,
 total INT UNSIGNED NOT NULL DEFAULT 0,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (user_id,event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_achievements (
 user_id BIGINT UNSIGNED NOT NULL,
 achievement_code VARCHAR(40) NOT NULL,
 unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 showcase_slot TINYINT UNSIGNED DEFAULT NULL,
 PRIMARY KEY (user_id,achievement_code),
 UNIQUE KEY uq_showcase (user_id,showcase_slot),
 CONSTRAINT fk_ua_definition FOREIGN KEY (achievement_code) REFERENCES achievement_definitions(code),
 CHECK (showcase_slot IS NULL OR showcase_slot BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO achievement_definitions (code,title,description,category,rarity,event_type,target_count,icon_key) VALUES
('founder','Primer casco','Creaste tu identidad en el hipódromo.','bienvenida','common','account_created',1,'horseshoe'),
('first_visit','Puertas abiertas','Tu primera visita registrada.','bienvenida','common','first_visit',1,'ticket'),
('first_race','En la tribuna','Presenciaste una carrera completa.','aficion','common','race_watched',1,'grandstand'),
('grandstand_5','Habitual de tribuna','Presenciaste cinco carreras diferentes.','aficion','uncommon','race_watched',5,'grandstand'),
('grandstand_25','Abonado de pista','Presenciaste 25 carreras diferentes.','aficion','rare','race_watched',25,'grandstand'),
('photo_finish','Ojo de halcón','Viste una llegada hasta el resultado.','aficion','common','finish_watched',1,'finish'),
('replay_5','Archivo de carrera','Revisaste cinco carreras diferentes.','aficion','uncommon','replay_watched',5,'film'),
('explorer_5','Conocedor del paddock','Exploraste cinco corredores distintos.','exploracion','common','racer_viewed',5,'horse'),
('explorer_25','Cronista del paddock','Exploraste 25 corredores distintos.','exploracion','rare','racer_viewed',25,'horse'),
('token_historian','Memoria del estadio','Leíste la historia del Cryptódromo.','exploracion','common','project_history_read',1,'book'),
('weather_watcher','Cazador de nubes','Viste carreras con tres climas diferentes.','exploracion','uncommon','weather_race_watched',3,'cloud'),
('profile_complete','Identidad de pista','Completaste tu perfil comunitario.','comunidad','common','profile_completed',1,'profile'),
('first_favorite','Un favorito','Elegiste tu primer corredor favorito.','comunidad','common','favorite_added',1,'heart'),
('collector_5','Coleccionista de corredores','Guardaste cinco corredores distintos.','comunidad','uncommon','favorite_added',5,'heart'),
('curator','Vitrina personal','Exhibiste tres insignias desbloqueadas.','comunidad','uncommon','badges_showcased',1,'gallery'),
('first_post','Voz de tribuna','Publicaste tu primer aporte aprobado.','comunidad','common','post_approved',1,'megaphone'),
('opening_day','Día inaugural','Recuerdo especial de inauguración.','especial','legendary',NULL,1,'star'),
('seven_days','Siete jornadas','Participaste en siete fechas distintas, no consecutivas.','especial','rare','event_day_attended',7,'calendar')
ON DUPLICATE KEY UPDATE code=VALUES(code);

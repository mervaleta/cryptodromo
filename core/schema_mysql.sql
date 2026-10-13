-- RNGMarketDriven.com - Database Schema (MySQL / MariaDB)
-- Run this in Hostinger phpMyAdmin or via MySQL terminal

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255) NULL,
    name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    balance_credits DECIMAL(12, 2) DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_type VARCHAR(50) NOT NULL, -- 'SLOTS_5R', 'ROCKET_CRASH', 'CRYPTOMOCHI'
    wager_amount DECIMAL(10, 2) NOT NULL,
    payout_amount DECIMAL(10, 2) NOT NULL,
    multiplier DECIMAL(8, 2) NOT NULL,
    entropy_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mochi_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT 'Kuro Híbrido',
    speed_ticker VARCHAR(10) DEFAULT 'NVDA',
    defense_ticker VARCHAR(10) DEFAULT 'YPF',
    intel_ticker VARCHAR(10) DEFAULT 'ETH',
    vitality_ticker VARCHAR(10) DEFAULT 'BTC',
    momentum_ticker VARCHAR(10) DEFAULT 'TSLA',
    combat_power DECIMAL(6, 2) DEFAULT 85.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

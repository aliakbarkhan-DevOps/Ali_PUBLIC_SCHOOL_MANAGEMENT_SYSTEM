package database

import (
	"database/sql"
	"log"
)

func InitSchema(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS menu_items (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			price NUMERIC(6,2) NOT NULL,
			category VARCHAR(100) NOT NULL,
			is_available BOOLEAN DEFAULT TRUE
		);
		CREATE TABLE IF NOT EXISTS cafe_wallets (
			user_id INT PRIMARY KEY,
			balance NUMERIC(8,2) DEFAULT 0.00
		);
		CREATE TABLE IF NOT EXISTS orders (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			items JSONB NOT NULL,
			total_price NUMERIC(8,2) NOT NULL,
			order_date DATE NOT NULL,
			status VARCHAR(50) NOT NULL
		);
		CREATE TABLE IF NOT EXISTS cafe_groceries (
			id SERIAL PRIMARY KEY,
			item_name VARCHAR(255) NOT NULL,
			quantity VARCHAR(100) NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'needed'
		);
	`)
	if err != nil {
		log.Fatalf("Schema init error: %v", err)
	}
}

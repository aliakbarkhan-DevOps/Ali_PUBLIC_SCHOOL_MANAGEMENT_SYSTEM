package repository

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"
	"cafe-service/internal/models"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetMenuItems() ([]models.MenuItem, error) {
	rows, err := r.db.Query("SELECT id, name, description, price, category, is_available FROM menu_items")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []models.MenuItem{}
	for rows.Next() {
		var m models.MenuItem
		rows.Scan(&m.ID, &m.Name, &m.Description, &m.Price, &m.Category, &m.IsAvailable)
		items = append(items, m)
	}
	return items, nil
}

func (r *Repository) CreateMenuItem(m models.MenuItem) (models.MenuItem, error) {
	err := r.db.QueryRow(
		"INSERT INTO menu_items (name, description, price, category, is_available) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		m.Name, m.Description, m.Price, m.Category, m.IsAvailable,
	).Scan(&m.ID)
	return m, err
}

func (r *Repository) GetWallet(userID int) (models.CafeWallet, error) {
	var wallet models.CafeWallet
	wallet.UserID = userID
	err := r.db.QueryRow("SELECT balance FROM cafe_wallets WHERE user_id = $1", userID).Scan(&wallet.Balance)
	if err == sql.ErrNoRows {
		_, err = r.db.Exec("INSERT INTO cafe_wallets (user_id, balance) VALUES ($1, 0.00)", userID)
		wallet.Balance = 0.00
	}
	return wallet, err
}

func (r *Repository) TopupWallet(userID int, amount float64) (float64, error) {
	var balance float64
	err := r.db.QueryRow(
		`INSERT INTO cafe_wallets (user_id, balance) VALUES ($1, $2)
		 ON CONFLICT (user_id) DO UPDATE SET balance = cafe_wallets.balance + EXCLUDED.balance
		 RETURNING balance`,
		userID, amount,
	).Scan(&balance)
	return balance, err
}

func (r *Repository) CreateOrder(userID int, items json.RawMessage, totalPrice float64) (map[string]interface{}, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var balance float64
	err = tx.QueryRow("SELECT balance FROM cafe_wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&balance)
	if err == sql.ErrNoRows {
		return nil, errors.New("wallet account not found. Please top up first")
	} else if err != nil {
		return nil, err
	}

	if balance < totalPrice {
		return nil, errors.New("insufficient wallet balance")
	}

	_, err = tx.Exec("UPDATE cafe_wallets SET balance = balance - $1 WHERE user_id = $2", totalPrice, userID)
	if err != nil {
		return nil, err
	}

	var orderID int
	orderDate := time.Now()
	err = tx.QueryRow(
		"INSERT INTO orders (user_id, items, total_price, order_date, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING id",
		userID, items, totalPrice, orderDate,
	).Scan(&orderID)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"order_id":    orderID,
		"new_balance": balance - totalPrice,
		"message":     "Order placed successfully. Paid using cafe card.",
	}, nil
}

func (r *Repository) GetOrders(userID int) ([]models.Order, error) {
	var rows *sql.Rows
	var err error
	if userID > 0 {
		rows, err = r.db.Query("SELECT id, user_id, items, total_price, order_date, status FROM orders WHERE user_id = $1 ORDER BY id DESC", userID)
	} else {
		rows, err = r.db.Query("SELECT id, user_id, items, total_price, order_date, status FROM orders ORDER BY id DESC")
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []models.Order{}
	for rows.Next() {
		var o models.Order
		var oDate time.Time
		var itemsRaw []byte
		rows.Scan(&o.ID, &o.UserID, &itemsRaw, &o.TotalPrice, &oDate, &o.Status)
		o.OrderDate = oDate.Format("2006-01-02")
		o.Items = string(itemsRaw)
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *Repository) UpdateOrderStatus(id int, status string) error {
	_, err := r.db.Exec("UPDATE orders SET status = $1 WHERE id = $2", status, id)
	return err
}

func (r *Repository) GetGroceries() ([]models.CafeGrocery, error) {
	rows, err := r.db.Query("SELECT id, item_name, quantity, status FROM cafe_groceries ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groceries := []models.CafeGrocery{}
	for rows.Next() {
		var g models.CafeGrocery
		if err := rows.Scan(&g.ID, &g.ItemName, &g.Quantity, &g.Status); err != nil {
			return nil, err
		}
		groceries = append(groceries, g)
	}
	return groceries, nil
}

func (r *Repository) CreateGrocery(g models.CafeGrocery) (models.CafeGrocery, error) {
	err := r.db.QueryRow(
		"INSERT INTO cafe_groceries (item_name, quantity, status) VALUES ($1, $2, $3) RETURNING id",
		g.ItemName, g.Quantity, g.Status,
	).Scan(&g.ID)
	return g, err
}

func (r *Repository) UpdateGroceryStatus(id int, status string) error {
	_, err := r.db.Exec("UPDATE cafe_groceries SET status = $1 WHERE id = $2", status, id)
	return err
}

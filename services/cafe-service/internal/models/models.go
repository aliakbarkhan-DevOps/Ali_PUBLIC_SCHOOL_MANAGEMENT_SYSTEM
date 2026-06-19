package models

type MenuItem struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"` // 'beverage', 'meal', 'snack'
	IsAvailable bool    `json:"is_available"`
}

type CafeWallet struct {
	UserID  int     `json:"user_id"`
	Balance float64 `json:"balance"`
}

type Order struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	Items      string    `json:"items"` // JSON encoded string representing items ordered
	TotalPrice float64   `json:"total_price"`
	OrderDate  string    `json:"order_date"`
	Status     string    `json:"status"` // 'pending', 'ready', 'completed'
}

type CafeGrocery struct {
	ID       int    `json:"id"`
	ItemName string `json:"item_name"`
	Quantity string `json:"quantity"`
	Status   string `json:"status"` // 'needed', 'purchased'
}

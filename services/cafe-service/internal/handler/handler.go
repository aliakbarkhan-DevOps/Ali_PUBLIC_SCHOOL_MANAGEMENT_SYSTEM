package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"cafe-service/internal/models"
	"cafe-service/internal/repository"
	"cafe-service/internal/service"
)

type Handler struct {
	svc *service.Service
}

func New(db *sql.DB) *Handler {
	repo := repository.New(db)
	svc := service.New(repo)
	return &Handler{svc: svc}
}

func (h *Handler) HandleMenu(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method == http.MethodGet {
		items, err := h.svc.GetMenuItems()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(items)
	} else if r.Method == http.MethodPost {
		var m models.MenuItem
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		newM, err := h.svc.CreateMenuItem(m)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		json.NewEncoder(w).Encode(newM)
	} else {
		http.Error(w, "Method not allowed", 405)
	}
}

func (h *Handler) HandleWallet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", 405)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is required", 400)
		return
	}
	userID, _ := strconv.Atoi(userIDStr)

	wallet, err := h.svc.GetWallet(userID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(wallet)
}

func (h *Handler) HandleTopup(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		UserID int     `json:"user_id"`
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Invalid amount", 400)
		return
	}

	balance, err := h.svc.TopupWallet(req.UserID, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id": req.UserID,
		"balance": balance,
		"message": "Top up successful",
	})
}

func (h *Handler) HandleOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		UserID     int             `json:"user_id"`
		Items      json.RawMessage `json:"items"`
		TotalPrice float64         `json:"total_price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	res, err := h.svc.CreateOrder(req.UserID, req.Items, req.TotalPrice)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	w.WriteHeader(201)
	json.NewEncoder(w).Encode(res)
}

func (h *Handler) HandleOrders(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method == http.MethodGet {
		userIDStr := r.URL.Query().Get("user_id")
		userID := 0
		if userIDStr != "" {
			userID, _ = strconv.Atoi(userIDStr)
		}
		orders, err := h.svc.GetOrders(userID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(orders)
	} else if r.Method == http.MethodPut {
		var req struct {
			ID     int    `json:"id"`
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		err := h.svc.UpdateOrderStatus(req.ID, req.Status)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"id": req.ID, "status": req.Status, "message": "Order status updated"})
	} else {
		http.Error(w, "Method not allowed", 405)
	}
}

func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status": "UP", "service": "Cafe & Cafeteria Service"}`))
}

func (h *Handler) HandleGroceries(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method == http.MethodGet {
		groceries, err := h.svc.GetGroceries()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(groceries)
	} else if r.Method == http.MethodPost {
		var g models.CafeGrocery
		if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if g.Status == "" {
			g.Status = "needed"
		}
		newG, err := h.svc.CreateGrocery(g)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		json.NewEncoder(w).Encode(newG)
	} else if r.Method == http.MethodPut {
		var req struct {
			ID     int    `json:"id"`
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		err := h.svc.UpdateGroceryStatus(req.ID, req.Status)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"id": req.ID, "status": req.Status, "message": "Grocery status updated"})
	} else {
		http.Error(w, "Method not allowed", 405)
	}
}

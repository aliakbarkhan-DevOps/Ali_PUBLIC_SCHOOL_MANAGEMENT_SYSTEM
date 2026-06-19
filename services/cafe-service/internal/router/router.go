package router

import (
	"net/http"
	"cafe-service/internal/handler"
)

func Setup(h *handler.Handler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/menu", h.HandleMenu)
	mux.HandleFunc("/wallet", h.HandleWallet)
	mux.HandleFunc("/wallet/topup", h.HandleTopup)
	mux.HandleFunc("/order", h.HandleOrder)
	mux.HandleFunc("/orders", h.HandleOrders)
	mux.HandleFunc("/groceries", h.HandleGroceries)
	mux.HandleFunc("/health", h.HandleHealth)
	return mux
}

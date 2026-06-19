package service

import (
	"encoding/json"
	"cafe-service/internal/models"
	"cafe-service/internal/repository"
)

type Service struct {
	repo *repository.Repository
}

func New(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetMenuItems() ([]models.MenuItem, error) {
	return s.repo.GetMenuItems()
}

func (s *Service) CreateMenuItem(m models.MenuItem) (models.MenuItem, error) {
	return s.repo.CreateMenuItem(m)
}

func (s *Service) GetWallet(userID int) (models.CafeWallet, error) {
	return s.repo.GetWallet(userID)
}

func (s *Service) TopupWallet(userID int, amount float64) (float64, error) {
	return s.repo.TopupWallet(userID, amount)
}

func (s *Service) CreateOrder(userID int, items json.RawMessage, totalPrice float64) (map[string]interface{}, error) {
	return s.repo.CreateOrder(userID, items, totalPrice)
}

func (s *Service) GetOrders(userID int) ([]models.Order, error) {
	return s.repo.GetOrders(userID)
}

func (s *Service) UpdateOrderStatus(id int, status string) error {
	return s.repo.UpdateOrderStatus(id, status)
}

func (s *Service) GetGroceries() ([]models.CafeGrocery, error) {
	return s.repo.GetGroceries()
}

func (s *Service) CreateGrocery(g models.CafeGrocery) (models.CafeGrocery, error) {
	return s.repo.CreateGrocery(g)
}

func (s *Service) UpdateGroceryStatus(id int, status string) error {
	return s.repo.UpdateGroceryStatus(id, status)
}

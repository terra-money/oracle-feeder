package types

// price struct for terrafeeder REST API
type Price struct {
	Currency string  `json:"currency"`
	Price    float64 `json:"price"`
}

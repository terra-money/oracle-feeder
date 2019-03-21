package types

type Price struct {
	Denom   string  `json:"denom"`
	Current float64 `json:"current"`
}

type Prices []Price

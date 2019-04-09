package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	"time"
)

// price.go struct for terrafeeder REST API
type Price struct {
	Denom string  `json:"currency"`
	Price sdk.Dec `json:"price"`
}

// Price history
type History struct {
	CreatedAt time.Time
	Prices    []Price
}

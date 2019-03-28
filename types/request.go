package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// redefine VoteReq in cosmos-sdk

type VoteReq struct {
	BaseReq      BaseReq `json:"base_req"`
	Price        sdk.Dec `json:"price"`
	Denom        string  `json:"denom"`
	VoterAddress string  `json:"voter_address"`
}

// redefine BaseReq in cosmos-sdk to change uint64 formats
type BaseReq struct {
	From          string       `json:"from"`
	Password      string       `json:"password"`
	Memo          string       `json:"memo"`
	ChainID       string       `json:"chain_id"`
	AccountNumber uint64       `json:"account_number,string"`
	Sequence      uint64       `json:"sequence,string"`
	Fees          sdk.Coins    `json:"fees"`
	GasPrices     sdk.DecCoins `json:"gas_prices"`
	Gas           string       `json:"gas"`
	GasAdjustment string       `json:"gas_adjustment"`
	GenerateOnly  bool         `json:"generate_only"`
	Simulate      bool         `json:"simulate"`
}

// redefine Response in cosmos-sdk
type Response struct {
	Codespace string `json:"codespace"`
	Code      int    `json:"code"`
	Message   string `json:"message"`
}

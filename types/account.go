package types

type Account struct {
	Type  string      `json:"type"`
	Value BaseAccount `json:"value"`
}

type BaseAccount struct {
	AccountNumber uint64    `json:"account_number,string"`
	Address       string    `json:"address"`
	Coins         []Coin    `json:"coins"`
	PublicKey     PublicKey `json:"public_key"`
	Sequence      uint64    `json:"sequence,string"`
}

type PublicKey struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type Coin struct {
	Denom  string `json:"denom"`
	Amount string `json:"amount"`
}

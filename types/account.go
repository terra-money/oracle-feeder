package types

// account query response structure
type Account struct {
	Type  string `json:"type"`
	Value struct {
		AccountNumber uint64 `json:"account_number,string"`
		Address       string `json:"address"`

		Coins []struct {
			Denom  string `json:"denom"`
			Amount string `json:"amount"`
		} `json:"coins"`

		PublicKey struct {
			Type  string `json:"type"`
			Value string `json:"value"`
		} `json:"public_key"`

		Sequence uint64 `json:"sequence,string"`
	} `json:"value"`
}

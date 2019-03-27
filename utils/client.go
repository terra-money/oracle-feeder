package utils

import (
	"bytes"
	"encoding/json"
	"feeder/types"
	"fmt"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"io/ioutil"
	"net/http"
)

const (
	feeDenom = "luna"

	defaultFees = 2

	maximumRetry = 10
)

// Client for LCD REST Server
type LCDClient struct {
	lcdAddress string
}

// Create New lcd client
func NewLCDClient(lcdAddress string) *LCDClient {
	return &LCDClient{lcdAddress}
}

// Query Account information from LCD
func (client *LCDClient) QueryAccount(voterAddress string) (*types.Account, error) {

	// get account id & seq. no.
	resp, err := http.Get(client.lcdAddress + "/auth/accounts/" + voterAddress)
	if err != nil {
		fmt.Println("REST Error: ", err)
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("UNREGISTERED ACCOUNT")
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	var account types.Account
	err = json.Unmarshal(body, &account)

	return &account, err
}

// Send vote message to LCD
func (client *LCDClient) VoteByREST(price types.Price, account *types.Account, voterKey string, voterPass string, chainID string) error {

	for i := 0; i < maximumRetry; i++ {
		fmt.Println("Voting ", price.Currency, " as ", price.Price, " trying #", i)

		// tx vote
		voteMsg := types.VoteReq{
			BaseReq: types.BaseReq{
				From:     voterKey,
				Password: voterPass,
				Memo:     "Voting from oracle feeder",
				ChainID:  chainID,

				AccountNumber: uint64(account.Value.AccountNumber),
				Sequence:      uint64(account.Value.Sequence),

				Fees:      sdk.Coins{sdk.Coin{Denom: feeDenom, Amount: sdk.NewInt(defaultFees)}},
				GasPrices: sdk.DecCoins{sdk.DecCoin{Denom: feeDenom, Amount: sdk.ZeroDec()}},

				Gas:           "20000",
				GasAdjustment: "1.2",
			},
			Price:        sdk.NewDecWithPrec(int64(price.Price*1000000000000000000), 18),
			Denom:        price.Currency,
			VoterAddress: account.Value.Address,
		}

		payloadBytes, _ := json.Marshal(voteMsg)
		payloadBuffer := bytes.NewBuffer(payloadBytes)
		fmt.Println(string(payloadBytes))
		resp, err := http.Post(client.lcdAddress+"/oracle/vote", "application/json", payloadBuffer)

		if err != nil {
			fmt.Println(err)
			return err
		}

		if resp.StatusCode != 200 {
			body, _ := ioutil.ReadAll(resp.Body)
			var msg map[string]string

			if err := json.Unmarshal(body, &msg); err == nil {
				var data types.Response

				err = json.Unmarshal([]byte(msg["message"]), &data)
				if err == nil {
					if data.Code == 4 {
						account.Value.Sequence++
						continue
					}
				}
				fmt.Println(data)

			} else {
				fmt.Println(err)
			}

			return fmt.Errorf(resp.Status)
		}

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println(string(body))
		account.Value.Sequence++

		return nil
	}

	return nil
}

// Send vote message via terracli
func VoteByCli(_ types.Price) error {
	panic("Not Implemented Yet")
	// return nil
}

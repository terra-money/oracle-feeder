package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	restTypes "github.com/cosmos/cosmos-sdk/types/rest"
	"github.com/cosmos/cosmos-sdk/x/auth"
	oracleRest "github.com/terra-project/core/x/oracle/client/rest"
	"io/ioutil"
	"net/http"
	"oracle-feeder/terrafeeder/types"
)

const (
	feeDenom = "luna"

	defaultFees  = 2
	maximumRetry = 10
)

// Client for LCD REST Server
type LCDClient struct {
	lcdAddress string
	cdc        *codec.Codec
}

// Create New lcd client
func NewLCDClient(lcdAddress string) *LCDClient {
	cdc := codec.New()
	auth.RegisterCodec(cdc)

	return &LCDClient{lcdAddress, cdc}
}

// Query Account information from LCD
func (client *LCDClient) QueryAccount(voterAddress string) (*auth.BaseAccount, error) {

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

	var account auth.BaseAccount
	err = codec.Cdc.UnmarshalJSON(body, &account)

	return &account, err
}

// Send vote message to LCD
func (client *LCDClient) VoteByREST(cliCtx context.CLIContext, account *auth.BaseAccount, price *types.Price, voterPass string, chainID string) error {

	for i := 0; i < maximumRetry; i++ {
		fmt.Println("Voting ", price.Denom, " as ", price.Price, " trial #", i)

		voter := cliCtx.GetFromAddress()
		voteMsg := createVoteReq(&voter, chainID, account, price)

		payloadBytes, _ := json.Marshal(voteMsg)
		payloadBuffer := bytes.NewBuffer(payloadBytes)

		endpoint := fmt.Sprintf("%s/oracle/%s/vote", client.lcdAddress, price.Denom)
		resp, err := http.Post(endpoint, "application/json", payloadBuffer)

		if err != nil {
			fmt.Println(err)
			fmt.Println(resp.Body)
			return err
		}

		if resp.StatusCode != 200 {
			body, _ := ioutil.ReadAll(resp.Body)
			var msg map[string]string

			if err := json.Unmarshal(body, &msg); err == nil {
				var data types.HumanReadableError

				err = json.Unmarshal([]byte(msg["message"]), &data)
				if err == nil {
					if data.Code == 4 {
						account.Sequence++
						continue
					}
				}
				fmt.Println(data)

			} else {
				fmt.Println(body)
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
		account.Sequence++

		return nil
	}

	return nil
}

func createVoteReq(voterAddress *sdk.AccAddress, chainID string, account *auth.BaseAccount, price *types.Price) *oracleRest.VoteReq {
	return &oracleRest.VoteReq{
		BaseReq: restTypes.BaseReq{
			From:    voterAddress.String(),
			Memo:    "Voting from oracle terrafeeder",
			ChainID: chainID,

			AccountNumber: account.AccountNumber,
			Sequence:      account.Sequence,

			Fees:      sdk.Coins{sdk.Coin{Denom: feeDenom, Amount: sdk.NewInt(defaultFees)}},
			GasPrices: sdk.DecCoins{sdk.DecCoin{Denom: feeDenom, Amount: sdk.ZeroDec()}},

			Gas:           "20000",
			GasAdjustment: "1.2",
		},
		Price: price.Price,
	}
}

package utils

import (
	"bytes"
	"encoding/json"
	"feeder/terrafeeder/types"
	"fmt"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	restTypes "github.com/cosmos/cosmos-sdk/types/rest"
	"github.com/cosmos/cosmos-sdk/x/auth"
	"io"
	"io/ioutil"
	"net/http"
	"os/exec"
	"strings"
	"time"

	oracleRest "github.com/terra-project/core/x/oracle/client/rest"
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
	var cdc = codec.New()
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
func (client *LCDClient) VoteByREST(price types.Price, account *auth.BaseAccount, voterKey string, voterPass string, chainID string) error {

	for i := 0; i < maximumRetry; i++ {
		fmt.Println("Voting ", price.Currency, " as ", price.Price, " trying #", i)

		voteMsg := createVoteReq(voterKey, voterPass, chainID, account, price)

		payloadBytes, _ := json.Marshal(voteMsg)
		payloadBuffer := bytes.NewBuffer(payloadBytes)

		endpoint := fmt.Sprintf("%s/oracle/%s/vote", client.lcdAddress, price.Currency)
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

func createVoteReq(voter string, passphrase string, chainID string, account *auth.BaseAccount, price types.Price) *oracleRest.VoteReq {
	return &oracleRest.VoteReq{
		BaseReq: restTypes.BaseReq{
			From:     voter,
			Password: passphrase,
			Memo:     "Voting from oracle terrafeeder",
			ChainID:  chainID,

			AccountNumber: account.AccountNumber,
			Sequence:      account.Sequence,

			Fees:      sdk.Coins{sdk.Coin{Denom: feeDenom, Amount: sdk.NewInt(defaultFees)}},
			GasPrices: sdk.DecCoins{sdk.DecCoin{Denom: feeDenom, Amount: sdk.ZeroDec()}},

			Gas:           "20000",
			GasAdjustment: "1.2",
		},
		Price: sdk.NewDecWithPrec(int64(price.Price*1000000000000000000), 18),
	}
}

// Send vote message via terracli
func VoteByCli(price types.Price, voterKey string, voterPass string, chainID string) error {

	votePrice := fmt.Sprintf(
		"terracli tx oracle vote %v %v --from %v --chain-id %v --fees 2luna",
		price.Currency, price.Price, voterKey, chainID)
	fmt.Println(time.Now().UTC().Format(time.RFC3339), price.Currency, price.Price)
	executeCmd(votePrice, voterPass)

	return nil
}

// codes from cosmos faucet
func executeCmd(command string, writes ...string) {
	cmd, wc, _ := goExecute(command)

	for _, write := range writes {
		_, _ = wc.Write([]byte(write + "\n"))
	}
	_ = cmd.Wait()
}

func goExecute(command string) (cmd *exec.Cmd, pipeIn io.WriteCloser, pipeOut io.ReadCloser) {
	cmd = getCmd(command)
	pipeIn, _ = cmd.StdinPipe()
	pipeOut, _ = cmd.StdoutPipe()
	go func() {
		_ = cmd.Start()
	}()
	time.Sleep(time.Second)
	return cmd, pipeIn, pipeOut
}

func getCmd(command string) *exec.Cmd {
	// split command into command and args
	split := strings.Split(command, " ")

	var cmd *exec.Cmd
	if len(split) == 1 {
		cmd = exec.Command(split[0])
	} else {
		cmd = exec.Command(split[0], split[1:]...)
	}

	return cmd
}

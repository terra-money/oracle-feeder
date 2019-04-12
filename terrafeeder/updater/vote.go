package updater

import (
	"fmt"
	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/spf13/viper"
	"oracle-feeder/terrafeeder/types"
	"oracle-feeder/terrafeeder/updater/client"
	"strings"
	"time"
)

// Voting all price.go data
func VoteAll(cliCtx context.CLIContext, encryptedPass string, aesKey []byte, chainID string, lcdAddress string, prices []types.Price) error {

	lcd := client.NewLCDClient(lcdAddress)
	mode := viper.GetString("vote-by")

	for _, price := range prices {
		var err error

		price.Denom = "m" + strings.ToLower(price.Denom)
		fmt.Println(time.Now().UTC().Format(time.RFC3339), price.Denom, price.Price)

		if mode == "cli" {
			err = client.VoteByCli(cliCtx, price, encryptedPass, aesKey, chainID)

		} else if mode == "lcd" {

			account, err := lcd.QueryAccount(cliCtx.GetFromAddress().String())
			if err != nil {
				fmt.Println(err)
				continue
			}

			err = lcd.VoteByREST(cliCtx, account, &price, encryptedPass, aesKey, chainID)

		} else if mode == "rpc" {
			err = client.VoteByRPC(cliCtx, encryptedPass, aesKey, &price)
		}

		if err != nil {
			fmt.Println(err)
			continue
		}
	}

	return nil
}

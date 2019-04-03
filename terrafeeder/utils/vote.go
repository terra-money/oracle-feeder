package utils

import (
	"feeder/terrafeeder/types"
	"fmt"
)

// Voting all price data
func VoteAll(voterKey string, voterPass string, voterAddress string, chainID string, cliMode bool, lcdAddress string, prices []types.Price) error {

	lcdClient := NewLCDClient(lcdAddress)

	for _, price := range prices {
		var err error
		if cliMode {
			err = VoteByCli(price, voterKey, voterPass, chainID)

		} else {
			account, err := lcdClient.QueryAccount(voterAddress)
			if err != nil {
				return err
			}

			if err := lcdClient.VoteByREST(price, account, voterKey, voterPass, chainID); err != nil {
				return err
			}
		}

		if err != nil {
			fmt.Println(err)
			continue
		}
	}

	return nil
}

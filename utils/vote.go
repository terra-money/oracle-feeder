package utils

import (
	"feeder/types"
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

			err = lcdClient.VoteByREST(price, account, voterKey, voterPass, chainID)
		}

		if err != nil {
			fmt.Println(err)
			continue
		}
	}

	return nil
}

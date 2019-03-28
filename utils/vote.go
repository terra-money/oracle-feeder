package utils

import (
	"feeder/types"
	"fmt"
)

// Voting all price data
func VoteAll(voterKey string, voterPass string, voterAddress string, chainID string, cliMode bool, lcdAddress string, prices []types.Price) error {

	lcdClient := NewLCDClient(lcdAddress)

	//
	account, err := lcdClient.QueryAccount(voterAddress)
	if err != nil {
		return err
	}

	for _, price := range prices {
		var err error
		if cliMode {
			err = VoteByCli(price)
		} else {
			err = lcdClient.VoteByREST(price, account, voterKey, voterPass, chainID)
		}

		if err != nil {
			fmt.Println(err)
			continue
		}
	}

	return nil
}

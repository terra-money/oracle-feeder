package utils

import (
	"encoding/json"
	"feeder/types"
	"fmt"
	"io/ioutil"
	"net/http"
)

// get update price data
func UpdatePrices(url string) ([]types.Price, error) {
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	_ = resp.Body.Close()

	var prices []types.Price
	err = json.Unmarshal(body, &prices)

	return prices, err
}

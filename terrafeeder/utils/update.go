package utils

import (
	"encoding/json"
	"fmt"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"io/ioutil"
	"net/http"
	"oracle-feeder/terrafeeder/types"
	"sort"
	"time"
)

func DecMedian(values []sdk.Dec) sdk.Dec {
	sort.Slice(values, func(i, j int) bool {
		return values[i].GTE(values[j])
	})

	l := len(values)
	m := l / 2
	fmt.Println(l, m)

	if l%2 != 0 {
		return values[m]
	}
	return values[m-1].Add(values[m]).QuoInt64(2)
}

// get update price.go data
func UpdatePrices(urls []string) (*types.History, error) {

	var oldestTime time.Time
	priceMap := make(map[string][]sdk.Dec)

	for _, url := range urls {

		fetched, err := fetchData(url)
		if err != nil {
			fmt.Println(err)
			continue
		}

		// oldest time is the time of new data
		if oldestTime.After(fetched.CreatedAt) {
			oldestTime = fetched.CreatedAt
		}

		for _, price := range fetched.Prices {
			priceSlice, ok := priceMap[price.Denom]
			if !ok {
				priceSlice = make([]sdk.Dec, 0)
			}
			priceMap[price.Denom] = append(priceSlice, price.Price)
		}
	}

	// Post processing
	history := calcHistoryFromPrices(priceMap)
	history.CreatedAt = oldestTime

	return &history, nil
}

func calcHistoryFromPrices(priceMap map[string][]sdk.Dec) (history types.History) {

	for denom, prices := range priceMap {
		price := DecMedian(prices)
		history.Prices = append(history.Prices, types.Price{
			Denom:      denom,
			Price:      price,
			Dispersion: sdk.ZeroDec(),
		})
	}

	return
}

func fetchData(url string) (*types.History, error) {
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

	var history types.History
	err = json.Unmarshal(body, &history)

	return &history, nil
}

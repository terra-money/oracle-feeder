package types

import (
	"encoding/json"
	"fmt"
	"github.com/syndtr/goleveldb/leveldb"
	"github.com/syndtr/goleveldb/leveldb/util"
	"time"
)

// DB Accessing methods
type HistoryKeeper struct {
	Db *leveldb.DB
}

func getCurrentTimeKey() []byte {
	b, err := time.Now().GobEncode()
	if err != nil {
		panic(err)
	}
	return b
}

// Add history from db
func (keeper *HistoryKeeper) AddHistory(prices []Price) error {
	b, err := json.Marshal(prices)

	if err != nil {
		panic(err)
	}

	return keeper.Db.Put(getCurrentTimeKey(), b, nil)
}

// Get latest history from db
func (keeper *HistoryKeeper) GetLatestBytes() []byte {
	i := keeper.Db.NewIterator(nil, nil)
	i.Last()

	return i.Value()
}

// Get latest history from db
func (keeper *HistoryKeeper) GetLatest() []Price {

	var prices []Price
	value := keeper.GetLatestBytes()

	if value != nil {
		err := json.Unmarshal(value, &prices)
		if err != nil {
			panic(err)
		}
	} else {
		fmt.Println("No history data, skipping")
	}

	return prices
}

func timeStringToBytes(strTime string) ([]byte, error) {
	timeParsed, err := time.Parse(time.RFC3339, strTime)
	if err != nil {
		return nil, err
	}

	timeBytes, err := timeParsed.GobEncode()
	if err != nil {
		return nil, err
	}

	return timeBytes, nil
}

// Get all histories from db
func (keeper *HistoryKeeper) GetHistories(from string, to string) map[string][]Price {
	fromBytes, err := timeStringToBytes(from)
	if err != nil {
		return nil
	}
	toBytes, err := timeStringToBytes(to)
	if err != nil {
		return nil
	}

	timeRange := util.Range{Start: fromBytes, Limit: toBytes}
	keeper.Db.NewIterator(&timeRange, nil)

	return nil
}

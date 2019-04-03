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

// price struct for terrafeeder REST API
type Price struct {
	Currency string  `json:"currency"`
	Price    float64 `json:"price,string"`
}

// Price history
type History struct {
	CreatedAt time.Time
	Prices    []Price
}

func getCurrentTimeKey(keyTime time.Time) []byte {
	b, err := keyTime.GobEncode()
	if err != nil {
		panic(err)
	}
	return b
}

// Add history from db
func (keeper *HistoryKeeper) AddHistory(history *History) error {
	b, err := json.Marshal(history)
	if err != nil {
		panic(err)
	}

	return keeper.Db.Put(getCurrentTimeKey(history.CreatedAt), b, nil)
}

// Get latest history from db
func (keeper *HistoryKeeper) GetLatestBytes() []byte {
	i := keeper.Db.NewIterator(nil, nil)
	i.Last()

	return i.Value()
}

// Get latest history from db
func (keeper *HistoryKeeper) GetLatest() History {

	var history History
	value := keeper.GetLatestBytes()

	if value != nil {
		err := json.Unmarshal(value, &history)
		if err != nil {
			panic(err)
		}
	} else {
		fmt.Println("No history data, skipping")
	}

	return history
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
func (keeper *HistoryKeeper) GetHistories(from string, to string) []History {
	fromBytes, err := timeStringToBytes(from)
	if err != nil {
		return nil
	}
	toBytes, err := timeStringToBytes(to)
	if err != nil {
		return nil
	}

	timeRange := util.Range{Start: fromBytes, Limit: toBytes}
	iter := keeper.Db.NewIterator(&timeRange, nil)

	histories := make([]History, 0)
	for iter.Next() {
		var history History
		if err := json.Unmarshal(iter.Value(), &history); err != nil {
			histories = append(histories, history)
		}
	}

	return histories
}

package tasks

import (
	"encoding/json"
	"feeder/types"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"io/ioutil"
	"net/http"
	"time"
)

const (
	flagUpdatingInterval = "updating-interval"
	flagUpdatingSource   = "updating-source"

	//
	defaultUpdatingInterval = time.Minute * 1
	// defaultUpdatingSource   = "https://feeder.terra.money:7468/last"
	defaultUpdatingSource = "http://localhost:5000/last"
)

// Updater Task definition
type UpdaterTask struct {
	keeper *types.HistoryKeeper
}

var _ types.Task = (*UpdaterTask)(nil)

// Implementation

// Create new Update Task
func NewUpdaterTask(keeper *types.HistoryKeeper) *types.TaskRunner {
	return types.NewTaskRunner("Price Updater", &UpdaterTask{keeper}, viper.GetDuration(flagUpdatingInterval))
}

// Regist REST Commands
func RegistUpdaterCommand(cmd *cobra.Command) {

	cmd.Flags().Duration(flagUpdatingInterval, defaultUpdatingInterval, "Updating interval (Duration format)")
	cmd.Flags().String(flagUpdatingSource, defaultUpdatingSource, "Updating interval (Duration format)")

	_ = viper.BindPFlag(flagUpdatingInterval, cmd.Flags().Lookup(flagUpdatingInterval))
	_ = viper.BindPFlag(flagUpdatingSource, cmd.Flags().Lookup(flagUpdatingSource))

	viper.SetDefault(flagUpdatingInterval, defaultUpdatingInterval)
	viper.SetDefault(flagUpdatingSource, defaultUpdatingSource)
}

// Run task
func (task *UpdaterTask) RunHandler() {

	fmt.Println("Updating....")

	url := viper.GetString(flagUpdatingSource)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return
	}

	_ = resp.Body.Close()

	var prices []types.Price
	err = json.Unmarshal(body, &prices)

	if err == nil {
		_ = task.keeper.AddHistory(prices)

	} else {
		fmt.Println(err)
	}
	fmt.Println("Updated!")

}

// dummy
func (task *UpdaterTask) InitHandler() {}

// dummy
func (task *UpdaterTask) ShutdownHandler() {}

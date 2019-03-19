package tasks

import (
	"feeder/types"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"time"
)

const (
	flagUpdatingInterval = "updating-interval"

	//
	defaultUpdatingInterval = time.Minute * 5
)

// Updater Task definition
type UpdaterTask struct {
	done chan struct{}
}

var _ types.Task = (*UpdaterTask)(nil)


// Implementation

// Create new Update Task
func NewUpdaterTask(done chan struct{}) types.Task {
	return &UpdaterTask{done}
}

// Regist REST Commands
func (task *UpdaterTask) RegistCommand(cmd *cobra.Command) {

	cmd.Flags().Duration(flagUpdatingInterval, defaultUpdatingInterval, "Updating interval (Duration format)")
	_ = viper.BindPFlag(flagUpdatingInterval, cmd.Flags().Lookup(flagUpdatingInterval))
	viper.SetDefault(flagUpdatingInterval, defaultUpdatingInterval)

}

// Run task
func (task *UpdaterTask) Run() {
	fmt.Println("Price Updater is Ready")
	for {
		select {
		case <- task.done:
			fmt.Println("Price Updater is shutting down")
			return

		default:
			time.Sleep(viper.GetDuration(flagUpdatingInterval))
		}
	}
}

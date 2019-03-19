package tasks

import (
	"feeder/types"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"time"
)

const (
	flagVotingInterval   = "voting-interval"

	//
	defaultVotingInterval   = time.Minute * 10
)

// Voter Task definition
type VoterTask struct {
	done chan struct{}
}

var _ types.Task = (*VoterTask)(nil)



// Implementation

// Create new Voter Task
func NewVoterTask(done chan struct{}) types.Task {
	return &VoterTask{done}
}

// Regist REST Commands
func (task *VoterTask) RegistCommand(cmd *cobra.Command) {

	cmd.Flags().Duration(flagVotingInterval, defaultVotingInterval, "Voting interval (Duration format)")
	_ = viper.BindPFlag(flagVotingInterval, cmd.Flags().Lookup(flagVotingInterval))
	viper.SetDefault(flagVotingInterval, defaultVotingInterval)

}

// Run task
func (task *VoterTask) Run() {
	fmt.Println("Price Voter is Ready")
	for {
		select {
		case <- task.done:
			fmt.Println("Price Voter is shutting down")
			return

		default:
			time.Sleep(viper.GetDuration(flagVotingInterval))
		}
	}

}

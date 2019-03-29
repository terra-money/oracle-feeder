package tasks

import (
	"feeder/types"
	"feeder/utils"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"time"
)

const (
	flagUpdatingInterval = "updating-interval"
	flagUpdatingSource   = "updating-source"

	flagNoDBMode = "no-db"
	//

	// voting flags
	flagVotingCli  = "voting-cli"
	flagLCDAddress = "lcd"

	flagFrom    = "from"
	flagPass    = "pass"
	flagChainID = "chain-id"

	flagAddress = "address"

	//
	defaultUpdatingInterval = time.Minute * 1
	// defaultUpdatingSource   = "https://feeder.terra.money:7468/last"
	defaultUpdatingSource = "http://localhost:5000/last"

	// voting default
	defaultLCDAddress = "https://soju.terra.money:1317"
	defaultChainID    = "soju-0005"
)

// Updater Task definition
type UpdaterTask struct {
	keeper *types.HistoryKeeper

	SourceURL string
	noVoting  bool
}

var _ types.Task = (*UpdaterTask)(nil)

// Implementation

// Create new Update Task
func NewUpdaterTaskRunner(keeper *types.HistoryKeeper, noVoting bool) *types.TaskRunner {
	sourceURL := viper.GetString(flagUpdatingSource)
	return types.NewTaskRunner("Price Updater", &UpdaterTask{keeper, sourceURL, noVoting}, viper.GetDuration(flagUpdatingInterval))
}

// Regist REST Commands
func RegistUpdaterCommand(cmd *cobra.Command, noVoting bool) {

	cmd.Flags().Duration(flagUpdatingInterval, defaultUpdatingInterval, "Updating interval (Duration format)")
	cmd.Flags().String(flagUpdatingSource, defaultUpdatingSource, "Updating interval (Duration format)")
	cmd.Flags().Bool(flagNoDBMode, false, "Running as no DB mode, doesn't save price history")

	_ = viper.BindPFlag(flagUpdatingInterval, cmd.Flags().Lookup(flagUpdatingInterval))
	_ = viper.BindPFlag(flagUpdatingSource, cmd.Flags().Lookup(flagUpdatingSource))
	_ = viper.BindPFlag(flagNoDBMode, cmd.Flags().Lookup(flagNoDBMode))

	viper.SetDefault(flagUpdatingInterval, defaultUpdatingInterval)
	viper.SetDefault(flagUpdatingSource, defaultUpdatingSource)
	viper.SetDefault(flagNoDBMode, false)

	if !noVoting {

		// flags about voting
		cmd.Flags().Bool(flagVotingCli, false, "Voting by cli")
		cmd.Flags().String(flagChainID, defaultChainID, "Chain ID to vote")

		cmd.Flags().String(flagFrom, "my_name", "key name")
		cmd.Flags().String(flagPass, "12345678", "password")
		cmd.Flags().String(flagAddress, "terra1xffsq0sf43gjp66qaza590xp6suzsdmuxsyult", "Voter account address")

		_ = viper.BindPFlag(flagVotingCli, cmd.Flags().Lookup(flagVotingCli))
		_ = viper.BindPFlag(flagChainID, cmd.Flags().Lookup(flagChainID))

		_ = viper.BindPFlag(flagFrom, cmd.Flags().Lookup(flagFrom))
		_ = viper.BindPFlag(flagPass, cmd.Flags().Lookup(flagPass))
		_ = viper.BindPFlag(flagAddress, cmd.Flags().Lookup(flagAddress))

		viper.SetDefault(flagVotingCli, false)
		viper.SetDefault(flagChainID, defaultChainID)

		if !viper.GetBool(flagVotingCli) {
			cmd.Flags().String(flagLCDAddress, defaultLCDAddress, "the url of lcd daemon to request vote")
			_ = viper.BindPFlag(flagLCDAddress, cmd.Flags().Lookup(flagLCDAddress))
			viper.SetDefault(flagLCDAddress, defaultLCDAddress)

			_ = cmd.MarkFlagRequired(flagAddress)
		}

		_ = cmd.MarkFlagRequired(flagFrom)
		_ = cmd.MarkFlagRequired(flagPass)
		_ = cmd.MarkFlagRequired(flagChainID)

	}
}

// Run task
func (task *UpdaterTask) RunHandler() {

	fmt.Println("Updating....")

	history, err := utils.UpdatePrices(task.SourceURL)

	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println("Updated!")

	if task.noVoting {
		return
	}

	fmt.Println("Voting....")

	if !viper.GetBool(flagNoDBMode) {
		_ = task.keeper.AddHistory(history)
	}

	voterKey := viper.GetString(flagFrom)
	voterPass := viper.GetString(flagPass)
	voterAddress := viper.GetString(flagAddress)
	chainID := viper.GetString(flagChainID)

	byCli := viper.GetBool(flagVotingCli)

	lcdAddress := viper.GetString(flagLCDAddress)

	err = utils.VoteAll(voterKey, voterPass, voterAddress, chainID, byCli, lcdAddress, history.Prices)
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println("Voted!")
}

// Initialize handler
func (task *UpdaterTask) InitHandler() {
	// Do nothing
}

// Shutdown handler
func (task *UpdaterTask) ShutdownHandler() {
	// Do nothing
}

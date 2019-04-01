package tasks

import (
	"feeder/types"
	"feeder/utils"
	"fmt"
	"github.com/cosmos/cosmos-sdk/client"
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

	FlagVoterKey = "from"
	flagChainID  = "chain-id"

	flagAddress = "address"

	//
	defaultUpdatingInterval = time.Minute * 1
	// defaultUpdatingSource   = "https://feeder.terra.money:7468/last"
	defaultUpdatingSource = "http://localhost:5000/last"

	// voting default
	defaultLCDAddress = "https://soju.terra.money:1317"
	defaultChainID    = "soju-0005"
	defaultKeyPass    = "12345678"
)

// Updater Task definition
type UpdaterTask struct {
	keeper *types.HistoryKeeper

	SourceURL string
	noVoting  bool

	voterKey     string
	voterKeyPass string
}

var _ types.Task = (*UpdaterTask)(nil)

// Implementation

// Create new Update Task
func NewUpdaterTaskRunner(keeper *types.HistoryKeeper, noVoting bool, voterKey string) *types.TaskRunner {
	sourceURL := viper.GetString(flagUpdatingSource)

	voterKeyPass := ""
	if !noVoting {
		buf := client.BufferStdin()
		prompt := fmt.Sprintf(
			"Password for account '%s' (default %s):", voterKey, defaultKeyPass,
		)

		voterKeyPass, err := client.GetPassword(prompt, buf)
		if err != nil && voterKeyPass != "" {
			fmt.Println(err)
			return nil
		}
	}

	return types.NewTaskRunner("Price Updater", &UpdaterTask{keeper, sourceURL, noVoting, voterKey, voterKeyPass}, viper.GetDuration(flagUpdatingInterval))
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

		cmd.Flags().String(FlagVoterKey, "my_name", "key name")
		cmd.Flags().String(flagAddress, "terra1xffsq0sf43gjp66qaza590xp6suzsdmuxsyult", "Voter account address")

		_ = viper.BindPFlag(flagVotingCli, cmd.Flags().Lookup(flagVotingCli))
		_ = viper.BindPFlag(flagChainID, cmd.Flags().Lookup(flagChainID))

		_ = viper.BindPFlag(FlagVoterKey, cmd.Flags().Lookup(FlagVoterKey))
		_ = viper.BindPFlag(flagAddress, cmd.Flags().Lookup(flagAddress))

		viper.SetDefault(flagVotingCli, false)
		viper.SetDefault(flagChainID, defaultChainID)

		if !viper.GetBool(flagVotingCli) {
			cmd.Flags().String(flagLCDAddress, defaultLCDAddress, "the url of lcd daemon to request vote")
			_ = viper.BindPFlag(flagLCDAddress, cmd.Flags().Lookup(flagLCDAddress))
			viper.SetDefault(flagLCDAddress, defaultLCDAddress)

			_ = cmd.MarkFlagRequired(flagAddress)
		}

		_ = cmd.MarkFlagRequired(FlagVoterKey)
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

	voterAddress := viper.GetString(flagAddress)
	chainID := viper.GetString(flagChainID)

	byCli := viper.GetBool(flagVotingCli)

	lcdAddress := viper.GetString(flagLCDAddress)

	err = utils.VoteAll(task.voterKey, task.voterKeyPass, voterAddress, chainID, byCli, lcdAddress, history.Prices)
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

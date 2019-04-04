package updater

import (
	"feeder/terrafeeder/types"
	"feeder/terrafeeder/utils"
	"fmt"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"os"
	"time"
)

const (
	flagUpdatingInterval = "updating-interval"
	flagUpdatingSource   = "updating-source"
	flagNoDBMode         = "no-db"

	// voting flags
	flagNoVoting   = "no-voting"
	flagVoterKey   = "from"
	flagAddress    = "address"
	flagChainID    = "chain-id"
	flagVotingCli  = "voting-cli"
	flagLCDAddress = "lcd"
)

const (
	defaultUpdatingInterval = time.Minute * 1
	defaultUpdatingSource   = "http://localhost:7658/last" // temporary setting for dev.
	// defaultUpdatingSource   = "https://feeder.terra.money:7468/last"

	// voting default
	defaultLCDAddress = "https://soju.terra.money:1317"
	defaultChainID    = "soju-0005"
	defaultKeyPass    = "12345678"
)

// Updater BaseTask definition
type Task struct {
	types.BaseTask

	keeper *types.HistoryKeeper

	sourceURL string
	noVoting  bool

	voterKey     string
	voterKeyPass string
}

var _ types.Task = (*Task)(nil)

// Implementation

// Create new Update BaseTask
func NewTask(keeper *types.HistoryKeeper) *Task {

	sourceURL := viper.GetString(flagUpdatingSource)
	noVoting := viper.GetBool(flagNoVoting)
	voterKey := viper.GetString(flagVoterKey)

	voterKeyPass := os.Getenv("FEEDER_PASSPHRASE")
	if !noVoting && voterKeyPass == "" {
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

	task := &Task{
		types.BaseTask{
			Name: "Updater",
		},
		keeper,
		sourceURL,
		noVoting,
		voterKey,
		voterKeyPass,
	}

	task.Task = task
	return task
}

// Regist REST Commands
func RegistCommand(cmd *cobra.Command) {

	cmd.Flags().Bool(flagNoVoting, false, "run without voting (alias of --proxy)")
	_ = viper.BindPFlag(flagNoVoting, cmd.Flags().Lookup(flagNoVoting))
	// viper.SetDefault(flagNoVoting, false)

	cmd.Flags().Duration(flagUpdatingInterval, defaultUpdatingInterval, "Updating interval (Duration format)")
	cmd.Flags().String(flagUpdatingSource, defaultUpdatingSource, "Updating interval (Duration format)")
	cmd.Flags().Bool(flagNoDBMode, false, "Running as no DB mode, doesn't save price history")

	_ = viper.BindPFlag(flagUpdatingInterval, cmd.Flags().Lookup(flagUpdatingInterval))
	_ = viper.BindPFlag(flagUpdatingSource, cmd.Flags().Lookup(flagUpdatingSource))
	_ = viper.BindPFlag(flagNoDBMode, cmd.Flags().Lookup(flagNoDBMode))

	//viper.SetDefault(flagUpdatingInterval, defaultUpdatingInterval)
	//viper.SetDefault(flagUpdatingSource, defaultUpdatingSource)
	//viper.SetDefault(flagNoDBMode, false)

	if !viper.GetBool(flagNoVoting) {

		// flags about voting
		cmd.Flags().Bool(flagVotingCli, false, "Voting by cli")
		cmd.Flags().String(flagChainID, defaultChainID, "Chain ID to vote")

		cmd.Flags().String(flagVoterKey, "my_name", "key name")
		cmd.Flags().String(flagAddress, "terra1xffsq0sf43gjp66qaza590xp6suzsdmuxsyult", "Voter account address")

		_ = viper.BindPFlag(flagVotingCli, cmd.Flags().Lookup(flagVotingCli))
		_ = viper.BindPFlag(flagChainID, cmd.Flags().Lookup(flagChainID))

		_ = viper.BindPFlag(flagVoterKey, cmd.Flags().Lookup(flagVoterKey))
		_ = viper.BindPFlag(flagAddress, cmd.Flags().Lookup(flagAddress))

		//viper.SetDefault(flagVotingCli, false)
		//viper.SetDefault(flagChainID, defaultChainID)

		if !viper.GetBool(flagVotingCli) {
			cmd.Flags().String(flagLCDAddress, defaultLCDAddress, "the url of lcd daemon to request vote")
			_ = viper.BindPFlag(flagLCDAddress, cmd.Flags().Lookup(flagLCDAddress))
			//viper.SetDefault(flagLCDAddress, defaultLCDAddress)

			_ = cmd.MarkFlagRequired(flagAddress)
		}

		_ = cmd.MarkFlagRequired(flagVoterKey)
		_ = cmd.MarkFlagRequired(flagChainID)

	}
}

// override Start function to set initial interval
func (task *Task) Start() {
	task.StartWithInterval(viper.GetDuration(flagUpdatingInterval))
}

// Change price updating source url
func (task *Task) SetSourceURL(url string) {
	task.sourceURL = url
}

// Run task
func (task *Task) loop() {

	history, err := task.updatePrice()
	if err != nil {
		fmt.Println(err)
		return
	}

	if !task.noVoting {
		if err := task.votePrice(history); err != nil {
			fmt.Println(err)
			return
		}
	}
}

func (task *Task) updatePrice() (*types.History, error) {
	fmt.Println("Updating....")

	history, err := utils.UpdatePrices(task.sourceURL)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	fmt.Println("Updated!")

	return history, nil
}

func (task *Task) votePrice(history *types.History) error {

	fmt.Println("Voting....")

	if !viper.GetBool(flagNoDBMode) {
		_ = task.keeper.AddHistory(history)
	}

	voterAddress := viper.GetString(flagAddress)
	chainID := viper.GetString(flagChainID)

	byCli := viper.GetBool(flagVotingCli)
	lcdAddress := viper.GetString(flagLCDAddress)

	if err := utils.VoteAll(task.voterKey, task.voterKeyPass, voterAddress, chainID, byCli, lcdAddress, history.Prices); err != nil {
		return err
	}

	fmt.Println("Voted!")

	return nil
}

func (task *Task) Runner() {
	fmt.Printf("%s is Ready\r\n", task.Name)

	for {
		select {
		case <-task.Done:
			fmt.Printf("%s is shutting down\r\n", task.Name)
			return

		case <-task.Ticker.C:
			task.loop()
		}
	}
}

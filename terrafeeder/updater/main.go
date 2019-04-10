package updater

import (
	"encoding/json"
	"fmt"
	cosmosCli "github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	tendermintCli "github.com/tendermint/tendermint/libs/cli"
	"oracle-feeder/terrafeeder/types"
	"oracle-feeder/terrafeeder/utils"
	"os"
	"time"
)

const (
	flagUpdatingInterval = "updating-interval"
	flagUpdatingSource   = "updating-source"

	// voting flags
	flagNoVoting   = "no-voting"
	flagVoteBy     = "vote-by"
	flagLCDAddress = "lcd"
)

const (
	defaultUpdatingInterval = time.Minute * 1
	defaultUpdatingSource   = "http://localhost:5000/last" // temporary setting for dev.
	// defaultUpdatingSource   = "https://feeder.terra.money:7658/last"

	// voting default
	defaultLCDAddress = "https://soju.terra.money:1317"
	defaultKeyPass    = "12345678"
)

var (
	defaultCLIHome = os.ExpandEnv("$HOME/.terracli")
)

// Updater BaseTask definition
type Task struct {
	types.BaseTask

	history *types.History

	sourceURLs []string
	noVoting   bool

	voterKey     string
	voterKeyPass string
}

var _ types.Task = (*Task)(nil)

// Implementation

// Create new Update BaseTask
func NewTask() *Task {

	sourceURLs := viper.GetStringSlice(flagUpdatingSource)
	noVoting := viper.GetBool(flagNoVoting)
	voter := viper.GetString(cosmosCli.FlagFrom)

	voterKeyPass := os.Getenv("FEEDER_PASSPHRASE")
	if !noVoting && voterKeyPass == "" {
		buf := cosmosCli.BufferStdin()
		prompt := fmt.Sprintf(
			"Password for account '%s' (default %s):", voter, defaultKeyPass,
		)

		voterKeyPass, err := cosmosCli.GetPassword(prompt, buf)
		if err != nil && voterKeyPass != "" {
			fmt.Println(err)
			return nil
		}
	}

	task := &Task{
		types.BaseTask{
			Name: "Updater",
		},
		nil,
		sourceURLs,
		noVoting,
		voter,
		voterKeyPass,
	}

	task.Task = task
	return task
}

// Regist REST Commands
func RegistCommand(cmd *cobra.Command) {
	cmd.PersistentFlags().String(cosmosCli.FlagChainID, "", "Chain ID of tendermint node")

	cmd.Flags().Bool(flagNoVoting, false, "run without voting (alias of --proxy)")
	_ = viper.BindPFlag(flagNoVoting, cmd.Flags().Lookup(flagNoVoting))

	cmd.Flags().Duration(flagUpdatingInterval, defaultUpdatingInterval, "Updating interval (Duration format)")
	cmd.Flags().StringSlice(flagUpdatingSource, []string{defaultUpdatingSource}, "Updating data source urls (separated by comma)")

	if !viper.GetBool(flagNoVoting) {

		cosmosCli.PostCommands(cmd)

		// flags about voting
		cmd.Flags().String(flagVoteBy, "lcd", "change voting method (lcd, rpc, cli)")
		_ = viper.BindPFlag(flagVoteBy, cmd.Flags().Lookup(flagVoteBy))

		voteBy := viper.GetString(flagVoteBy)
		if voteBy == "lcd" {
			cmd.Flags().String(flagLCDAddress, defaultLCDAddress, "the url of lcd daemon to request vote")
		}
		if voteBy == "rpc" {
			// do nothing
		}
		if voteBy == "cli" {
			// do nothing
		}

		cmd.Flags().String(tendermintCli.HomeFlag, defaultCLIHome, "node's home directory")

		_ = cmd.MarkFlagRequired(cosmosCli.FlagFrom)
		_ = cmd.MarkFlagRequired(cosmosCli.FlagChainID)
	}
}

// override Start function to set initial interval
func (task *Task) Start() {
	task.StartWithInterval(viper.GetDuration(flagUpdatingInterval))
}

// Updating source url
func (task *Task) SetSourceURL(url []string) {
	task.sourceURLs = url
}

// Add new source url
func (task *Task) AddSourceURL(url string) {
	task.sourceURLs = append(task.sourceURLs, url)
}

// Run task
func (task *Task) loop() {

	var err error
	task.history, err = task.updatePrice()
	if err != nil {
		fmt.Println(err)
		return
	}

	if !task.noVoting {
		if err := task.votePrice(task.history); err != nil {
			fmt.Println(err)
			return
		}
	}
}

func (task *Task) GetHistory() *types.History {
	return task.history
}

func (task *Task) GetHistoryBytes() []byte {
	b, err := json.Marshal(task.history)
	if err != nil {
		return make([]byte, 0)
	}

	return b
}

func (task *Task) updatePrice() (*types.History, error) {
	fmt.Println("Updating....")

	history, err := utils.UpdatePrices(task.sourceURLs)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	fmt.Println("Updated!")

	return history, nil
}

func (task *Task) votePrice(history *types.History) error {

	fmt.Println("Voting....")

	cliCtx := context.NewCLIContext()
	chainID := viper.GetString(cosmosCli.FlagChainID)
	lcdAddress := viper.GetString(flagLCDAddress)

	if err := VoteAll(cliCtx, task.voterKeyPass, chainID, lcdAddress, history.Prices); err != nil {
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

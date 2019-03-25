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
	flagVotingInterval = "voting-interval"
	flagVotingCli      = "voting-cli"
	flagLCDAddress     = "lcd"

	//
	defaultVotingInterval = time.Minute * 1
	defaultLCDAddress     = "https://soju.terra.money:1317"
	defaultChainID        = "soju-0005"

	//
	flagFrom    = "from"
	flagPass    = "pass"
	flagChainID = "chain-id"

	flagAddress = "address"
)

// Voter Task definition
type VoterTask struct {
	keeper *types.HistoryKeeper
}

var _ types.Task = (*VoterTask)(nil)

// Implementation

// Create new Voter Task
func NewVoterTask(keeper *types.HistoryKeeper) *types.TaskRunner {
	return types.NewTaskRunner("Price Voter", &VoterTask{keeper}, viper.GetDuration(flagVotingInterval))
}

// Regist REST Commands
func RegistVoterCommand(cmd *cobra.Command) {
	cmd.Flags().Duration(flagVotingInterval, defaultVotingInterval, "Voting interval (Duration format)")
	cmd.Flags().Bool(flagVotingCli, false, "Voting by cli")
	cmd.Flags().String(flagChainID, defaultChainID, "Chain ID to vote")

	cmd.Flags().String(flagFrom, "my_name", "key name")
	cmd.Flags().String(flagPass, "12345678", "password")
	cmd.Flags().String(flagAddress, "terra1xffsq0sf43gjp66qaza590xp6suzsdmuxsyult", "Voter account address")

	_ = viper.BindPFlag(flagVotingInterval, cmd.Flags().Lookup(flagVotingInterval))
	_ = viper.BindPFlag(flagVotingCli, cmd.Flags().Lookup(flagVotingCli))
	_ = viper.BindPFlag(flagChainID, cmd.Flags().Lookup(flagChainID))

	_ = viper.BindPFlag(flagFrom, cmd.Flags().Lookup(flagFrom))
	_ = viper.BindPFlag(flagPass, cmd.Flags().Lookup(flagPass))
	_ = viper.BindPFlag(flagAddress, cmd.Flags().Lookup(flagAddress))

	viper.SetDefault(flagVotingInterval, defaultVotingInterval)
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

// Run task
func (task *VoterTask) RunHandler() {
	fmt.Println("Voting....")

	prices := task.keeper.GetLatest()

	//config
	voterKey := viper.GetString(flagFrom)
	voterPass := viper.GetString(flagPass)
	voterAddress := viper.GetString(flagAddress)
	chainID := viper.GetString(flagChainID)

	byCli := viper.GetBool(flagVotingCli)

	lcdClient := utils.NewLCDClient(viper.GetString(flagLCDAddress))

	//
	account, err := lcdClient.QueryAccount(voterAddress)
	if err != nil {
		fmt.Println(err)
		return
	}

	for _, price := range prices {
		var err error
		if !byCli {
			err = lcdClient.VoteByREST(price, account, voterKey, voterPass, chainID)
		} else {
			err = utils.VoteByCli(price)
		}

		if err != nil {
			fmt.Println(err)
		}
	}

	fmt.Println("Voted!")
}

// dummy
func (task *VoterTask) InitHandler() {}

// dummy
func (task *VoterTask) ShutdownHandler() {}

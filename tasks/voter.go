package tasks

import (
	"bytes"
	"encoding/json"
	"feeder/types"
	"fmt"
	"github.com/cosmos/cosmos-sdk/types/rest"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"io/ioutil"
	"net/http"
	"time"
)

const (
	flagVotingInterval = "voting-interval"
	flagVotingCli      = "voting-cli"
	flagLCDAddress     = "lcd"

	//
	defaultVotingInterval = time.Minute * 1
	defaultLCDAddress     = "https://soju.terra.money:1317"
	defaultChainId        = "soju-0005"

	//
	FlagFrom    = "from"
	FlagPass    = "pass"
	FlagChainId = "chain-id"

	FlagAddress = "address"
)

// Voter Task definition
type VoterTask struct {
	keeper *types.HistoryKeeper
}

var _ types.Task = (*VoterTask)(nil)

// Implementation

// Create new Voter Task
func NewVoterTask(done chan struct{}, keeper *types.HistoryKeeper) *types.TaskRunner {
	return &types.TaskRunner{"Price Voter", done, &VoterTask{keeper}}
}

// Regist REST Commands
func (task *VoterTask) RegistCommand(cmd *cobra.Command) {
	cmd.Flags().Duration(flagVotingInterval, defaultVotingInterval, "Voting interval (Duration format)")
	cmd.Flags().Bool(flagVotingCli, false, "Voting by cli")
	cmd.Flags().String(FlagChainId, defaultChainId, "Chain ID to vote")

	cmd.Flags().String(FlagFrom, "my_name", "key name")
	cmd.Flags().String(FlagPass, "12345678", "password")
	cmd.Flags().String(FlagAddress, "terra1xffsq0sf43gjp66qaza590xp6suzsdmuxsyult", "Voter account address")

	_ = viper.BindPFlag(flagVotingInterval, cmd.Flags().Lookup(flagVotingInterval))
	_ = viper.BindPFlag(flagVotingCli, cmd.Flags().Lookup(flagVotingCli))
	_ = viper.BindPFlag(FlagChainId, cmd.Flags().Lookup(FlagChainId))

	_ = viper.BindPFlag(FlagFrom, cmd.Flags().Lookup(FlagFrom))
	_ = viper.BindPFlag(FlagPass, cmd.Flags().Lookup(FlagPass))
	_ = viper.BindPFlag(FlagAddress, cmd.Flags().Lookup(FlagAddress))

	viper.SetDefault(flagVotingInterval, defaultVotingInterval)
	viper.SetDefault(flagVotingCli, false)
	viper.SetDefault(FlagChainId, defaultChainId)

	if !viper.GetBool(flagVotingCli) {
		cmd.Flags().String(flagLCDAddress, defaultLCDAddress, "the url of lcd daemon to request vote")
		_ = viper.BindPFlag(flagLCDAddress, cmd.Flags().Lookup(flagLCDAddress))
		viper.SetDefault(flagLCDAddress, defaultLCDAddress)

		_ = cmd.MarkFlagRequired(FlagAddress)
	}

	_ = cmd.MarkFlagRequired(FlagFrom)
	_ = cmd.MarkFlagRequired(FlagPass)
	_ = cmd.MarkFlagRequired(FlagChainId)

}

// Run task
func (task *VoterTask) RunHandler() {
	time.Sleep(viper.GetDuration(flagVotingInterval)) // to prevent uninitialized voting, sleep first
	fmt.Println("Voting....")

	prices := task.keeper.GetLatest()

	//config
	voterKey := viper.GetString(FlagFrom)
	voterPass := viper.GetString(FlagPass)
	voterAddress := viper.GetString(FlagAddress)
	chainId := viper.GetString(FlagChainId)

	byCli := viper.GetBool(flagVotingCli)

	//
	account, err := queryAccount(voterAddress)
	if err != nil {
		fmt.Println(err)
		return
	}

	for _, price := range prices {
		var err error
		if !byCli {
			err = voteByREST(price, account, voterKey, voterPass, chainId)
		} else {
			err = voteByCli(price)
		}

		if err != nil {
			fmt.Println(err)
		}
	}

	fmt.Println("Voted!")

}

func queryAccount(voterAddress string) (*types.Account, error) {
	lcdAddr := viper.GetString(flagLCDAddress)

	// get account id & seq. no.
	resp, err := http.Get(lcdAddr + "/auth/accounts/" + voterAddress)
	if err != nil {
		fmt.Println("REST Error: ", err)
		return nil, err
	}

	body, err := ioutil.ReadAll(resp.Body)

	var account types.Account
	err = json.Unmarshal(body, &account)

	return &account, err
}

type VoteReq struct {
	BaseReq      rest.BaseReq `json:"base_req"`
	Price        float64      `json:"price"`
	Denom        string       `json:"denom"`
	VoterAddress string       `json:"voter_address"`
}

func voteByREST(price types.Price, account *types.Account, voterKey string, voterPass string, chainId string) error {
	fmt.Println("Voting ", price.Denom, " as ", price.Current)

	lcdAddr := viper.GetString(flagLCDAddress)
	// tx vote
	voteMsg := VoteReq{
		rest.BaseReq{
			voterKey,
			voterPass,
			"Voting from oracle feeder",
			chainId,

			uint64(account.Value.AccountNumber),
			uint64(account.Value.Sequence),

			nil,
			nil,

			"20000",
			"1.2",

			false,
			false,
		},
		price.Current,
		price.Denom,
		account.Value.Address,
	}

	pbytes, _ := json.Marshal(voteMsg)
	buff := bytes.NewBuffer(pbytes)
	resp, err := http.Post(lcdAddr+"/oracle/vote", "application/json", buff)

	if err != nil {
		fmt.Println(err)
		return err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return err
	}

	msg := string(body)
	account.Value.Sequence += 1
	fmt.Println("%v", msg)

	return nil
}

func voteByCli(price types.Price) error {
	fmt.Println("Voting ", price.Denom, " as ", price.Current)
	return nil
}

func (task *VoterTask) InitHandler()     {}
func (task *VoterTask) ShutdownHandler() {}

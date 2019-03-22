package cmds

import (
	"feeder/tasks"
	"feeder/types"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/syndtr/goleveldb/leveldb"
	"os"
	"os/signal"
	"syscall"
)

const (
	flagNoRest    = "no-rest"
	flagNoUpdater = "no-updater"
	flagNoVoter   = "no-voter"

	flagProxyMode = "proxy"
)

var done = make(chan struct{})

func StartCommands(db *leveldb.DB) *cobra.Command {

	keeper := &types.HistoryKeeper{db}

	var taskRunners []*types.TaskRunner

	if !viper.GetBool(flagNoRest) {
		taskRunners = append(taskRunners, tasks.NewRestTask(done, keeper))
	}

	if !viper.GetBool(flagNoUpdater) {
		taskRunners = append(taskRunners, tasks.NewUpdaterTask(done, keeper))
	}

	if !viper.GetBool(flagNoVoter) && viper.GetBool(flagProxyMode) {
		taskRunners = append(taskRunners, tasks.NewVoterTask(done, keeper))
	}

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start feeder client daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			return startServer(taskRunners)
		},
	}

	cmd.Flags().Bool(flagProxyMode, false, "starting feeder as a proxy")
	cmd.Flags().Bool(flagNoRest, false, "run without REST Api serving")
	cmd.Flags().Bool(flagNoUpdater, false, "run without data updating")
	cmd.Flags().Bool(flagNoVoter, false, "run without voting (alias of --proxy)")

	_ = viper.BindPFlag(flagProxyMode, cmd.Flags().Lookup(flagProxyMode))
	_ = viper.BindPFlag(flagNoRest, cmd.Flags().Lookup(flagNoRest))
	_ = viper.BindPFlag(flagNoUpdater, cmd.Flags().Lookup(flagNoUpdater))
	_ = viper.BindPFlag(flagNoVoter, cmd.Flags().Lookup(flagNoVoter))

	// regist task commands
	for _, task := range taskRunners {
		task.RegistCommand(cmd)
	}

	return cmd
}

func startServer(tasks []*types.TaskRunner) error {
	fmt.Printf("Terra Oracle Feeder - Daemon Mode\n\n")

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	for _, task := range tasks {
		go task.Run()
	}

	<-sigs

	fmt.Println("Shutting down...")
	close(done)

	return nil
}

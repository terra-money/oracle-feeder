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
	flagNoREST    = "no-rest"
	flagNoUpdater = "no-updater"
	flagNoVoter   = "no-voter"

	flagProxyMode = "proxy"
)

var taskRunners []*types.TaskRunner

// "start" command handler
func StartCommands(db *leveldb.DB) *cobra.Command {

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start feeder client daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			return startServer()
		},
	}

	cmd.Flags().Bool(flagProxyMode, false, "starting feeder as a proxy")
	cmd.Flags().Bool(flagNoREST, false, "run without REST Api serving")
	cmd.Flags().Bool(flagNoUpdater, false, "run without data updating")
	cmd.Flags().Bool(flagNoVoter, false, "run without voting (alias of --proxy)")

	_ = viper.BindPFlag(flagProxyMode, cmd.Flags().Lookup(flagProxyMode))
	_ = viper.BindPFlag(flagNoREST, cmd.Flags().Lookup(flagNoREST))
	_ = viper.BindPFlag(flagNoUpdater, cmd.Flags().Lookup(flagNoUpdater))
	_ = viper.BindPFlag(flagNoVoter, cmd.Flags().Lookup(flagNoVoter))

	viper.SetDefault(flagProxyMode, false)
	viper.SetDefault(flagNoREST, false)
	viper.SetDefault(flagNoUpdater, false)
	viper.SetDefault(flagNoVoter, false)

	keeper := &types.HistoryKeeper{Db: db}

	if !viper.GetBool(flagNoREST) {
		tasks.RegistRESTCommand(cmd)
		taskRunners = append(taskRunners, tasks.NewRESTTask(keeper))
	}

	if !viper.GetBool(flagNoUpdater) {
		tasks.RegistUpdaterCommand(cmd)
		updater := tasks.NewUpdaterTask(keeper)
		taskRunners = append(taskRunners, updater)

		updater.RunHandler() // for initial update
	}

	if !viper.GetBool(flagNoVoter) && !viper.GetBool(flagProxyMode) {
		tasks.RegistVoterCommand(cmd)
		taskRunners = append(taskRunners, tasks.NewVoterTask(keeper))
	}

	return cmd
}

func startServer() error {
	fmt.Printf("Terra Oracle Feeder - Daemon Mode\n\n")

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	for _, task := range taskRunners {
		go task.Run()
	}

	<-sigs

	fmt.Print("\n\n")
	fmt.Println("-------------------------------")
	fmt.Println("Shutting down...")
	fmt.Println("-------------------------------")

	for _, task := range taskRunners {
		go task.Stop()
	}

	return nil
}

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
	flagNoREST   = "no-rest"
	flagNoVoting = "no-voting"

	flagProxyMode = "proxy"
)

var taskRunners []*types.TaskRunner

// "start" command handler
func StartCommands(db *leveldb.DB) *cobra.Command {

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start terrafeeder client daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			return startServer(db)
		},
	}

	cmd.Flags().Bool(flagProxyMode, false, "starting terrafeeder as a proxy")
	cmd.Flags().Bool(flagNoREST, false, "run without REST Api serving")
	cmd.Flags().Bool(flagNoVoting, false, "run without voting (alias of --proxy)")

	_ = viper.BindPFlag(flagProxyMode, cmd.Flags().Lookup(flagProxyMode))
	_ = viper.BindPFlag(flagNoREST, cmd.Flags().Lookup(flagNoREST))
	_ = viper.BindPFlag(flagNoVoting, cmd.Flags().Lookup(flagNoVoting))

	viper.SetDefault(flagProxyMode, false)
	viper.SetDefault(flagNoREST, false)
	viper.SetDefault(flagNoVoting, false)

	// adding task flags
	tasks.RegistUpdaterCommand(cmd, viper.GetBool(flagNoVoting))

	if !viper.GetBool(flagNoREST) {
		tasks.RegistRESTCommand(cmd)
	}

	return cmd
}

func startServer(db *leveldb.DB) error {
	fmt.Printf("Terra Oracle Feeder - Daemon Mode\n\n")

	// init keeper
	keeper := &types.HistoryKeeper{Db: db}

	// init updater
	updater := tasks.NewUpdaterTaskRunner(keeper)
	taskRunners = append(taskRunners, updater)

	// init rest
	if !viper.GetBool(flagNoREST) {
		taskRunners = append(taskRunners, tasks.NewRESTTaskRunner(keeper, updater))
	}

	// run
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

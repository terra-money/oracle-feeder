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

var done = make(chan struct{})

func StartCommands(db *leveldb.DB) *cobra.Command {

	keeper := &types.HistoryKeeper{db}

	var restTask = tasks.NewRestTask(done, keeper)
	var updaterTask = tasks.NewUpdaterTask(done, keeper)
	var voterTask = tasks.NewVoterTask(done, keeper)

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start feeder client daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			return startServer([]*types.TaskRunner{
				restTask,
				updaterTask,
				voterTask,
			})
		},
	}

	cmd.Flags().Bool(tasks.FlagProxyMode, false, "starting feeder as a proxy")
	_ = viper.BindPFlag(tasks.FlagProxyMode, cmd.Flags().Lookup(tasks.FlagProxyMode))

	// regist task commands
	restTask.RegistCommand(cmd)
	updaterTask.RegistCommand(cmd)

	if !viper.GetBool(tasks.FlagProxyMode) {
		voterTask.RegistCommand(cmd)
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

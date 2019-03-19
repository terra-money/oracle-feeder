package tasks

import (
	"context"
	"feeder/types"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"net/http"
	"time"
)

const (
	flagListenAddr = "laddr"
	flagDataSource = "data-source"

	//
	defaultListenAddr = "127.0.0.1:7468"
	defaultDataSource = "https://feeder.terra.money:7468"
)

// Rest Task definition
type RESTTask struct {
	done chan struct{}
}

var _ types.Task = (*RESTTask)(nil)


// Implementation

// Create new REST Task
func NewRestTask(done chan struct{}) types.Task {
	return &RESTTask{done}
}

// Regist REST Commands
func (task *RESTTask)RegistCommand(cmd *cobra.Command) {

	cmd.Flags().String(flagDataSource, "", "Data source url")
	cmd.Flags().String(flagListenAddr, defaultListenAddr, "REST Listening Port")

	_ = viper.BindPFlag(flagDataSource, cmd.Flags().Lookup(flagDataSource))
	_ = viper.BindPFlag(flagListenAddr, cmd.Flags().Lookup(flagListenAddr))

	viper.SetDefault(flagDataSource, defaultDataSource)
	viper.SetDefault(flagListenAddr, defaultListenAddr)

}

// Run task
func (task *RESTTask)Run() {

	server := &http.Server{Addr: viper.GetString(flagListenAddr), Handler: nil}

	fmt.Println("REST Server is Ready")
	select {
	case <- task.done:
		fmt.Println("REST Server is shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_ = server.Shutdown(ctx)
		cancel()
		return

	default:
		_ = server.ListenAndServe()

	}
}

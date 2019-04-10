package rest

import (
	"context"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"net/http"
	"oracle-feeder/terrafeeder/types"
	"oracle-feeder/terrafeeder/updater"
	"strings"
	"time"
)

const (
	flagListenAddr = "laddr"
)

const (
	defaultListenAddr = "127.0.0.1:7468"
)

// Rest BaseTask definition
type Task struct {
	types.BaseTask

	server      *http.Server
	router      *mux.Router
	updaterTask *updater.Task
}

var _ types.Task = (*Task)(nil)

// Implementation

// Create new REST BaseTask
func NewTask(updaterTask *updater.Task) *Task {
	done := make(chan struct{})
	task := &Task{
		BaseTask: types.BaseTask{
			Name: "REST Service",
			Done: done,
		},
		updaterTask: updaterTask,
	}
	task.Task = task
	return task
}

// Regist REST Commands
func RegistCommand(cmd *cobra.Command) {
	cmd.Flags().String(flagListenAddr, defaultListenAddr, "REST Listening Port")
}

// start rest server
func (task *Task) Runner() {
	task.serverInit()
	fmt.Printf("%s is Ready\r\n", task.Name)

	select {
	case <-task.Done:
		fmt.Printf("%s is shutting down\r\n", task.Name)
		task.serverShutdown()
		return

	default:
		_ = task.server.ListenAndServe()
	}
}

func (task *Task) serverInit() {
	task.router = mux.NewRouter()
	task.server = &http.Server{Addr: viper.GetString(flagListenAddr), Handler: task.router}

	fmt.Println("REST listening address : ", viper.GetString(flagListenAddr))

	isLocalBound := strings.HasPrefix(task.server.Addr, "localhost") || strings.HasPrefix(task.server.Addr, "127.0.0.1")
	task.registRoute(task.router, isLocalBound)
}

func (task *Task) serverShutdown() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	_ = task.server.Shutdown(ctx)
	cancel()
}

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

	defaultListenAddr = "127.0.0.1:7468"
)

// Rest Task definition
type RESTTask struct {
	server *http.Server
	mux    *http.ServeMux
	keeper *types.HistoryKeeper
}

var _ types.Task = (*RESTTask)(nil)

// Implementation

// Create new REST Task
func NewRESTTask(keeper *types.HistoryKeeper) *types.TaskRunner {
	return types.NewTaskRunner("REST API Server", &RESTTask{keeper: keeper}, 0)
}

// Regist REST Commands
func RegistRESTCommand(cmd *cobra.Command) {

	cmd.Flags().String(flagListenAddr, defaultListenAddr, "REST Listening Port")

	_ = viper.BindPFlag(flagListenAddr, cmd.Flags().Lookup(flagListenAddr))

	viper.SetDefault(flagListenAddr, defaultListenAddr)

}

// init server
func (task *RESTTask) InitHandler() {
	task.mux = http.NewServeMux()
	task.server = &http.Server{Addr: viper.GetString(flagListenAddr), Handler: task.mux}

	fmt.Println("REST binded at ", viper.GetString(flagListenAddr))

	isLocal := false
	if task.server.Addr == "localhost" || task.server.Addr == "127.0.0.1" {
		isLocal = true
	}
	registHTTPHandler(task.keeper, task.mux, isLocal)

}

// Run task
func (task *RESTTask) RunHandler() {
	_ = task.server.ListenAndServe()
}

// shutdown serrver
func (task *RESTTask) ShutdownHandler() {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	_ = task.server.Shutdown(ctx)
	cancel()
}

func registHTTPHandler(keeper *types.HistoryKeeper, mux *http.ServeMux, isLocal bool) {
	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		_, _ = res.Write([]byte("Hello, oracle!"))
	})

	mux.HandleFunc("/last", func(res http.ResponseWriter, req *http.Request) {
		pricesByte := keeper.GetLatestBytes()
		_, _ = res.Write(pricesByte)
	})

	if isLocal {
		mux.HandleFunc("/interval", func(res http.ResponseWriter, req *http.Request) {
			if req.Method != "POST" {
				res.WriteHeader(http.StatusNotFound)
				return
			}
		})

		mux.HandleFunc("/vote", func(res http.ResponseWriter, req *http.Request) {
			if req.Method != "POST" {
				res.WriteHeader(http.StatusNotFound)
				return
			}
		})
	}

}

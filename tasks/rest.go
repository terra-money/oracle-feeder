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

	FlagProxyMode = "proxy"

	//
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
func NewRestTask(done chan struct{}, keeper *types.HistoryKeeper) *types.TaskRunner {

	if viper.GetBool(FlagProxyMode) {
		return nil
	}

	return &types.TaskRunner{"REST API Server", done, &RESTTask{keeper: keeper}}
}

// Regist REST Commands
func (task *RESTTask) RegistCommand(cmd *cobra.Command) {

	cmd.Flags().String(flagListenAddr, defaultListenAddr, "REST Listening Port")

	_ = viper.BindPFlag(flagListenAddr, cmd.Flags().Lookup(flagListenAddr))

	viper.SetDefault(flagListenAddr, defaultListenAddr)

}

// init server
func (task *RESTTask) InitHandler() {
	task.mux = http.NewServeMux()
	task.server = &http.Server{Addr: viper.GetString(flagListenAddr), Handler: task.mux}

	fmt.Println("REST binded at ", viper.GetString(flagListenAddr))
	registHttpHandler(task.keeper, task.mux)

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

func registHttpHandler(keeper *types.HistoryKeeper, mux *http.ServeMux) {
	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		_, _ = res.Write([]byte("Hello, oracle!"))
	})

	mux.HandleFunc("/last", func(res http.ResponseWriter, req *http.Request) {
		pricesByte := keeper.GetLatestBytes()
		_, _ = res.Write(pricesByte)
	})
}

package tasks

import (
	"context"
	"encoding/json"
	"feeder/types"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	flagListenAddr = "laddr"

	defaultListenAddr = "127.0.0.1:7468"
)

// Rest Task definition
type RESTTask struct {
	server        *http.Server
	mux           *http.ServeMux
	keeper        *types.HistoryKeeper
	updaterRunner *types.TaskRunner
}

var _ types.Task = (*RESTTask)(nil)

// Implementation

// Create new REST Task
func NewRESTTaskRunner(keeper *types.HistoryKeeper, updaterRunner *types.TaskRunner) *types.TaskRunner {
	return types.NewTaskRunner("REST API Server", &RESTTask{keeper: keeper, updaterRunner: updaterRunner}, 0)
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
	if strings.HasPrefix(task.server.Addr, "localhost") || strings.HasPrefix(task.server.Addr, "127.0.0.1") {
		isLocal = true
	}
	task.registHTTPHandler(task.keeper, task.mux, isLocal)

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

func (task *RESTTask) registHTTPHandler(keeper *types.HistoryKeeper, mux *http.ServeMux, isLocal bool) {
	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		_, _ = res.Write([]byte("Hello, oracle!"))
	})

	mux.HandleFunc("/last", func(res http.ResponseWriter, req *http.Request) {
		pricesByte := keeper.GetLatestBytes()
		_, _ = res.Write(pricesByte)
	})

	mux.HandleFunc("/range", func(res http.ResponseWriter, req *http.Request) {
		query := req.URL.Query()
		fromTime := query.Get("from")
		toTime := query.Get("to")

		if fromTime == "" || toTime == "" {
			_, _ = fmt.Fprintf(res, "query parsing err")
			return
		}

		histories := task.keeper.GetHistories(fromTime, toTime)
		b, err := json.Marshal(histories)

		if err != nil {
			_, _ = fmt.Fprintf(res, "encoding error")
			return
		}

		_, _ = res.Write(b)
	})

	if isLocal {
		mux.HandleFunc("/interval", func(res http.ResponseWriter, req *http.Request) {
			if req.Method != "POST" {
				res.WriteHeader(http.StatusBadRequest)
				return
			}
			if err := req.ParseForm(); err != nil {
				_, _ = fmt.Fprintf(res, "Data parsing err: %v", err)
				return
			}

			interval, err := time.ParseDuration(req.FormValue("interval"))
			if err != nil {
				_, _ = fmt.Fprintf(res, "Data parsing err: %v", err)
				return
			}

			task.updaterRunner.SetInterval(interval)
			_, _ = res.Write([]byte("ok"))
		})

		mux.HandleFunc("/source", func(res http.ResponseWriter, req *http.Request) {
			if req.Method != "POST" {
				res.WriteHeader(http.StatusBadRequest)
				return
			}
			if err := req.ParseForm(); err != nil {
				_, _ = fmt.Fprintf(res, "Data parsing err: %v", err)
				return
			}

			sourceURL, err := url.Parse(req.FormValue("url"))
			if err != nil {
				res.WriteHeader(http.StatusBadRequest)
				return
			}

			updateTask := task.updaterRunner.Task.(*UpdaterTask)
			updateTask.SourceURL = sourceURL.String()

			_, _ = res.Write([]byte("ok"))
		})
	}

}

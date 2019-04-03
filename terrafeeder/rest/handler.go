package rest

import (
	"encoding/json"
	"feeder/terrafeeder/types"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"net/url"
	"time"
)

func (task *Task) registRoute(keeper *types.HistoryKeeper, r *mux.Router, isLocalBound bool) {
	r.HandleFunc("/", health()).Methods("GET")
	r.HandleFunc("/last", queryLatestPrice(keeper)).Methods("GET")
	r.HandleFunc("/range", queryPriceByRange(task)).Methods("GET").Queries("from")

	if isLocalBound {
		r.HandleFunc("/interval", setUpdateInterval(task)).Methods("POST")
		r.HandleFunc("/source", setUpdateSource(task)).Methods("POST")
	}
}

func setUpdateSource(task *Task) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		if err := req.ParseForm(); err != nil {
			_, _ = fmt.Fprintf(res, "Data parsing err: %v", err)
			return
		}

		sourceURL, err := url.Parse(req.FormValue("url"))
		if err != nil {
			res.WriteHeader(http.StatusBadRequest)
			return
		}

		task.updaterTask.SetSourceURL(sourceURL.String())

		_, _ = res.Write([]byte("ok"))
	}
}

func setUpdateInterval(task *Task) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		if err := req.ParseForm(); err != nil {
			_, _ = fmt.Fprintf(res, "Data parsing err: %v", err)
			return
		}

		interval, err := time.ParseDuration(req.FormValue("interval"))
		if err != nil {
			_, _ = fmt.Fprintf(res, "Data parsing err: %v", err)
			return
		}

		task.updaterTask.SetInterval(interval)
		_, _ = res.Write([]byte("ok"))
	}
}

func queryPriceByRange(task *Task) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {

		fromTime := req.FormValue("from")
		toTime := req.FormValue("to")

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
	}
}

func queryLatestPrice(keeper *types.HistoryKeeper) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		pricesByte := keeper.GetLatestBytes()
		_, _ = res.Write(pricesByte)
	}
}

func health() http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		_, _ = res.Write([]byte("Hello, oracle!"))
	}
}

package rest

import (
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"net/url"
	"time"
)

func (task *Task) registRoute(r *mux.Router, isLocalBound bool) {
	r.HandleFunc("/", health()).Methods("GET")
	r.HandleFunc("/last", queryLatestPrice(task)).Methods("GET")

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

func queryLatestPrice(task *Task) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		pricesByte := task.updaterTask.GetHistoryBytes()
		_, _ = res.Write(pricesByte)
	}
}

func health() http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		_, _ = res.Write([]byte("Hello, oracle!"))
	}
}

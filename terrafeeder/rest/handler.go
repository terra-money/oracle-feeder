package rest

import (
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"net/url"
	"strings"
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

		sources := strings.Split(req.FormValue("url"), ",")
		var urls []string

		// cleaning URLs
		for _, source := range sources {
			parsed, err := url.Parse(source)
			if err != nil {
				res.WriteHeader(http.StatusBadRequest)
				errorMsg := fmt.Sprintf("[%s] is not an available URL", source)
				_, _ = res.Write([]byte(errorMsg))
				return
			}
			urls = append(urls, parsed.String())
		}

		task.updaterTask.SetSourceURL(urls)
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

package types

import (
	"time"
)

type Task interface {
	Runner()
}

// BaseTask Runner
type BaseTask struct {
	Task

	Name string

	Done   chan struct{}
	Ticker *time.Ticker
}

// Start task goroutine
func (task *BaseTask) Start() {

	task.Done = make(chan struct{})
	task.Ticker = nil

	go task.Runner()
}

// Start periodic task with interval
func (task *BaseTask) StartWithInterval(interval time.Duration) {

	task.Done = make(chan struct{})
	task.Ticker = time.NewTicker(interval)

	go task.Runner()
}

// change task interval
func (task *BaseTask) SetInterval(interval time.Duration) {
	task.Stop()
	task.StartWithInterval(interval)
}

// Stop task
func (task *BaseTask) Stop() {
	if task.Ticker != nil {
		task.Ticker.Stop()
	}
	close(task.Done)
}

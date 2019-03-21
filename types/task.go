package types

import (
	"fmt"
	"github.com/spf13/cobra"
)

// Premitive interface of feeder Tasks
type Task interface {
	RegistCommand(cmd *cobra.Command)

	InitHandler()
	ShutdownHandler()
	RunHandler()
}

// Task Runner
type TaskRunner struct {
	Name string
	Done chan struct{}

	Task
}

func (runner *TaskRunner) RegistCommand(cmd *cobra.Command) {
	runner.Task.RegistCommand(cmd)
}

// starting point of task
func (runner *TaskRunner) Run() {

	runner.Task.InitHandler()
	fmt.Printf("%s is Ready\r\n", runner.Name)

	for {
		select {
		case <-runner.Done:
			fmt.Printf("%s is shutting down\r\n", runner.Name)
			runner.Task.ShutdownHandler()
			return

		default:
			runner.Task.RunHandler()
		}
	}
}

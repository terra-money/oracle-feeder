package types

import "github.com/spf13/cobra"

// Premitive interface of feeder Tasks
type Task interface {
	RegistCommand(cmd *cobra.Command)
	Run()
}

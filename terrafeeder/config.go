package main

import (
	"feeder/terrafeeder/rest"
	"feeder/terrafeeder/updater"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func registCommands(cmd *cobra.Command) {

	cmd.Flags().Bool(flagNoREST, false, "run without REST Api serving")
	_ = viper.BindPFlag(flagNoREST, cmd.Flags().Lookup(flagNoREST))

	// adding task flags
	updater.RegistCommand(cmd)
	if !viper.GetBool(flagNoREST) {
		rest.RegistCommand(cmd)
	}

}

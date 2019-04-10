package main

import (
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"oracle-feeder/terrafeeder/rest"
	"oracle-feeder/terrafeeder/updater"
)

func registCommands(cmd *cobra.Command) {

	cmd.Flags().Bool(flagNoREST, false, "run without REST Api serving")
	_ = viper.BindPFlag(flagNoREST, cmd.Flags().Lookup(flagNoREST))

	// adding task flags
	updater.RegistCommand(cmd)
	if !viper.GetBool(flagNoREST) {
		rest.RegistCommand(cmd)
	}

	_ = viper.BindPFlags(cmd.Flags())
	_ = viper.BindPFlags(cmd.PersistentFlags())
}

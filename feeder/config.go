package main

import (
	"fmt"
	"github.com/mitchellh/go-homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"os"
)

// read saved configure for cobra
func InitConfig(rootCmd *cobra.Command) {
	var cfgFile string

	cobra.OnInitialize(func() {
		if cfgFile != "" {
			viper.SetConfigFile(cfgFile)
		} else {
			home, err := homedir.Dir()
			if err != nil {
				fmt.Println(err)
				os.Exit(1)
			}

			viper.AddConfigPath(home)
			viper.SetConfigName(".feeder")
		}

		viper.AutomaticEnv()

		if err := viper.ReadInConfig(); err == nil {
			fmt.Println("Using config file:", viper.ConfigFileUsed())
		}
	})

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.feeder.yaml)")

}

// adding common configure commands to app
func ConfigCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "config",
		Short: "Query remote node for status",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "set [key] [value]",
		Short: "set configure",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			viper.Set(args[0], args[1])
			return nil
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "listing all configures",
		RunE: func(cmd *cobra.Command, args []string) error {
			for _, key := range viper.AllKeys() {
				fmt.Printf("%v: %v\n", key, viper.Get(key))
			}
			return nil
		},
	})

	return cmd
}
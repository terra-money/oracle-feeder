package cmds

import (
	"fmt"
	"github.com/mitchellh/go-homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"os"
)

const (
	flagHome = "home"
)

var (
	defaultHome = os.ExpandEnv("$HOME/.terrafeeder")
)

// read saved configure for cobra
func InitConfig(rootCmd *cobra.Command) {
	cobra.OnInitialize(func() {
		home := viper.GetString(flagHome)

		if home != "" {
			viper.AddConfigPath(home)
		} else {
			home, err := homedir.Dir()
			if err != nil {
				fmt.Println(err)
				os.Exit(1)
			}

			viper.AddConfigPath(home)
		}
		viper.SetConfigName(".feeder")
		viper.AutomaticEnv()

		if err := viper.ReadInConfig(); err == nil {
			fmt.Println("Using config file:", viper.ConfigFileUsed())
		}
	})

	rootCmd.PersistentFlags().String(flagHome, defaultHome, "directory for config and data")
	_ = viper.BindPFlag(flagHome, rootCmd.PersistentFlags().Lookup(flagHome))
	viper.SetDefault(flagHome, defaultHome)

}

func GetHistoryPath() string {
	return viper.GetString(flagHome) + "/history.db"
}

// adding common configure commands to app
func ConfigCommands() *cobra.Command {
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

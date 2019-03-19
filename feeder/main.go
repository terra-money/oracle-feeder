// Copyright © 2019 Terra <team@terra.money>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"feeder/tasks"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"os"
	"os/signal"
	"syscall"
)

const (
	flagFrom = "from"
	flagPass = "pass"

	flagProxyMode = "proxy"
)

func main() {

	// rootCmd represents the base command when called without any subcommands
	var rootCmd = &cobra.Command{
		Use:   "feedercli",
		Short: "Terra oracle feeder client daemon",
		Long:  `Terra oracle feeder client daemon. Long description`,
	}

	InitConfig(rootCmd)
	rootCmd.AddCommand(startCommand(), ConfigCommand(), )

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func startCommand() *cobra.Command {

	done := make(chan struct {})

	restTask := tasks.NewRestTask(done)
	updaterTask := tasks.NewUpdaterTask(done)
	voterTask := tasks.NewVoterTask(done)

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start feeder client daemon",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Printf("Terra Oracle Feeder - Daemon Mode\n\n")

			sigs := make(chan os.Signal, 1)
			signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)


			go restTask.Run()
			go updaterTask.Run()
			if !viper.GetBool(flagProxyMode) {
				go voterTask.Run()
			}

			<-sigs

			fmt.Println("Shutting down...")
			close(done)

			return nil
		},
	}

	cmd.Flags().Bool(flagProxyMode, false, "starting feeder as a proxy")
	_ = viper.BindPFlag(flagProxyMode, cmd.Flags().Lookup(flagProxyMode))

	restTask.RegistCommand(cmd)
	updaterTask.RegistCommand(cmd)
	if !viper.GetBool(flagProxyMode) {
		voterTask.RegistCommand(cmd)
	}

	cmd.Flags().String(flagFrom, "my_name", "key name")
	cmd.Flags().String(flagPass, "12345678", "password")

	_ = cmd.MarkFlagRequired(flagFrom)
	_ = cmd.MarkFlagRequired(flagPass)

	return cmd
}

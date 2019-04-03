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
	"feeder/terrafeeder/rest"
	"feeder/terrafeeder/types"
	"feeder/terrafeeder/updater"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/syndtr/goleveldb/leveldb"
	"os"
	"os/signal"
	"syscall"
)

const (
	flagHome   = "home"
	flagNoREST = "no-rest"
)

var (
	defaultHome = os.ExpandEnv("$HOME/.terrafeeder")
)

func main() {
	var keeper *types.HistoryKeeper

	// rootCmd represents the base command when called without any subcommands
	var rootCmd = &cobra.Command{
		Use:   "terrafeeder",
		Short: "Terra oracle terrafeeder client daemon",
		Long:  `Terra oracle terrafeeder client daemon. Long description`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return startFeeder(keeper)
		},
	}

	initConfig(rootCmd)
	db, err := leveldb.OpenFile(getHistoryPath(), nil)

	if err != nil {
		panic(err)
	}

	// init keeper
	keeper = &types.HistoryKeeper{Db: db}

	defer func() {
		_ = db.Close()
	}()

	registCommands(rootCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func startFeeder(keeper *types.HistoryKeeper) error {

	// init updater
	updaterTask := updater.NewTask(keeper)

	// init rest
	var restTask *rest.Task
	if !viper.GetBool(flagNoREST) {
		restTask = rest.NewTask(keeper, updaterTask)
	}

	fmt.Printf("Terra Oracle Feeder\n")
	run(updaterTask, restTask)

	return nil
}

func run(updater *updater.Task, rest *rest.Task) {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	updater.Start()
	if rest != nil {
		rest.Start()
	}

	<-sigs

	fmt.Print("\n\n")
	fmt.Println("-------------------------------")
	fmt.Println("Shutting down...")
	fmt.Println("-------------------------------")

	updater.Stop()
	if rest != nil {
		rest.Stop()
	}
}

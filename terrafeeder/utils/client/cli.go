package client

import (
	"feeder/terrafeeder/types"
	"fmt"
	"github.com/cosmos/cosmos-sdk/client/context"
	"io"
	"os/exec"
	"strings"
	"time"
)

// Send vote message via terracli
func VoteByCli(cliCtx context.CLIContext, price types.Price, voterPass string, chainID string) error {

	voterName := cliCtx.GetFromName()
	voteCommand := fmt.Sprintf(
		"terracli tx oracle vote %v %v --from %v --chain-id %v --fees 2luna",
		price.Denom, price.Price, voterName, chainID)

	executeCmd(voteCommand, voterPass)

	return nil
}

// codes from cosmos faucet
func executeCmd(command string, writes ...string) {
	cmd, wc, _ := goExecute(command)

	for _, write := range writes {
		_, _ = wc.Write([]byte(write + "\n"))
	}
	_ = cmd.Wait()
}

func goExecute(command string) (cmd *exec.Cmd, pipeIn io.WriteCloser, pipeOut io.ReadCloser) {
	cmd = getCmd(command)
	pipeIn, _ = cmd.StdinPipe()
	pipeOut, _ = cmd.StdoutPipe()
	go func() {
		_ = cmd.Start()
	}()
	time.Sleep(time.Second)
	return cmd, pipeIn, pipeOut
}

func getCmd(command string) *exec.Cmd {
	// split command into command and args
	split := strings.Split(command, " ")

	var cmd *exec.Cmd
	if len(split) == 1 {
		cmd = exec.Command(split[0])
	} else {
		cmd = exec.Command(split[0], split[1:]...)
	}

	return cmd
}

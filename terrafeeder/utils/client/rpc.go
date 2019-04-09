package client

import (
	"feeder/terrafeeder/types"
	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/client/utils"
	sdk "github.com/cosmos/cosmos-sdk/types"
	authtxb "github.com/cosmos/cosmos-sdk/x/auth/client/txbuilder"
	terra "github.com/terra-project/core/app"
	"github.com/terra-project/core/x/oracle"
)

// Send vote message to RPC(EXPERIMENTAL)
func VoteByRPC(cliCtx context.CLIContext, passphrase string, price *types.Price) error {

	cdc := terra.MakeCodec()
	cliCtx = cliCtx.WithCodec(cdc).WithAccountDecoder(cdc)
	txBldr := authtxb.NewTxBuilderFromCLI().WithTxEncoder(utils.GetTxEncoder(cdc)).WithFees("3000mluna")

	msg := oracle.NewMsgPriceFeed(price.Denom, price.Price, cliCtx.GetFromAddress())
	err := msg.ValidateBasic()
	if err != nil {
		return err
	}

	// GenerateOrBroadcastMsgs
	txBldr, sdkerr := utils.PrepareTxBuilder(txBldr, cliCtx)
	if sdkerr != nil {
		return sdkerr
	}

	fromName := cliCtx.GetFromName()

	// build and sign the transaction
	txBytes, sdkerr := txBldr.BuildAndSign(fromName, passphrase, []sdk.Msg{msg})
	if sdkerr != nil {
		return sdkerr
	}

	// broadcast to a Tendermint node
	res, sdkerr := cliCtx.BroadcastTx(txBytes)
	_ = cliCtx.PrintOutput(res)
	return sdkerr
}

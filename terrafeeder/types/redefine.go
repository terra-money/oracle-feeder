package types

import (
	"github.com/cosmos/cosmos-sdk/types"
)

// redefine not exported type "humanReadableError" in "cosmos/types/error"
type HumanReadableError struct {
	Codespace types.CodespaceType `json:"codespace"`
	Code      types.CodeType      `json:"code"`
	Message   string              `json:"message"`
}

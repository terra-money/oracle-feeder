package utils

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestDecMedian(t *testing.T) {
	vals := make([]sdk.Dec, 0)
	vals = append(vals, sdk.NewDec(20))
	vals = append(vals, sdk.NewDec(10))
	vals = append(vals, sdk.NewDec(40))

	require.True(t, DecMedian(vals).Equal(sdk.NewDec(20)))
	vals = append(vals, sdk.NewDec(11))

	require.True(t, DecMedian(vals).Equal(sdk.NewDecWithPrec(155, 1)))
}

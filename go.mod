module github.com/terra-project/oracle-feeder

go 1.12

require (
	github.com/cosmos/cosmos-sdk v0.34.0
	github.com/gorilla/mux v1.7.0
	github.com/spf13/cobra v0.0.3
	github.com/spf13/viper v1.3.2
	github.com/stretchr/testify v1.3.0
	github.com/tendermint/tendermint v0.31.4
	github.com/terra-project/core v0.1.1
)

replace golang.org/x/crypto => github.com/tendermint/crypto v0.0.0-20180820045704-3764759f34a5

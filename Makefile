VERSION := '123'
BUILD_TAGS = netgo
BUILD_FLAGS = -tags "${BUILD_TAGS}"

all: install

install: tools lint
	go install $(BUILD_FLAGS) ./terrafeeder

build: tools lint
	go build $(BUILD_FLAGS) -o build/terrafeeder ./terrafeeder

tools:
	go get dep
	go get gometalinter

lint:
	!(gometalinter --exclude /usr/local/go/src/ --exclude 'vendor/*' --disable-all --enable='errcheck' --vendor ./... | grep -v "client/")

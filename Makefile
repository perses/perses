GO            ?= go
GOFMT         ?= $(GO)fmt
GOARCH        ?= amd64
COMMIT        := $(shell git rev-parse HEAD)
DATE          := $(shell date +%Y-%m-%d)
COVER_PROFILE := coverage.txt
PKG_LDFLAGS   := github.com/perses/common/app
LDFLAGS       := -ldflags "-X ${PKG_LDFLAGS}.Version=${VERSION} -X ${PKG_LDFLAGS}.Commit=${COMMIT} -X ${PKG_LDFLAGS}.BuildTime=${DATE}"

.PHONY: checkformat
checkformat:
	@echo ">> checking code format"
	! $(GOFMT) -d $$(find . -name '*.go' -print) | grep '^' ;\

fmt:
	@echo ">> format code"
	$(GO) fmt $(pkgs)

test: generate
	@echo ">> running all tests"
	$(GO) test -count=1 -v ./...

.PHONY: integration-test
integration-test: generate
	$(GO) test -tags=integration -v -count=1 -cover -coverprofile=$(COVER_PROFILE) -coverpkg=./... ./...

coverage-html: integration-test
	@echo ">> Print test coverage"
	$(GO) tool cover -html=$(COVER_PROFILE)

.PHONY: build
build: generate
	@echo ">> build the perses api"
	CGO_ENABLED=0 GOARCH=${GOARCH} $(GO) build  -a -installsuffix cgo ${LDFLAGS} -o ./bin/perses ./cmd/perses

.PHONY: generate
generate:
	$(GO) generate ./internal/api

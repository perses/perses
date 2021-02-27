GO            ?= go
GOFMT         ?= $(GO)fmt
GOARCH        ?= amd64
pkgs          = $$($(GO) list ./...)
COMMIT        := $(shell git rev-parse HEAD)
DATE          := $(shell date +%Y-%m-%d)
PKG_LDFLAGS   := github.com/perses/common/app
LDFLAGS       := -ldflags "-X ${PKG_LDFLAGS}.Version=${VERSION} -X ${PKG_LDFLAGS}.Commit=${COMMIT} -X ${PKG_LDFLAGS}.BuildTime=${DATE}"

.PHONY: checkformat
checkformat:
	@echo ">> checking code format"
	! $(GOFMT) -d $$(find . -name '*.go' -print) | grep '^' ;\

fmt:
	@echo ">> format code"
	$(GO) fmt $(pkgs)

test:
	@echo ">> running all tests"
	$(GO) test -count=1 -v $(pkgs)

.PHONY: build
build: generate
	@echo ">> build the perses api"
	CGO_ENABLED=0 GOARCH=${GOARCH} $(GO) build  -a -installsuffix cgo ${LDFLAGS} -o ./bin/perses ./cmd/perses

.PHONY: generate
generate:
	$(GO) generate ./internal/api

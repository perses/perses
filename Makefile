# Copyright 2021 Amadeus s.a.s
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
	$(GO) fmt ./...

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
	$(GO) generate ./internal/api/front

# Copyright 2021 The Perses Authors
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

GO                    ?= go
CUE                   ?= cue
GOCI                  ?= golangci-lint
GOFMT                 ?= $(GO)fmt
GOOS                  ?= $(shell $(GO) env GOOS)
GOARCH                ?= $(shell $(GO) env GOARCH)
GOHOSTOS              ?= $(shell $(GO) env GOHOSTOS)
GOHOSTARCH            ?= $(shell $(GO) env GOHOSTARCH)
COMMIT                := $(shell git rev-parse HEAD)
DATE                  := $(shell date +%Y-%m-%d)
BRANCH                := $(shell git rev-parse --abbrev-ref HEAD)
VERSION               ?= $(shell cat VERSION)
COVER_PROFILE         := coverage.txt
PKG_LDFLAGS           := github.com/prometheus/common/version
LDFLAGS               := -s -w -X ${PKG_LDFLAGS}.Version=${VERSION} -X ${PKG_LDFLAGS}.Revision=${COMMIT} -X ${PKG_LDFLAGS}.BuildDate=${DATE} -X ${PKG_LDFLAGS}.Branch=${BRANCH}
GORELEASER_PARALLEL   ?= 0

export LDFLAGS
export DATE

all: clean build

.PHONY: bump-version
bump-version:
	./scripts/ui_release.sh --bump-version "${VERSION}"
	cd ui/ && npm install
	git add "./ui/package-lock.json" "./**/package.json"

.PHONY: tag
tag:
	./scripts/release.sh --tag "${VERSION}"

.PHONY: checkformat
checkformat:
	@echo ">> checking go code format"
	! $(GOFMT) -d $$(find . -name '*.go' -not -path "./ui/*" -print) | grep '^'
	@echo ">> running check for cue file format"
	./scripts/cue.sh --checkformat

.PHONY: checkunused
checkunused:
	@echo ">> running check for unused/missing packages in go.mod"
	$(GO) mod tidy
	@git diff --exit-code -- go.sum go.mod

.PHONY: checkstyle
checkstyle:
	@echo ">> checking code style"
	$(GOCI) run --timeout 5m

.PHONY: checklicense
checklicense:
	@echo ">> checking license"
	./scripts/check_license.sh --check *.js *.jsx *.ts *.tsx *.go *.cue

.PHONY: fixlicense
fixlicense:
	@echo ">> adding license header where it's missing"
	./scripts/check_license.sh --add *.js *.jsx *.ts *.tsx *.go *.cue

.PHONY: fmt
fmt:
	@echo ">> format code"
	$(GOFMT) -w -l $$(find . -name '*.go' -not -path "./ui/*" -print)
	./scripts/cue.sh --fmt

.PHONY: cue-eval
cue-eval:
	@echo ">> eval cue schemas"
	$(CUE) eval ./schemas/...

.PHONY: cue-test
cue-test:
	@echo ">> test cue schemas with json data"
	$(GO) run ./scripts/cue-test/cue-test.go

.PHONY: test
test: generate
	@echo ">> running all tests"
	$(GO) test -count=1 -v ./...

.PHONY: integration-test
integration-test: generate
	$(GO) test -tags=integration -v -count=1 -cover -coverprofile=$(COVER_PROFILE) -coverpkg=./... ./...

.PHONY: coverage-html
coverage-html: integration-test
	@echo ">> Print test coverage"
	$(GO) tool cover -html=$(COVER_PROFILE)

.PHONY: assets-compress
assets-compress:
	@echo '>> compressing assets'
	scripts/compress_assets.sh

## Cross build binaries for all platforms (Use "make build" in development)
.PHONY: cross-build
cross-build: ## Cross build binaries for all platforms (Use "make build" in development)
	goreleaser release --snapshot --rm-dist --parallelism ${GORELEASER_PARALLEL}

.PHONY: cross-release
cross-release:
	goreleaser release --rm-dist --parallelism ${GORELEASER_PARALLEL} --release-notes GENERATED_CHANGELOG.md

.PHONY: build
build: build-ui build-api build-cli

.PHONY: build-api
build-api: generate
	@echo ">> build the perses api"
	CGO_ENABLED=0 GOARCH=${GOARCH} GOOS=${GOOS} $(GO) build -ldflags "${LDFLAGS}" -o ./bin/perses ./cmd/perses

.PHONY: build-ui
build-ui:
	cd ./ui && npm install && npm run build

.PHONY: build-cli
build-cli:
	@echo ">> build the perses cli"
	CGO_ENABLED=0 GOARCH=${GOARCH} GOOS=${GOOS} $(GO) build -ldflags "${LDFLAGS}" -o ./bin/percli ./cmd/percli

.PHONY: generate
generate: assets-compress
	GOARCH=${GOHOSTARCH} GOOS=${GOHOSTOS} $(GO) generate ./internal/api

.PHONY: extract-changelog
extract-changelog:
	$(GO) run ./scripts/extract-changelog/extract-changelog.go --version="${VERSION}"

.PHONY: generate-changelog
generate-changelog:
	$(GO) run ./scripts/generate-changelog/generate-changelog.go --version="${VERSION}"

.PHONY: clean
clean:
	rm -rf ./bin
	rm GENERATED_CHANGELOG.md
	./scripts/ui_release.sh --clean
	cd ./ui && npm run clean

.PHONY: update-go-deps
update-go-deps:
	@echo ">> updating Go dependencies"
	@for m in $$($(GO) list -mod=readonly -m -f '{{ if and (not .Indirect) (not .Main)}}{{.Path}}{{end}}' all); do \
		$(GO) get -d $$m; \
	done

.PHONY: update-npm-deps
update-npm-deps:
	@echo ">> updating npm dependencies"
	./scripts/npm-deps.sh "minor"

.PHONY: upgrade-npm-deps
upgrade-npm-deps:
	@echo ">> upgrading npm dependencies"
	./scripts/npm-deps.sh "latest"

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

GO            ?= go
GOFMT         ?= $(GO)fmt
GOARCH        ?= amd64
COMMIT        := $(shell git rev-parse HEAD)
DATE          := $(shell date +%Y-%m-%d)
BRANCH        := $(shell git rev-parse --abbrev-ref HEAD)
COVER_PROFILE := coverage.txt
PKG_LDFLAGS   := github.com/prometheus/common/version
LDFLAGS       := -ldflags "-X ${PKG_LDFLAGS}.Version=${VERSION} -X ${PKG_LDFLAGS}.Revision=${COMMIT} -X ${PKG_LDFLAGS}.BuildDate=${DATE} -X ${PKG_LDFLAGS}.Branch=${BRANCH}"

all: clean build

.PHONY: release
release:
	./ui_release.sh --release $(version)
	cd ui/ && npm install && cd ../
	git add "./ui/package-lock.json" "./**/package.json"

.PHONY: checkformat
checkformat:
	@echo ">> checking code format"
	! $(GOFMT) -d $$(find . -name '*.go' -print) | grep '^' ;\

.PHONY: checklicense
checklicense:
	@echo ">> checking license"
	./check_license.sh --check *.js *.jsx *.ts *.tsx *.go

.PHONY: fixlicense
fixlicense:
	@echo ">> adding license header where it's missing"
	./check_license.sh --add *.js *.jsx *.ts *.tsx *.go

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
build: build-ui build-api build-cli

.PHONY: build-api
build-api: generate
	@echo ">> build the perses api"
	CGO_ENABLED=0 GOARCH=${GOARCH} $(GO) build ${LDFLAGS} -o ./bin/perses ./cmd/perses

.PHONY: build-ui
build-ui:
	cd ./ui && npm install && npm run build

.PHONY: build-cli
build-cli:
	@echo ">> build the perses cli"
	CGO_ENABLED=0 GOARCH=${GOARCH} $(GO) build ${LDFLAGS} -o ./bin/percli ./cmd/percli

.PHONY: crossbuild
crossbuild: generate
	goreleaser --snapshot --skip-publish --rm-dist

.PHONY: generate
generate:
	$(GO) generate ./internal/api
	$(GO) generate ./internal/api/front

.PHONY: clean
clean:
	rm -rf ./bin
	./ui_release.sh --clean
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
	./npm-deps.sh "minor"

.PHONY: upgrade-npm-deps
upgrade-npm-deps:
	@echo ">> upgrading npm dependencies"
	./npm-deps.sh "latest"

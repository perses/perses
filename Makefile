GO      ?= go
GOFMT   ?= $(GO)fmt
pkgs     = $$($(GO) list ./...)

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

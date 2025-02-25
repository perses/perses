module dac-test

go 1.23.4

replace github.com/perses/perses => ../../ // Use current version

require (
	github.com/perses/perses v0.50.1
	github.com/perses/plugins/prometheus v0.0.0-20250211164300-9fe475c5d750
	github.com/perses/plugins/staticlistvariable v0.0.0-20250211164300-9fe475c5d750
	github.com/perses/plugins/table v0.0.0-20250211164300-9fe475c5d750
	github.com/perses/plugins/timeserieschart v0.0.0-20250211164300-9fe475c5d750
	github.com/stretchr/testify v1.10.0
)

require (
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/go-jose/go-jose/v4 v4.0.4 // indirect
	github.com/jpillora/backoff v1.0.0 // indirect
	github.com/muhlemmer/gu v0.3.1 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/mwitkow/go-conntrack v0.0.0-20190716064945-2f068394615f // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/prometheus/client_golang v1.21.0 // indirect
	github.com/prometheus/client_model v0.6.1 // indirect
	github.com/prometheus/common v0.62.0 // indirect
	github.com/prometheus/procfs v0.15.1 // indirect
	github.com/zitadel/oidc/v3 v3.35.0 // indirect
	github.com/zitadel/schema v1.3.0 // indirect
	golang.org/x/crypto v0.35.0 // indirect
	golang.org/x/net v0.34.0 // indirect
	golang.org/x/oauth2 v0.26.0 // indirect
	golang.org/x/sys v0.30.0 // indirect
	golang.org/x/text v0.22.0 // indirect
	google.golang.org/protobuf v1.36.3 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

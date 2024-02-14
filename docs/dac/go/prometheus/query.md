# Prometheus Datasource Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

var options []query.Option
query.PromQL("max by (container) (container_memory_rss{})", options...)
```
Need to provide the PromQL expression and a list of options.

## Default options

- [Expr()](#expr): with the expression provided in the constructor.


## Available options

#### Expr
```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.Expr("max by (container) (container_memory_rss{})")
```
Define query expression.


#### Datasource
```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.Datasource("MySuperDatasource")
```
Define the datasource the query will use.


#### SeriesNameFormat
```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.SeriesNameFormat("") // TODO: check
```
Define query series name format.


#### MinStep
```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.MinStep("1w7d24h60m60s")
```
Define query min step.


#### Resolution
```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.Resolution(3600)
```
Define query resolution.

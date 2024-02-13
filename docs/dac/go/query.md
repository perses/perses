# Query

## Constructor

```golang
import "github.com/perses/perses/go-sdk/query"

var options []query.Option
query.New(options...)
```
Need to provide a list of options.


## Default options

- None


## Available options

### Plugin

```golang
import "github.com/perses/perses/go-sdk/query" 

var common.Plugin plugin
query.Plugin(plugin)
```
Define the query plugin, or you can use [plugin builders](#plugins-options) available.


## Plugins Options

### Prometheus Query

```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.PromQL("max by (container) (container_memory_rss{})")
```
Set Prometheus Query plugin for the query. More info at [Prometheus Query](./prometheus/query.md).
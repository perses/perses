# PromQL Variable Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/prometheus/promql"

var options []promql.Option
promql.PrometheusPromQL("group by (namespace) (kube_namespace_labels{}", options...)
```

Need to provide the name of the variable and a list of options.

## Default options

- [Expr()](#expr): with the expr provided in the constructor.

## Available options

### Expr

```golang
import "github.com/perses/perses/go-sdk/prometheus/promql" 

promql.Expr("group by (namespace) (kube_namespace_labels{}")
```

Define the promQL metadata name and the display name.

### LabelName

```golang
import "github.com/perses/perses/go-sdk/prometheus/promql"

promql.LabelName("my_super_label_name")
```

Define a label name that can filter the result of the expression.

### Datasource

```golang
import "github.com/perses/perses/go-sdk/prometheus/promql"

promql.Datasource("datasourceName")
```

Define the datasource where the expression will be executed.

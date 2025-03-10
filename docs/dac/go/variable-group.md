# Variable Group Builder

Variable group is a helper for adding variables to a dashboard.
It will automatically filter the variables added to the group.
The filter logic is applied by the variable plugin builder.
Variables are filtered by their order in the group: first variable will filter the next ones.
Ignored variables are filtered, but they don't filter the next variables added to the group.

## Constructor

```golang
import "github.com/perses/perses/go-sdk/variable-group"

var options []variablegroup.Option
variablegroup.New(options...)
```

Need a list of options.

## Default options

- None

## Available options

### AddVariable

```golang
import "github.com/perses/perses/go-sdk/variable-group"
import "github.com/perses/perses/go-sdk/variable"

var variableOptions []variable.Option
variablegroup.AddVariable("MySuperVariableName", variableOptions...)
```

Add a variable to the group, this variable will be filtered by variable already present in the group and will filter next variables added.
More info at [Variable](./variable.md).

### AddIgnoredVariable

```golang
import "github.com/perses/perses/go-sdk/variable-group"
import "github.com/perses/perses/go-sdk/variable"

var variableOptions []variable.Option
variablegroup.AddIgnoredVariable("MySuperVariableName", variableOptions...)
```

Add a variable to the group, this variable will be filtered by variable already present in the group.
However, this variable will not filter next variables added. More info at [Variable](./variable.md).

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	variablegroup "github.com/perses/perses/go-sdk/variable-group"
	listvariable "github.com/perses/perses/go-sdk/variable/list-variable"
	textvariable "github.com/perses/perses/go-sdk/variable/text-variable"
	labelnames "github.com/perses/plugins/prometheus/sdk/go/variable/label-names"
	labelvalues "github.com/perses/plugins/prometheus/sdk/go/variable/label-values"
	"github.com/perses/plugins/prometheus/sdk/go/variable/promql"
)

func main() {
	dashboard.New("ExampleDashboard",
		dashboard.AddVariableGroup(
			variablegroup.AddVariable("stack",
				listvariable.List(
					labelvalues.PrometheusLabelValues("stack",
						labelvalues.Matchers("thanos_build_info"),
						labelvalues.Datasource("promDemo"),
					),
					listvariable.DisplayName("PaaS"),
				),
			),
			variablegroup.AddVariable("prometheus",
				textvariable.Text("platform", textvariable.Constant(true)),
			),
			variablegroup.AddVariable("prometheus_namespace",
				textvariable.Text("observability",
					textvariable.Constant(true),
					textvariable.Description("constant to reduce the query scope thus improve performances"),
				),
			),
			variablegroup.AddVariable("namespace", listvariable.List(
				promql.PrometheusPromQL("group by (namespace) (kube_namespace_labels{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\"})",
					promql.LabelName("namespace"), promql.Datasource("promDemo"),
				),
				listvariable.AllowMultiple(true),
			)),
			variablegroup.AddIgnoredVariable("namespaceLabels", listvariable.List(
				labelnames.PrometheusLabelNames(
					labelnames.Matchers("kube_namespace_labels"),
					labelnames.Datasource("promDemo"),
				),
			)),
			variablegroup.AddVariable("pod", listvariable.List(
				promql.PrometheusPromQL("group by (pod) (kube_pod_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"})",
					promql.LabelName("pod"), promql.Datasource("promDemo"),
				),
				listvariable.AllowMultiple(true),
				listvariable.AllowAllValue(true),
			)),
			variablegroup.AddVariable("container", listvariable.List(
				promql.PrometheusPromQL("group by (container) (kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\"})",
					promql.LabelName("container"), promql.Datasource("promDemo"),
				),
				listvariable.AllowMultiple(true),
				listvariable.AllowAllValue(true),
			)),
			variablegroup.AddIgnoredVariable("containerLabels", listvariable.List(
				listvariable.Description("simply the list of labels for the considered metric"),
				listvariable.Hidden(true),
				labelnames.PrometheusLabelNames(
					labelnames.Matchers("kube_pod_container_info"),
					labelnames.Datasource("promDemo"),
				),
			)),
		),
	)
}

```

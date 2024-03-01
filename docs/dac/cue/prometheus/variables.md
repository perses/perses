# Prometheus Variables builder

The Prometheus Variables builder helps creating prometheus-related variables easily.
It also includes the base Text variable.

> [!NOTE]
> This builder takes care of generating a pattern that we often see in dashboards: when you have 3 variables A, B and C it's quite common to "bind" them together so that B depends on A, and C depends on B + A. The Prometheus Variables builder takes care of generating such relationships for you.

## Usage

```cue
package myDaC

import (
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
)

varsBuilder & {} // input parameter expected
```

## Parameters

| Parameter | Type                                                                                     | Description                                                      |
|-----------|------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `input`   | [...#promQLInputItem \| #labelValuesInputItem \| #labelNamesInputItem \| #textInputItem] | Each array element provides the information to build a variable. |

### #promQLInputItem parameters

| Parameter        | Type                                             | Mandatory/Optional | Default             | Description                                                                      |
|------------------|--------------------------------------------------|--------------------|---------------------|----------------------------------------------------------------------------------|
| `name`           | string                                           | Mandatory          |                     | The name of this variable.                                                       |
| `pluginKind`     | `"PrometheusPromQLVariable"`                     | Mandatory          |                     | The kind of plugin for this variable.                                            |
| `metric`         | string                                           | Mandatory          |                     | The name of the source metric to be used.                                        |
| `label`          | string                                           | Mandatory          | to `name` parameter | The label from which to retrieve the list of values.                             |
| `display`        | [Display](../../../api/variable.md#display_spec) | Optional           |                     | Display object to tune the display name, description and visibility (show/hide). |
| `allowAllValue`  | bool                                             | Mandatory          | false               | Whether to append the "All" value to the list.                                   |
| `allowMultiple`  | bool                                             | Mandatory          | false               | Whether to allow multi-selection of values.                                      |
| `datasourceName` | string                                           | Mandatory          |                     | The name of the datasource to query.                                             |

### #labelValuesInputItem parameters

| Parameter        | Type                                             | Mandatory/Optional | Default             | Description                                                                      |
|------------------|--------------------------------------------------|--------------------|---------------------|----------------------------------------------------------------------------------|
| `name`           | string                                           | Mandatory          |                     | The name of this variable.                                                       |
| `pluginKind`     | `"PrometheusLabelValuesVariable"`                | Mandatory          |                     | The kind of plugin for this variable.                                            |
| `metric`         | string                                           | Mandatory          |                     | The name of the source metric to be used.                                        |
| `label`          | string                                           | Mandatory          | to `name` parameter | The label from which to retrieve the list of values.                             |
| `display`        | [Display](../../../api/variable.md#display_spec) | Optional           |                     | Display object to tune the display name, description and visibility (show/hide). |
| `allowAllValue`  | bool                                             | Mandatory          | false               | Whether to append the "All" value to the list.                                   |
| `allowMultiple`  | bool                                             | Mandatory          | false               | Whether to allow multi-selection of values.                                      |
| `datasourceName` | string                                           | Mandatory          |                     | The name of the datasource to query.                                             |

### #labelNamesInputItem parameters

| Parameter        | Type                                             | Mandatory/Optional | Default | Description                                                                      |
|------------------|--------------------------------------------------|--------------------|---------|----------------------------------------------------------------------------------|
| `name`           | string                                           | Mandatory          |         | The name of this variable.                                                       |
| `pluginKind`     | `"PrometheusLabelNamesVariable"`                 | Mandatory          |         | The kind of plugin for this variable.                                            |
| `metric`         | string                                           | Mandatory          |         | The name of the source metric to be used.                                        |
| `display`        | [Display](../../../api/variable.md#display_spec) | Optional           |         | Display object to tune the display name, description and visibility (show/hide). |
| `allowAllValue`  | bool                                             | Mandatory          | false   | Whether to append the "All" value to the list.                                   |
| `allowMultiple`  | bool                                             | Mandatory          | false   | Whether to allow multi-selection of values.                                      |
| `datasourceName` | string                                           | Mandatory          |         | The name of the datasource to query.                                             |

### #textInputItem parameters

| Parameter  | Type                                             | Mandatory/Optional | Default | Description                                                                      |
|------------|--------------------------------------------------|--------------------|---------|----------------------------------------------------------------------------------|
| `name`     | string                                           | Mandatory          |         | The name of this variable.                                                       |
| `kind`     | `"TextVariable"`                                 | Mandatory          |         | The kind of this variable                                                        |
| `display`  | [Display](../../../api/variable.md#display_spec) | Optional           |         | Display object to tune the display name, description and visibility (show/hide). |
| `value`    | string                                           | Mandatory          |         | The value of this variable.                                                      |
| `constant` | bool                                             | Mandatory          | false   | Whether this variable is a constant.                                             |

## Outputs

Contrary to some other builders, the Prometheus Variables builder provides several outputs, that you can access from their respective field:

| Field        | Type        | Description                                                                                                                                                                                                                                  |
|--------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `variables`  | string      | The definitive list of variables, to be provided to the dashboard object.                                                                                                                                                                    |
| `fullFilter` | string      | A labels matcher expression covering all the variables passed to the builder. E.g `{namespace="$namespace",pod="$pod",container="$container"}`. You'll probably want to pass this one to the panels of your dashboard.                       |
| `filters`    | [...string] | /!\ `fullFilter` should do the trick, this is for specific use cases. This is the list of all labels matcher expressions computed for the variables. E.g `["{namespace=\"$namespace\"}","{namespace=\"$namespace\",pod=\"$pod\"}",...]`      |
| `exprs`      | [...string] | /!\ this is for specific use cases. This is the list of all promQL expressions computed for the variables. E.g `["group by (namespace) (kube_namespace_labels{})","kube_pod_info{namespace=\"$namespace\",prometheus=\"$prometheus\"}",...]` |

## Example

```cue
package myDaC

import (
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
)

{varsBuilder & {
	input: [{
		name:           "namespace"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_namespace_labels"
		datasourceName: "promDemo"
	}, {
		name:     "prometheus"
		kind:     "TextVariable"
		value:    "platform"
		constant: true
	}, {
		name:           "pod"
		pluginKind:     "PrometheusLabelValuesVariable"
		metric:         "kube_pod_info"
		allowAllValue:  true
		allowMultiple:  true
		datasourceName: "promDemo"
	}, {
		name:           "container"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_pod_container_info"
		allowAllValue:  true
		allowMultiple:  true
		datasourceName: "promDemo"
	}]
}}.variables
```

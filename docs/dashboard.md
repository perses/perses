Dashboard
=========

## Data model

Note: In this documentation, the examples will be in **json**, but you can translate it into **yaml**, it is the same
syntax. A dashboard like others documents is composed by three different sections:

```json
{
  "kind": "Dashboard",
  "metadata": {},
  "spec": {}
}
```

* `kind`: like others documents is the type of the document. Here the onlue accepted is `Dashboard`
* `metadata`: contains the name of the document, the data of the creation and so on.
* `spec`: contains the specification of the document such as the different panels contained in the Dashboard.

### Metadata

You have to provide the name of the Dashboard, and the name of the Project that contains the Dashboard. In this context,
the project could be associated to the folder you could find in Grafana. For example:

```json
{
  "name": "MyDashboard",
  "project": "perses"
}
```

### Spec

There are three mandatory things to provide here:

* `datasource` is the name of the datasource. It's the direct reference of the document of type `Datasource`. The
  datasource linked must exist in the database. Otherwise, the API will reject the creation of the Dashboard
* `duration` is the default time you would like to use to looking in the past when getting data to fill the dashboard
* `sections` is the list of the section. Each section contained a list of panel. You must have at least one section.

Finally, you can define some variables that would be used then in the different panel.

Example:

```json
{
  "datasource": "nameOfTheDatasource",
  "duration": "6h",
  "variables": {},
  "sections": []
}
```

#### Variables

Variables is a map where the key is the name of the variable. The value is a document that contains the following
attribute:

* `kind` is the type of the variable. It's an enum and each value is conditioning what you can put in the
  attribute `parameter`. Possible values are :
    * `PromQLQuery`. In order to get the value for this variable, a PromQL query will be performed
    * `LabelNamesQuery`. The list of value for this variable will be calculated using the Prometheus
      endpoint `/api/v1/labels`
    * `LabelValuesQuery`. The list of value for this variable will be calculated using the Prometheus
      endpoint `/api/v1/label/<label_name>/values`
    * `Constant`. The variable has a defined list of value.
* `hide` is a boolean that will be used by the UI to decide if the variable has to be displayed. By default, it's false
* `selected` is the variable selected by default if it exists. (Not mandatory)
* `parameter` is a document, and the different attributes that defined it, are conditioned by the value of the
  attribute `kind` described above

Example:

```json
{
  "variables": {
    "foo": {
      "kind": "PromQLQuery",
      "hide": false,
      "parameter": {}
    }
  }
}
```

##### Parameter

* kind = "Constant"

In this case, `parameter` has only one attribute `values` which is a list of string

Example:

```json
{
  "parameter": {
    "values": [
      "myValue",
      "anotherValue"
    ]
  }
}
```

* kind = "PromQLQuery"

In this case, `parameter` will contain

* a PromQL expression (`expr`)
* a `label_name` that is the name of the label which is used once the PromQL query is performed to select the
  labelValue.
* a `capturing_regexp` which is a Golang regular expression used to capture potentially a sub part of the value.

Note that if the `capturing_regexp` doesn't contain any group, it won't catch any value, and you will have an empty list
for the variable. So for example if you want to catch every value with no specific filter/prefix pattern,
then `capturing_regexp` would be `(.*)` and not just `.*`

Example:

```json
{
  "parameter": {
    "expr": "max by(stack) (thanos_build_info)",
    "label_name": "stack",
    "capturing_regexp": "(.*)"
  }
}
```

* kind = "LabelNamesQuery"

In this case `parameter` must only define the attribute `capturing_regexp`. It will be used to filter the list / catch a
subset of the value like for the `PromQLQuery` described above.

Optionally you can define a list of matcher that corresponds to the parameter `match[]` like it is described in the
prometheus [documentation](https://prometheus.io/docs/prometheus/latest/querying/api/#getting-label-names) when getting
the list of label names. It will help to pre-filter on Prometheus side the list of the label names.

Example:

```json
{
  "parameter": {
    "capturing_regexp": "(.*)",
    "matchers": [
      "go"
    ]
  }
}
```

* kind = "LabelValuesQuery"

In this case `parameter` must define the attribute `label_name` and `capturing_regexp`. `capturing_regexp` is used to
filter the list / catch a subset of the value like for the `PromQLQuery` described above. `label_name` is the name of
the label you want to get the list of the values.

Optionally you can define a list of matcher that corresponds to the parameter `match[]` like it is described in the
prometheus [documentation](https://prometheus.io/docs/prometheus/latest/querying/api/#querying-label-values) when
getting the list of label names. It will help to pre-filter on Prometheus side the list of the label values.

Example:

```json
{
  "parameter": {
    "label_name": "instance",
    "capturing_regexp": "(.*)",
    "matchers": [
      "go"
    ]
  }
}
```

#### Sections

Sections is an array of section. One section contains the following attribute:

* `name` is the name of the section. It is optional.
* `order` is a number, and it is used to know the display order.
* `open` is a boolean used to know if the section is opened by default when the dashboard is loaded for the first time
* `panels` is a list of panel. A section should at least contain one panel.

Example:

```json
{
  "sections": [
    {
      "name": "NameOfMyAweSomeSection",
      "order": 0,
      "open": true,
      "panels": []
    }
  ]
}
```

##### Panels

A panel is the actual document that will describe what kind of chart you will display. One panel can only hold one
chart.

Here is the different attribute available:

* `name` is the name of the panel.
* `order` is a number used to know the display order inside the section
* `kind` is the type of chart displayed. It is an enum, and it conditions what contains the attribute `chart`. Possible
  values are :
    * `LineChart`. It is a simple graph
* `chart` contains the different parameter that described a chart. It will depend on the `kind` value

Example:

```json
{
  "panels": [
    {
      "name": "myPanel",
      "order": 0,
      "kind": "LineChart",
      "chart": {}
    }
  ]
}
```

###### Chart

* kind = "LineChart"

A `LineChart` is a simple graph composed by a list of line. Each line is described by a PromQL expression

Example:

```json
{
  "chart": {
    "lines": [
      {
        "expr": "up"
      }
    ]
  }
}
```

### Example

#### Simple dashboard

```json
[
  {
    "kind": "Dashboard",
    "metadata": {
      "name": "SimpleLineChart",
      "project": "perses"
    },
    "spec": {
      "datasource": "PrometheusDemo",
      "duration": "6h",
      "sections": [
        {
          "name": "mySection",
          "open": true,
          "panels": [
            {
              "name": "myGraphPanel",
              "kind": "LineChart",
              "chart": {
                "lines": [
                  {
                    "expr": "up"
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  }
]
```

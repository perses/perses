Dashboard
=========

## Data model

This part is describing the data model that represents a dashboard. It would help for user/developer that want to put in
a place the dashboard as code

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
* `panels` is the list of the panel.
* `layouts` is the list of layout. A layout is the object you can use to describe how to display the list of the panel.
* `entrypoint` is the json reference to one particular layout.
* `variables` is a map where the key is the reference of the variable defined as a value. The key cannot contain any
  special characters or spaces. The key is used in the different variables / panels when they need to use it. Finally,
  you can define some variables that would be used then in the different panel.

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

Variables is a map where the key is the reference of the variable. The value is the actual variable definition that
contains the following attribute:

* `kind` is the type of the variable. It's an enum and each value is conditioning what you can put in the
  attribute `parameter`. Possible values are :
    * `PromQLQuery`. In order to get the value for this variable, a PromQL query will be performed
    * `LabelNamesQuery`. The list of value for this variable will be calculated using the Prometheus
      endpoint `/api/v1/labels`
    * `LabelValuesQuery`. The list of value for this variable will be calculated using the Prometheus
      endpoint `/api/v1/label/<label_name>/values`
    * `Constant`. The variable has a defined list of value.
* `displayed_name` is the name that would be displayed by the UI. It should be filled only if `hide` is set to `false`.
* `hide` is a boolean that will be used by the UI to decide if the variable has to be displayed. By default,
  it's `false`
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

#### Panels

Panels is a map where the key is the reference of the panel. The value is the actual panel definition that will describe
what kind of chart you will display. One panel can only hold one chart.

Here is the different attribute available:

* `displayed_name` is the name of the panel that would be displayed by the UI.
* `kind` is the type of chart displayed. It is an enum, and it conditions what contains the attribute `chart`. Possible
  values are :
    * `TimeSeriesChart`. It is a simple graph
    * `GaugeChart`. It is the way to display a single number with different threshold. It can be used to show with
      different color if it's ok or not to have the current value displayed
* `chart` contains the different parameters that describe a chart. It will depend on the `kind` value

Example:

```json
{
  "panels": {
    "foo": {
      "name": "myPanel",
      "kind": "TimeSeriesChart",
      "chart": {}
    }
  }
}
```

##### TimeSeriesChart

A `TimeSeriesChart` is a simple graph composed by a list of line. Each line is described by a PromQL expression

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

#### Layouts

Layouts is a map where the key is the reference of the layout. The value the actual layout definition that will describe
how the different panels are positioned in the UI

Here is the different attribute available:

* `kind` is the type of layout. It is an enum, and it conditions what contains the attribute `parameter`. Possible value
  are:
    * `Expand`: It's a layout that can be expanded. It can be used for example if you want to hide panel by default.
    * `Grid`: It's the layout tha defines a grid. Useful when you want to give different size for your different panels
      and to position them precisely.

*`parameter` contains the different parameters of the layout. It will depend on the `kind` value

Example:

```json
{
  "layouts": {
    "foo": {
      "kind": "Expand",
      "parameter": {}
    }
  }
}
```

##### Expand

* `open` : a boolean used by the UI to decide if the children should be displayed or not
* `children`: a list of json reference. Each element can be a reference to another layout or to a panel.

Example:

```json
{
  "parameter": {
    "open": true,
    "children": [
      {
        "$ref": "#/spec/layouts/foo"
      },
      {
        "$ref": "#/spec/panels/bar"
      }
    ]
  }
}
```

##### Grid

`children` is a matrix. First array define the different lines. Each line is taking another array that defines then the
column for the current line. You can define the size of the column with the parameter `width`.

To define the content of a cell, you can use `content` that is wrapping a json reference. It's optional, you could want
to define empty cell just by defining the `width`. It can be useful if you would like to put a panel on the right for
example.

```json
{
  "parameter": {
    "children": [
      [
        {
          "width": 2,
          "content": {
            "$ref": "#/spec/panels/myAwesomePanel"
          }
        },
        {
          "width": 1
        }
      ],
      [
        {
          "width": 1
        },
        {
          "width": 1,
          "content": {
            "$ref": "#/spec/layouts/gaugeGrid"
          }
        }
      ]
    ]
  }
}
```

### Example

#### Simple dashboard

```json
  {
  "kind": "Dashboard",
  "metadata": {
    "name": "SimpleLineChart",
    "project": "perses"
  },
  "spec": {
    "datasource": "PrometheusDemo",
    "duration": "6h",
    "panels": {
      "foo": {
        "name": "myGraphPanel",
        "kind": "TimeSeriesChart",
        "chart": {
          "lines": [
            {
              "expr": "up"
            }
          ]
        }
      }
    },
    "layout": {
      "main": {
        "kind": "Expand",
        "parameter": {
          "open": true,
          "children": [
            {
              "$ref": "#/spec/panels/foo"
            }
          ]
        }
      }
    },
    "entrypoint": {
      "$ref": "#/spec/layouts/main"
    }
  }
}
```

## How to feed a dashboard

This part is more dedicated to developer that would like to consume the API in order to feed a dashboard.

The API is providing two different endpoint for that:

* `POST /api/v1/feed/variables` that should be used to get the value of the different variable defined
* `POST /api/v1/feed/panels` that should be used to get the value for a set of panels

### How to get the value of the variables.

#### Dashboard initialization

During the initialization of the dashboard (in GUI side), the frontend should simply send the full definition of the
variables to the backend. It will find the build order, and then calculate the values for each of them.

Example:

```bash
curl -XPOST http://localhost:8080/api/v1/feed/variables -d '
{
    "datasource":"PrometheusDemo",
    "duration": "6h",
    "variables": {
        "do": {
            "kind": "PromQLQuery",
            "parameter": {
                "expr": "prometheus_build_info",
                "label_name": "branch",
                "capturing_regexp": "(.*)"
            }
        },
        "bar": {
            "kind" :"LabelValuesQuery",
            "parameter":{
                "label_name": "$foo",
                "capturing_regexp" : "(.*)"
            }
        },
        "foo": {
            "kind" : "LabelNamesQuery",
            "parameter":{
                "capturing_regexp" : "(alert.*)"
            }
        }
    }
}
'
```

Result:

```json
[
  {
    "name": "foo",
    "selected": "alertmanager",
    "values": [
      "alertmanager",
      "alertname",
      "alertstate"
    ]
  },
  {
    "name": "do",
    "selected": "HEAD",
    "values": [
      "HEAD"
    ]
  },
  {
    "name": "bar",
    "selected": "http://demo.do.prometheus.io:9093/api/v2/alerts",
    "values": [
      "http://demo.do.prometheus.io:9093/api/v2/alerts"
    ]
  }
]
```

#### Changing the value of the variable

Once the dashboard is properly initialized, the user will likely change the value selected for some variable.

As the backend need to know which variable should be recalculated (following the changes of the selected value), the
front-end should:

* re-send all variables definitions to the backend.
* Send the previous selected value for each variable
* Send the current selected value for each variable. Thanks to the previous and the current selected value, the backend
  is able to calculate which variable value changed. Then it compares to the build order to know exactly which variable
  should be recalculated and which one should not.

Example:

```bash
curl -XPOST http://localhost:8080/api/v1/feed/variables -d '
{
    "datasource":"PrometheusDemo",
    "duration": "6h",
    "selected_variables": {
        "foo" :"alertname"
    },
    "previous_selected_variables": {
        "foo" :"alertmanager"
    },
    "variables": {
        "do": {
            "kind": "PromQLQuery",
            "parameter": {
                "expr": "prometheus_build_info",
                "label_name": "branch",
                "capturing_regexp": "(.*)"
            }
        },
        "bar": {
            "kind" :"LabelValuesQuery",
            "parameter":{
                "label_name": "$foo",
                "capturing_regexp" : "(.*)"
            }
        },
        "foo": {
            "kind" : "LabelNamesQuery",
            "parameter":{
                "capturing_regexp" : "(alert.*)"
            }
        }
    }
}
'
```

Result:

```json
[
  {
    "name": "do",
    "selected": "HEAD",
    "values": [
      "HEAD"
    ]
  },
  {
    "name": "bar",
    "selected": "Watchdog",
    "values": [
      "Watchdog"
    ]
  }
]
```

Here the backend detects that it doesn't need to calculate the value of the variable `foo`, but the value for the
variable `do` wasn't provided. So it had to determinate it.

Also since the value of the variable `foo` changed and the variable `bar` depends on it, the backend needed to
recalculate it.

### How to get the values for the panels

To get the data for the panels, the frontend just need to send the list of the panel definition, the duration, the
variables values currently selected and the datasource:

```bash
curl -XPOST http://localhost:8080/api/v1/feed/panels -d '
{
    "datasource":"PrometheusDemo",
    "duration": "6h",
    "variables": {
        "foo": "192.168.2.1"
    },
    "panels": {
        "foo": {
            "name": "myGraphPanel",
            "kind": "TimeSeriesChart",
            "chart": {
                "lines": [
                {
                    "expr": "up"
                }
                ]
           }
        }
    }
}
'
```

Note:

* Panels is a map (exactly like in the dashboard definition). Like that, the frontend won't have to transform the panel
  definitions when requesting the backend to get the data.
* After getting the values of the variables, the frontend need to get the data for the different panels displayed. For
  optimization purpose, the frontend shouldn't ask the data for the panels not displayed.



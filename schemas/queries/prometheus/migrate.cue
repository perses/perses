if #target.datasource.type != _|_ if #target.datasource.type == "prometheus" { // the first condition avoids validation error in the weird case where datasource type is not present
    kind: "PrometheusTimeSeriesQuery"
    spec: {
        datasource: {
            kind: "PrometheusDatasource"
            name: #target.datasource.uid
        }
        query: #target.expr
    }
},

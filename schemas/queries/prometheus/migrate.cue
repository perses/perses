// NB we would need `if` to support short-circuit in order to avoid code duplication here.
//    See https://github.com/cue-lang/cue/issues/2232
if #target.datasource != _|_ if #target.datasource.type != _|_ if #target.datasource.type == "prometheus" && #target.expr != _|_ {
	kind: "PrometheusTimeSeriesQuery"
	spec: {
		datasource: {
			kind: "PrometheusDatasource"
			name: #target.datasource.uid
		}
		query: #target.expr
		if #target.legendFormat != _|_ if #target.legendFormat != "__auto" {
			seriesNameFormat: #target.legendFormat
		}
		if #target.interval != _|_ {
			minStep: #target.interval
		}
	}
},
// The datasource.type may not be present while we are dealing with a prometheus query.
// In such case, rely on the "expr" field, whose presence likely indicates that this is a prometheus query.
// /!\ This is a best-effort conversion logic and may wrongly convert not-prometheus queries to PrometheusTimeSeriesQuery
if #target.expr != _|_ {
	kind: "PrometheusTimeSeriesQuery"
	spec: {
		if #target.datasource != _|_ {
			datasource: {
				kind: "PrometheusDatasource"
				name: #target.datasource.uid
			}
		}
		query: #target.expr
		if #target.legendFormat != _|_ if #target.legendFormat != "__auto" {
			seriesNameFormat: #target.legendFormat
		}
		if #target.interval != _|_ {
			minStep: #target.interval
		}
	}
},

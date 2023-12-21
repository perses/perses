// NB we would need `if` to support short-circuit in order to avoid code duplication here.
//    See https://github.com/cue-lang/cue/issues/2232
if #var.type == "query" if (#var.query & string) != _|_ if #var.query =~ "^label_names\\(\\)$" {
	kind: "PrometheusLabelNamesVariable"
	spec: {
		matchers: []
	}
},
if #var.type == "query" if (#var.query & {}) != _|_ if #var.query.query =~ "^label_names\\(\\)$" {
	kind: "PrometheusLabelNamesVariable"
	spec: {
		matchers: []
	}
},

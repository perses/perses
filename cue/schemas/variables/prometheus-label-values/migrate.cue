// NB we would need `if` to support short-circuit in order to avoid code duplication here.
//    See https://github.com/cue-lang/cue/issues/2232
if #var.type == "query" if (#var.query & string) != _|_ if #var.query =~ "^label_values\\(.*\\)$" {
	kind: "PrometheusLabelValuesVariable"
	spec: {
		#matches:  regexp.FindSubmatch("^label_values\\(((.*),)?\\s*?([a-zA-Z0-9-_]+)\\)$", #var.query)
		labelName: #matches[3]
		matchers: [if #matches[2] != "" {#matches[2]}]
	}
},
if #var.type == "query" if (#var.query & {}) != _|_ if #var.query.query =~ "^label_values\\(.*\\)$" {
	kind: "PrometheusLabelValuesVariable"
	spec: {
		#matches:  regexp.FindSubmatch("^label_values\\(((.*),)?\\s*?([a-zA-Z0-9-_]+)\\)$", #var.query.query)
		labelName: #matches[3]
		matchers: [if #matches[2] != "" {#matches[2]}]
	}
},

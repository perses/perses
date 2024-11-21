if #var.type == "custom" || #var.type == "interval" {
	kind: "StaticListVariable"
	spec: {
		_valuesArray:        strings.Split(#var.query, ",")
		_aliasedValueRegexp: "^(.*) : (.*)$"
		values: [for val in _valuesArray {
			[// switch
				if val =~ _aliasedValueRegexp {
					label: strings.TrimSpace(regexp.FindSubmatch(_aliasedValueRegexp, val)[1])
					value: strings.TrimSpace(regexp.FindSubmatch(_aliasedValueRegexp, val)[2])
				},
				strings.TrimSpace(val),
			][0]
		}]
	}
},

package migrate

#target: _

if (*#target.datasource.type | null) == "mydatasource" {
	kind: "MyQuery"
	spec: {
		query: #target.expr
	}
},
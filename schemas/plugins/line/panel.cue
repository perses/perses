package line

#panel: {
	kind: "LineChart"
	display: {
		name: string
	}
	chart: {
		show_legend?: bool
		lines: [...#line]
	}
}

#line: {
	expr: string
}

#panel

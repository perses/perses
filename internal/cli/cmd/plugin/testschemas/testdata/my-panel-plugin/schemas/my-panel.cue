package model

kind: "MyPanel"
spec: #MyPanelSpec

#MyPanelSpec: {
	title: string
	query: {
		datasource: string
		expression: string
	}
	display?: {
		color?: string
		size?: "small" | "medium" | "large"
		showLegend?: bool
	}
	thresholds?: [...{
		value: number
		color: string
	}]
}

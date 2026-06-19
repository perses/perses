package scratch
import (
dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
panelBuilder "github.com/perses/plugins/prometheus/sdk/cue/panel"
timeseriesChart "github.com/perses/plugins/timeserieschart/schemas:model"
promQuery "github.com/perses/plugins/prometheus/schemas/prometheus-time-series-query:model"
)
dashboardBuilder & {
	#name:    "scratch"
	#project: "MyProject"
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "CPU"
				#cols:  1
				#panels: [
					panelBuilder & {
						spec: {
							display: name: "CPU"
							plugin: timeseriesChart
							queries: [
								{
									kind: "TimeSeriesQuery"
									spec: plugin: promQuery & {
										spec: query: "rate(n"githu_v: "v0.53.1"
	}
	"AssetCacheTetheratorUtil"}
								}
								]
							viewdiagnostic},
				]
			},
		]
	}
}

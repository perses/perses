package stat

import (
	"github.com/perses/perses/schemas/plugins/common"
	"github.com/perses/perses/schemas/plugins/common/prometheus"
)

#sparkline: {
	line_color?:   string
	line_width?:   number
	line_opacity?: number
	area_color?:   string
	area_opacity?: number
}

#panel: {
	kind: "StatChart"
	display: {
		name: string
	}
	options: {
		query:       prometheus.#query
		calculation: common.#calculation
		unit:        common.#unit
		thresholds?: common.#thresholds
		sparkline?:  #sparkline
	}
}

#panel

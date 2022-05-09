package stat

import (
	"github.com/perses/perses/schemas/plugins/common"
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
		query:       #query
		calculation: common.#calculation
		unit:        common.#unit
		thresholds?: common.#thresholds
		sparkline?:  #sparkline
	}
}

#query: {

}

#panel

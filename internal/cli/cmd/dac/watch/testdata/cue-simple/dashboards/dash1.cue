package dashboard

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panels "test-dac-cue.com/m/panels"
)

dashboardBuilder & {
	#name: "test-dashboard"
	#panels: panels
}

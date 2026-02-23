package myproject

import (
	panels "test-dac-cue.com/m/panels"
)

// This file has "dashboard" in filename (my-dashboard.cue)
// so it should be detected as a dashboard
#dashboard: {
	name:   "my-dashboard"
	panels: panels
}

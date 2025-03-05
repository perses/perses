module: "github.com/perses/plugins/barchart@v0"
language: {
	version: "v0.12.0"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/perses/cue@v0": {
		v:       "v0.0.2-test"
		default: true
	}
}

module: "github.com/perses/plugins/tempo@v0"
language: {
	version: "v0.12.0"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/shared/cue@v0": {
		v:       "v0.53.1"
		default: true
	}
}

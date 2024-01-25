package variables

type DatasourceSelector struct {
	Kind string `json:"kind" yaml:"kind"`
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
}

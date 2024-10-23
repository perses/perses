package transform

import "github.com/perses/perses/go-sdk/common"

type Option func(panel *Builder) error

func New(options ...Option) (Builder, error) {
	builder := &Builder{
		Transform: common.Transform{
			Kind: "Transform",
		},
	}

	defaults := []Option{}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	common.Transform `json:",inline" yaml:",inline"`
}

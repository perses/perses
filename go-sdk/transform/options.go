package transform

import "github.com/perses/perses/pkg/model/api/v1/common"

func Plugin(plugin common.Plugin) Option {
	return func(builder *Builder) error {
		builder.Spec.Plugin = plugin
		return nil
	}
}

func IsDisabled(disabled bool) Option {
	return func(builder *Builder) error {
		builder.Spec.Disabled = disabled
		return nil
	}
}

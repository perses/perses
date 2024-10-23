package joinbycolumnvalue

func Column(column string) Option {
	return func(plugin *Builder) error {
		plugin.Column = column
		return nil
	}
}

package mylibrary

import (
	"test-dac.com/m/mylibrary/nested"
)

// GetValue returns a value, importing nested library (transitive dependency)
func GetValue() string {
	return nested.GetNestedValue()
}

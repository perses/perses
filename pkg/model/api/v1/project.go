package v1

import (
	"encoding/json"
	"fmt"
)

type Project struct {
	Metadata Metadata `json:"metadata"`
}

func (p *Project) GenerateID() string {
	return fmt.Sprintf("/projects/%s", p.Metadata.Name)
}

func (p *Project) UnmarshalJSON(data []byte) error {
	var tmp Project
	type plain Project
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Project) validate() error {
	if p.Metadata.Kind != KindProject {
		return fmt.Errorf("invalid kind: '%s' for a Project type", p.Metadata.Kind)
	}
	return nil
}

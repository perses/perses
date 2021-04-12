package v1

import (
	"encoding/json"
	"fmt"
)

func GeneratePrometheusRuleID(project string, name string) string {
	return generateProjectResourceID("prometheusrules", project, name)
}

type Rule struct {
	Record      string            `json:"record,omitempty" yaml:"record,omitempty"`
	Alert       string            `json:"alert,omitempty" yaml:"alert,omitempty"`
	Expr        string            `json:"expr" yaml:"expr"`
	For         string            `json:"for,omitempty" yaml:"for,omitempty"`
	Labels      map[string]string `json:"labels,omitempty" yaml:"labels;,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty" yaml:"annotations,omitempty"`
}

func (r *Rule) UnmarshallJSON(data []byte) error {
	var tmp Rule
	type plain Rule
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *Rule) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Rule
	type plain Rule
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *Rule) validate() error {
	if len(r.Record) > 0 && len(r.Alert) > 0 {
		return fmt.Errorf("only one of 'record' or 'alert' must be set")
	}
	if len(r.Record) == 0 && len(r.Alert) == 0 {
		return fmt.Errorf("'record' or 'alert' must be set")
	}
	if len(r.Expr) == 0 {
		return fmt.Errorf("field 'expr' must be set")
	}
	if len(r.Record) > 0 {
		if len(r.Annotations) > 0 {
			return fmt.Errorf("invalid field 'annotations' in recording rule")
		}
		if len(r.For) > 0 {
			return fmt.Errorf("invalid field 'for' in recording rule")
		}
	}
	return nil
}

type RuleGroup struct {
	Name     string `json:"name" yaml:"name"`
	Interval string `json:"interval,omitempty" yaml:"interval,omitempty"`
	Rules    []Rule `json:"rules" yaml:"rules"`
}

func (p *RuleGroup) UnmarshalJSON(data []byte) error {
	var tmp RuleGroup
	type plain RuleGroup
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *RuleGroup) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp RuleGroup
	type plain RuleGroup
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *RuleGroup) validate() error {
	if len(p.Rules) == 0 {
		return fmt.Errorf("at least one rule should be defined")
	}
	return nil
}

type PrometheusRuleSpec struct {
	Groups []RuleGroup `json:"groups" yaml:"groups"`
}

func (p *PrometheusRuleSpec) UnmarshalJSON(data []byte) error {
	var tmp PrometheusRuleSpec
	type plain PrometheusRuleSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PrometheusRuleSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PrometheusRuleSpec
	type plain PrometheusRuleSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PrometheusRuleSpec) validate() error {
	if len(p.Groups) == 0 {
		return fmt.Errorf("at least one group should be defined")
	}
	return nil
}

type PrometheusRule struct {
	Kind     Kind               `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata    `json:"metadata" yaml:"metadata"`
	Spec     PrometheusRuleSpec `json:"spec" yaml:"spec"`
}

func (p *PrometheusRule) GenerateID() string {
	return GeneratePrometheusRuleID(p.Metadata.Project, p.Metadata.Name)
}

func (p *PrometheusRule) GetMetadata() interface{} {
	return &p.Metadata
}

func (p *PrometheusRule) UnmarshalJSON(data []byte) error {
	var tmp PrometheusRule
	type plain PrometheusRule
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PrometheusRule) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PrometheusRule
	type plain PrometheusRule
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PrometheusRule) validate() error {
	if p.Kind != KindPrometheusRule {
		return fmt.Errorf("invalid kind: '%s' for a PrometheusRule type", p.Kind)
	}
	return nil
}

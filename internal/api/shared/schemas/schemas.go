// Copyright 2022 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package schemas

import (
	_ "embed"
	"fmt"
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"github.com/perses/perses/internal/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

//go:embed base_def_query.cue
var baseQueryDef []byte

//go:embed query_disjunction_generator.cue
var queryDisjunctionGenerator []byte

// retrieveSchemaForKind returns the schema corresponding to the provided kind
func retrieveSchemaForKind(panelName string, panelVal cue.Value, kindPath string, schemasMap *sync.Map) (cue.Value, error) {
	// retrieve the value of the Kind field
	kind, err := panelVal.LookupPath(cue.ParsePath(kindPath)).String()
	if err != nil {
		err = fmt.Errorf("invalid panel %s: %s", panelName, err) // enrich the error message returned by cue lib
		logrus.Debug(err)
		return cue.Value{}, err
	}

	// retrieve the corresponding schema
	schema, ok := schemasMap.Load(kind)
	if !ok {
		err := fmt.Errorf("invalid panel %s: Unknown %s %s", panelName, kindPath, kind)
		logrus.Debug(err)
		return cue.Value{}, err
	}

	return schema.(cue.Value), nil
}

type Schemas interface {
	ValidatePanels(panels map[string]*modelV1.Panel) error
	GetLoaders() []Loader
}

func New(conf config.Schemas) Schemas {
	ctx := cuecontext.New()

	// compile the base definitions
	baseQueryDefVal := ctx.CompileBytes(baseQueryDef)

	return &sch{
		context: ctx,
		panels: &cueDefs{
			context:     ctx,
			schemas:     &sync.Map{},
			schemasPath: conf.PanelsPath,
			kindCuePath: "kind",
		},
		queries: &cueDefsWithDisjunction{
			cueDefs: cueDefs{
				context:     ctx,
				baseDef:     &baseQueryDefVal,
				schemas:     &sync.Map{},
				schemasPath: conf.QueriesPath,
				kindCuePath: "spec.plugin.kind",
			},
			disjSchema: cue.Value{},
			mapID:      "#query_types",
		},
	}
}

type sch struct {
	context *cue.Context
	panels  *cueDefs
	queries *cueDefsWithDisjunction
}

func (s *sch) GetLoaders() []Loader {
	return []Loader{s.panels, s.queries}
}

// ValidatePanels verify a list of panels.
// The panels are matched against the known list of CUE definitions (schemas).
// If no schema matches for at least 1 panel, the validation fails.
func (s *sch) ValidatePanels(panels map[string]*modelV1.Panel) error {
	// go through the panels list
	// the processing stops as soon as it detects an invalid panel -> TODO: improve this to return a list of all the errors encountered ?
	for panelName, panel := range panels {
		logrus.Tracef("Panel to validate: %s", panelName)
		panelPluginByte, err := panel.Spec.Plugin.JSONMarshal()
		if err != nil {
			logrus.WithError(err).Debugf("unable to marshal the panel plugin %q", panel.Spec.Plugin.Kind)
			return err
		}
		// compile the JSON panel plugin into a CUE Value
		value := s.context.CompileBytes(panelPluginByte)

		// retrieve the corresponding panel schema
		panelSchema, err := retrieveSchemaForKind(panelName, value, s.panels.kindCuePath, s.panels.schemas)
		if err != nil {
			return err
		}

		// Then merge with the queries disjunction schema
		panelSchema = panelSchema.Unify(s.queries.disjSchema)
		if panelSchema.Err() != nil {
			logrus.WithError(panelSchema.Err()).Error("Error unifying panel schema with queries schema")
			return panelSchema.Err()
		}

		// do the validation using the main #panel def of the schema as entrypoint
		unified := value.Unify(panelSchema.LookupPath(cue.ParsePath("")))
		opts := []cue.Option{
			cue.Concrete(true),
			cue.Attributes(true),
			cue.Definitions(true),
			cue.Hidden(true),
		}
		err = unified.Validate(opts...)
		if err != nil {
			logrus.Debug(errors.Details(err, nil))
			//TODO: return errors.Details(err, nil) to get a more meaningful error, but should be cleaned of line numbers & server file paths!
			err = fmt.Errorf("invalid panel %s: %s", panelName, err) // enrich the error message returned by cue lib
			return err
		}
	}
	logrus.Debug("All panels are valid")
	return nil
}

// Copyright The Perses Authors
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

package provisioning

import (
	"bytes"
	"encoding/json"
	"fmt"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/dependency"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/resource"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type insertFunc func() (modelAPI.Entity, error)
type getEntityFunc func() (modelAPI.Entity, error)

// specChanged returns true if the incoming entity's content differs from the existing one.
// It compares JSON representations after stripping transient metadata fields (version,
// updatedAt, createdAt) so that a no-op provisioning reload does NOT trigger an update.
func specChanged(incoming, existing modelAPI.Entity) bool {
	inJSON, err := json.Marshal(incoming)
	if err != nil {
		return true
	}
	exJSON, err := json.Marshal(existing)
	if err != nil {
		return true
	}

	var inMap, exMap map[string]interface{}
	if err := json.Unmarshal(inJSON, &inMap); err != nil {
		return true
	}
	if err := json.Unmarshal(exJSON, &exMap); err != nil {
		return true
	}

	stripTransientMetadata(inMap)
	stripTransientMetadata(exMap)

	inNorm, _ := json.Marshal(inMap)
	exNorm, _ := json.Marshal(exMap)
	return !bytes.Equal(inNorm, exNorm)
}

// stripTransientMetadata removes metadata fields that are managed by the server and
// should not be considered when comparing whether an entity's content has changed.
func stripTransientMetadata(m map[string]interface{}) {
	meta, ok := m["metadata"].(map[string]interface{})
	if !ok {
		return
	}
	delete(meta, "version")
	delete(meta, "updatedAt")
	delete(meta, "createdAt")
}

// provisioningServiceInterface is the minimal interface used by both the task and the watcher.
type provisioningServiceInterface interface {
	reloadAllEntities(folders []string)
}

type provisioningService struct {
	serviceManager dependency.ServiceManager
	caseSensitive  bool
}

// reload reads all entities from the given folders and applies them.
func (p *provisioningService) reloadAllEntities(folders []string) {
	var entities []modelAPI.Entity
	for _, dir := range folders {
		objects, errors := file.UnmarshalEntitiesFromDirectory(dir)
		for _, err := range errors {
			logrus.WithError(err).Warningf("unable to load entity from folder %q", dir)
		}
		entities = append(entities, objects...)
	}
	p.applyEntity(entities)
}

func (p *provisioningService) applyEntity(entities []modelAPI.Entity) {
	for _, entity := range entities {
		entity.GetMetadata().Flatten(p.caseSensitive)
		kind := modelV1.Kind(entity.GetKind())
		name := entity.GetMetadata().GetName()
		project := resource.GetProject(entity.GetMetadata(), "")
		param := apiInterface.Parameters{
			Name:    name,
			Project: project,
		}
		createFun, updateFunc, getFunc, svcErr := p.getService(entity, param)
		if svcErr != nil {
			logrus.WithError(svcErr).Warningf("unable to retrieve the service associated to %q", kind)
			continue
		}

		// the document doesn't exist, so we have to create it.
		_, createErr := createFun()

		if createErr == nil {
			continue
		}

		if !databaseModel.IsKeyConflict(createErr) {
			logrus.WithError(createErr).Errorf("unable to create the %q %q", kind, name)
			continue
		}

		// The entity already exists. Only update it if the content has actually changed
		// to avoid triggering unnecessary SSE events and frontend refreshes.
		existing, getErr := getFunc()
		if getErr == nil && !specChanged(entity, existing) {
			logrus.Debugf("provisioning: %s %q is unchanged, skipping update", kind, name)
			continue
		}

		if _, updateError := updateFunc(); updateError != nil {
			logrus.WithError(updateError).Errorf("unable to update the %q %q", kind, name)
		}
	}
}

func (p *provisioningService) getService(object modelAPI.Entity, parameters apiInterface.Parameters) (createFunc insertFunc, updateFunc insertFunc, getFunc getEntityFunc, err error) {
	switch entity := object.(type) {
	case *modelV1.Dashboard:
		svc := p.serviceManager.GetDashboard()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.Datasource:
		svc := p.serviceManager.GetDatasource()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.Folder:
		svc := p.serviceManager.GetFolder()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.GlobalDatasource:
		svc := p.serviceManager.GetGlobalDatasource()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.GlobalRole:
		svc := p.serviceManager.GetGlobalRole()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.GlobalRoleBinding:
		svc := p.serviceManager.GetGlobalRoleBinding()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.GlobalSecret:
		svc := p.serviceManager.GetGlobalSecret()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.GlobalVariable:
		svc := p.serviceManager.GetGlobalVariable()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.Project:
		svc := p.serviceManager.GetProject()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.Role:
		svc := p.serviceManager.GetRole()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.RoleBinding:
		svc := p.serviceManager.GetRoleBinding()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.Secret:
		svc := p.serviceManager.GetSecret()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.User:
		svc := p.serviceManager.GetUser()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	case *modelV1.Variable:
		svc := p.serviceManager.GetVariable()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			},
			func() (modelAPI.Entity, error) {
				return svc.Get(parameters)
			}, nil
	// We don't support the provisioning of the following resources: EphemeralDashboard
	default:
		return nil, nil, nil, fmt.Errorf("resource %q not supported by the provisioning service", entity.GetKind())
	}
}

// Copyright 2023 The Perses Authors
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
	"context"
	"fmt"

	"github.com/perses/common/async"
	databaseModel "github.com/perses/perses/api/database/model"
	"github.com/perses/perses/api/dependency"
	apiInterface "github.com/perses/perses/api/interface"
	"github.com/perses/perses/cli/file"
	"github.com/perses/perses/cli/resource"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type insertFunc func() (modelAPI.Entity, error)

func New(serviceManager dependency.ServiceManager, folders []string, caseSensitive bool) async.SimpleTask {
	return &provisioning{
		serviceManager: serviceManager,
		folders:        folders,
		caseSensitive:  caseSensitive,
	}
}

type provisioning struct {
	async.SimpleTask
	serviceManager dependency.ServiceManager
	folders        []string
	caseSensitive  bool
}

func (p *provisioning) Execute(_ context.Context, _ context.CancelFunc) error {
	if len(p.folders) == 0 {
		return nil
	}
	var entities []modelAPI.Entity
	for _, dir := range p.folders {
		objects, errors := file.UnmarshalEntitiesFromDirectory(dir)
		for _, err := range errors {
			logrus.WithError(err).Warningf("unable to load every entity from the folder %q", dir)
		}

		if len(objects) > 0 {
			entities = append(entities, objects...)
		}

	}
	p.applyEntity(entities)
	return nil
}

func (p *provisioning) String() string {
	return "provisioning service"
}

func (p *provisioning) applyEntity(entities []modelAPI.Entity) {
	for _, entity := range entities {
		entity.GetMetadata().Flatten(p.caseSensitive)
		kind := modelV1.Kind(entity.GetKind())
		name := entity.GetMetadata().GetName()
		project := resource.GetProject(entity.GetMetadata(), "")
		param := apiInterface.Parameters{
			Name:    name,
			Project: project,
		}
		createFun, updateFunc, svcErr := p.getService(entity, param)
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

		if _, updateError := updateFunc(); updateError != nil {
			logrus.WithError(updateError).Errorf("unable to update the %q %q", kind, name)
		}
	}
}

func (p *provisioning) getService(object modelAPI.Entity, parameters apiInterface.Parameters) (createFunc insertFunc, updateFunc insertFunc, err error) {
	switch entity := object.(type) {
	case *modelV1.Dashboard:
		svc := p.serviceManager.GetDashboard()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.Datasource:
		svc := p.serviceManager.GetDatasource()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.Folder:
		svc := p.serviceManager.GetFolder()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.GlobalDatasource:
		svc := p.serviceManager.GetGlobalDatasource()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.GlobalRole:
		svc := p.serviceManager.GetGlobalRole()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.GlobalRoleBinding:
		svc := p.serviceManager.GetGlobalRoleBinding()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.GlobalSecret:
		svc := p.serviceManager.GetGlobalSecret()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.GlobalVariable:
		svc := p.serviceManager.GetGlobalVariable()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.Project:
		svc := p.serviceManager.GetProject()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.Role:
		svc := p.serviceManager.GetRole()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.RoleBinding:
		svc := p.serviceManager.GetRoleBinding()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.Secret:
		svc := p.serviceManager.GetSecret()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.User:
		svc := p.serviceManager.GetUser()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	case *modelV1.Variable:
		svc := p.serviceManager.GetVariable()
		return func() (modelAPI.Entity, error) {
				return svc.Create(apiInterface.EmptyCtx, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(apiInterface.EmptyCtx, entity, parameters)
			}, nil
	// We don't support the provisioning of the following resources: EphemeralDashboard
	default:
		return nil, nil, fmt.Errorf("resource %q not supported by the provisioning service", entity.GetKind())
	}
}

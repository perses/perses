// Copyright 2024 The Perses Authors
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

package sdk

import (
	modelAPI "github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/secret"
)

func NewSecret(name string) *SecretBuilder {
	return &SecretBuilder{
		v1.Secret{
			Kind: v1.KindSecret,
			Metadata: v1.ProjectMetadata{
				Metadata: v1.Metadata{
					Name: name,
				},
				Project: "",
			},
			Spec: v1.SecretSpec{
				BasicAuth:     nil,
				Authorization: nil,
				TLSConfig:     nil,
			},
		},
	}
}

type SecretBuilder struct {
	v1.Secret
}

func (b *SecretBuilder) Build() v1.Secret {
	return b.Secret
}

func (b *SecretBuilder) GetEntity() modelAPI.Entity {
	return &b.Secret
}

func (b *SecretBuilder) WithName(name string) *SecretBuilder {
	b.Secret.Metadata.Name = name
	return b
}

func (b *SecretBuilder) WithProject(project v1.Project) *SecretBuilder {
	b.Secret.Metadata.Project = project.Metadata.Name
	return b
}

func (b *SecretBuilder) WithProjectName(projectName string) *SecretBuilder {
	b.Secret.Metadata.Project = projectName
	return b
}

func (b *SecretBuilder) WithVersion(version uint64) *SecretBuilder {
	b.Secret.Metadata.Version = version
	return b
}

func (b *SecretBuilder) WithBasicAuth(basicAuth secret.BasicAuth) *SecretBuilder {
	b.Secret.Spec.Authorization = nil
	b.Secret.Spec.BasicAuth = &basicAuth
	return b
}

func (b *SecretBuilder) AddBasicAuth(username string, password string) *SecretBuilder {
	b.Secret.Spec.Authorization = nil
	b.Secret.Spec.BasicAuth = &secret.BasicAuth{
		Username: username,
		Password: password,
	}
	return b
}

func (b *SecretBuilder) AddBasicAuthWithFile(username string, passwordFile string) *SecretBuilder {
	b.Secret.Spec.Authorization = nil
	b.Secret.Spec.BasicAuth = &secret.BasicAuth{
		Username:     username,
		PasswordFile: passwordFile,
	}
	return b
}

func (b *SecretBuilder) WithAuthorization(authorization secret.Authorization) *SecretBuilder {
	b.Secret.Spec.BasicAuth = nil
	b.Secret.Spec.Authorization = &authorization
	return b
}

func (b *SecretBuilder) AddAuthorization(credentials string) *SecretBuilder {
	b.Secret.Spec.BasicAuth = nil
	b.Secret.Spec.Authorization = &secret.Authorization{
		Type:        "Bearer",
		Credentials: credentials,
	}
	return b
}

func (b *SecretBuilder) AddAuthorizationWithFile(credentialsFile string) *SecretBuilder {
	b.Secret.Spec.BasicAuth = nil
	b.Secret.Spec.Authorization = &secret.Authorization{
		Type:            "Bearer",
		CredentialsFile: credentialsFile,
	}
	return b
}

func (b *SecretBuilder) AddAuthorizationWithType(credentials string, authType string) *SecretBuilder {
	b.Secret.Spec.BasicAuth = nil
	b.Secret.Spec.Authorization = &secret.Authorization{
		Type:        authType,
		Credentials: credentials,
	}
	return b
}

func (b *SecretBuilder) AddAuthorizationWithFileAndType(credentialsFile string, authType string) *SecretBuilder {
	b.Secret.Spec.BasicAuth = nil
	b.Secret.Spec.Authorization = &secret.Authorization{
		Type:            authType,
		CredentialsFile: credentialsFile,
	}
	return b
}

func (b *SecretBuilder) WithTLSConfig(tlsConfig secret.TLSConfig) *SecretBuilder {
	b.Secret.Spec.TLSConfig = &tlsConfig
	return b
}

func (b *SecretBuilder) AddTLSConfig(ca string, cert string, key string, serverName string) *SecretBuilder {
	b.Secret.Spec.TLSConfig = &secret.TLSConfig{
		CA:         ca,
		Cert:       cert,
		Key:        key,
		ServerName: serverName,
	}
	return b
}

func (b *SecretBuilder) EnableInsecureSkipVerify() *SecretBuilder {
	if b.Secret.Spec.TLSConfig == nil {
		b.Secret.Spec.TLSConfig = &secret.TLSConfig{
			InsecureSkipVerify: true,
		}
	}
	b.Secret.Spec.TLSConfig.InsecureSkipVerify = true
	return b
}

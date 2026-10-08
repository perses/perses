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

package secret

import (
	"encoding/json"
	"fmt"
	"os"
)

type PublicSigV4 struct {
	Region        string `json:"region" yaml:"region"`
	AccessKey     string `json:"accessKey,omitempty" yaml:"accessKey,omitempty"`
	SecretKey     Hidden `json:"secretKey,omitempty" yaml:"secretKey,omitempty"`
	SecretKeyFile string `json:"secretKeyFile,omitempty" yaml:"secretKeyFile,omitempty"`
	RoleARN       string `json:"roleArn,omitempty" yaml:"roleArn,omitempty"`
	ExternalID    string `json:"externalId,omitempty" yaml:"externalId,omitempty"`
	ServiceName   string `json:"serviceName" yaml:"serviceName"`
}

func NewPublicSigV4(s *SigV4) *PublicSigV4 {
	if s == nil {
		return nil
	}
	return &PublicSigV4{
		Region:        s.Region,
		AccessKey:     s.AccessKey,
		SecretKey:     Hidden(s.SecretKey),
		SecretKeyFile: s.SecretKeyFile,
		RoleARN:       s.RoleARN,
		ExternalID:    s.ExternalID,
		ServiceName:   s.ServiceName,
	}
}

// SigV4 signs the requests with the AWS Signature Version 4, to query an AWS service.
// When no access key is set, the credentials come from the default credential chain of the Perses server
// (environment, web identity, ECS or EC2 instance metadata), which must be explicitly allowed by the server configuration.
type SigV4 struct {
	// Region is the AWS region of the service, for example us-east-1.
	Region string `json:"region" yaml:"region"`
	// AccessKey is the AWS access key ID. It must be set together with SecretKey or SecretKeyFile.
	AccessKey string `json:"accessKey,omitempty" yaml:"accessKey,omitempty"`
	// SecretKey is the AWS secret access key.
	SecretKey string `json:"secretKey,omitempty" yaml:"secretKey,omitempty"`
	// SecretKeyFile is the path to a file containing the AWS secret access key.
	SecretKeyFile string `json:"secretKeyFile,omitempty" yaml:"secretKeyFile,omitempty"`
	// RoleARN is the ARN of an IAM role to assume before signing the requests.
	RoleARN string `json:"roleArn,omitempty" yaml:"roleArn,omitempty"`
	// ExternalID is the external ID used to assume the role. It can only be set with RoleARN.
	ExternalID string `json:"externalId,omitempty" yaml:"externalId,omitempty"`
	// ServiceName is the name of the AWS service the requests are signed for, for example "monitoring" for CloudWatch.
	ServiceName string `json:"serviceName" yaml:"serviceName"`
}

func (s *SigV4) UnmarshalJSON(data []byte) error {
	var tmp SigV4
	type plain SigV4
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *SigV4) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp SigV4
	type plain SigV4
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

// UsesStaticCredentials tells whether the requests are signed with the access key of the secret.
// Otherwise, the default credential chain of the Perses server is used (including to assume the role).
func (s *SigV4) UsesStaticCredentials() bool {
	return len(s.AccessKey) > 0
}

// GetSecretKey returns the secret access key, read from SecretKeyFile when it is set.
func (s *SigV4) GetSecretKey() (string, error) {
	if len(s.SecretKeyFile) > 0 {
		secretKey, err := os.ReadFile(s.SecretKeyFile)
		if err != nil {
			return "", fmt.Errorf("failed to read sigv4 secretKeyFile: %w", err)
		}
		return string(secretKey), nil
	}
	return s.SecretKey, nil
}

func (s *SigV4) validate() error {
	if len(s.Region) == 0 {
		return fmt.Errorf("when using sigv4, region cannot be empty")
	}
	if len(s.ServiceName) == 0 {
		return fmt.Errorf("when using sigv4, serviceName cannot be empty")
	}
	if len(s.SecretKey) > 0 && len(s.SecretKeyFile) > 0 {
		return fmt.Errorf("at most one of sigv4 secretKey & secretKeyFile must be configured")
	}
	hasSecretKey := len(s.SecretKey) > 0 || len(s.SecretKeyFile) > 0
	if s.UsesStaticCredentials() != hasSecretKey {
		return fmt.Errorf("sigv4 accessKey and secretKey/secretKeyFile must be configured together")
	}
	if len(s.ExternalID) > 0 && len(s.RoleARN) == 0 {
		return fmt.Errorf("sigv4 externalId can only be used with roleArn")
	}
	return nil
}

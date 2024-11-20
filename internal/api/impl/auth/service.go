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

package auth

import (
	"errors"
	"fmt"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/user"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

// useNewIfPresent decides if we take the old or new string.
// Return a boolean saying if the result is different from old value.
func useNewIfPresent(old, new string) (string, bool) {
	if len(new) > 0 {
		return new, old != new
	}
	return old, false
}

// saveProfileInfo build a user spec merging the old spec with a given user profile
// Return a boolean saying if the result is different from old value.
func saveProfileInfo(old v1.UserSpec, uInfoProfile externalUserInfoProfile) (v1.UserSpec, bool) {
	firstChanged := false
	lastChanged := false
	old.FirstName, firstChanged = useNewIfPresent(old.FirstName, uInfoProfile.GivenName)
	old.LastName, lastChanged = useNewIfPresent(old.LastName, uInfoProfile.FamilyName)
	return old, firstChanged || lastChanged
}

// saveProviderInfo takes provider context of external user info and control that there is not already a different
// provider registered for that user.
// Return a boolean saying if the result is different from old value.
// If it is a case then an error is returned.
// NB: Currently done like this for sake of simplicity. This is the most straightforward way to ensure that we can't
// impersonate another user.
func saveProviderInfo(old v1.UserSpec, uInfoProvider v1.OAuthProvider) (v1.UserSpec, bool, error) {
	if len(old.NativeProvider.Password) > 0 {
		return old, false, errors.New("this user is already registered with the native provider")
	}
	foundPerfectMatch := false
	for _, provider := range old.OauthProviders {
		if provider != uInfoProvider {
			return old, false, fmt.Errorf("this user is already registered with a different oauth provider context (%s)", provider.Issuer)
		}
		foundPerfectMatch = true
	}
	if !foundPerfectMatch {
		// No Native provider, no different oauth provider, no matching oauth provider,
		// it probably means that oauth providers is empty and the old spec is actually a new user that we want to create
		old.OauthProviders = append(old.OauthProviders, uInfoProvider)
	}
	return old, !foundPerfectMatch, nil
}

func newSpecIfChanged(old v1.UserSpec, uInfo externalUserInfo) (v1.UserSpec, bool, error) {
	specWithProfile, profileChanged := saveProfileInfo(old, uInfo.GetProfile())
	newSpec, providerChanged, err := saveProviderInfo(specWithProfile, uInfo.GetProviderContext())
	return newSpec, profileChanged || providerChanged, err
}

type service struct {
	dao user.DAO
}

func (s *service) getOrPrepareUserEntity(login string) (*v1.User, bool, error) {
	result, err := s.dao.Get(login)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			result = &v1.User{Kind: v1.KindUser, Metadata: v1.Metadata{Name: login}}
			return result, true, nil
		}
		return nil, false, err
	}
	return result, false, nil
}

func (s *service) syncUser(uInfo externalUserInfo) (*v1.User, error) {
	login := uInfo.GetLogin()
	if len(login) == 0 {
		return nil, errors.New("the user login cannot be empty")
	}
	entity, isNew, err := s.getOrPrepareUserEntity(uInfo.GetLogin())
	if err != nil {
		return nil, err
	}

	var specHasChanged bool
	entity.Spec, specHasChanged, err = newSpecIfChanged(entity.Spec, uInfo)
	if err != nil {
		return nil, err
	}

	if isNew {
		entity.Metadata.CreateNow()
		err = s.dao.Create(entity)
		if err != nil {
			return nil, err
		}
	} else if specHasChanged {
		entity.Metadata.Update(entity.Metadata)
		err = s.dao.Update(entity)
		if err != nil {
			return nil, err
		}
	}
	return entity, nil

}

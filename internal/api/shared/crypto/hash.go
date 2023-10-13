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

package crypto

import (
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

func HashAndSalt(pwd []byte) ([]byte, error) {
	return bcrypt.GenerateFromPassword(pwd, bcrypt.DefaultCost)
}

func ComparePasswords(hashedPwd string, plainPwd string) bool {
	hash := []byte(hashedPwd)
	plainPwdByte := []byte(plainPwd)
	err := bcrypt.CompareHashAndPassword(hash, plainPwdByte)
	if err != nil {
		logrus.WithError(err).Warning("password do not match")
		return false
	}
	return true
}

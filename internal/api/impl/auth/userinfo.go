package auth

import "github.com/zitadel/oidc/v3/pkg/oidc"

// UserInfoProfile is a simplified version of the oidc.UserInfoProfile structure.
// It's been created as we want only a limited amount of user information in Perses and some data like locale can be
// provided wrongly by some OIDC providers.
type UserInfoProfile struct {
	Name              string `json:"name,omitempty"`
	GivenName         string `json:"given_name,omitempty"`
	FamilyName        string `json:"family_name,omitempty"`
	MiddleName        string `json:"middle_name,omitempty"`
	Nickname          string `json:"nickname,omitempty"`
	Profile           string `json:"profile,omitempty"`
	Picture           string `json:"picture,omitempty"`
	PreferredUsername string `json:"preferred_username,omitempty"`
}

// UserInfo is a simplified version of the oidc.UserInfo structure.
// It's been created as we want only a limited amount of user information in Perses and some data like locale can be
// provided wrongly by some OIDC providers.
// It is also an opportunity to use the same structure to parse OIDC and OAuth provider's user information.
type UserInfo struct {
	Subject string `json:"sub,omitempty"`
	UserInfoProfile
	oidc.UserInfoEmail

	Claims map[string]any `json:"-"`
}

// GetSubject implements [rp.SubjectGetter]
func (u *UserInfo) GetSubject() string {
	return u.Subject
}

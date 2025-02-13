// Code generated by cue get go. DO NOT EDIT.

//cue:generate cue get go github.com/perses/perses/pkg/model/api/v1

package v1

import "github.com/perses/perses/cuelang/model/api/v1/secret"

#PublicNativeProvider: {
	password?: secret.#Hidden @go(Password)
}

#PublicUserSpec: {
	firstName?:      string                @go(FirstName)
	lastName?:       string                @go(LastName)
	nativeProvider?: #PublicNativeProvider @go(NativeProvider)
	oauthProviders?: [...#OAuthProvider] @go(OauthProviders,[]OAuthProvider)
}

#PublicUser: {
	kind:     #Kind           @go(Kind)
	metadata: #Metadata       @go(Metadata)
	spec:     #PublicUserSpec @go(Spec)
}

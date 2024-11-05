# OAuth helper

As we agree that the configuration of an external OAuth/OIDC provider can be a pain, this page is dedicated to
help you configure the most common providers.

### Supported OAuth flows

We support three types of authentication flows.
See [authentication.md](../design-docs/authentication.md) for more information.

#### Authorization Code Flow [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3.1)

When the user login with their own personal credentials in the external provider's website through the Perses UI.

#### Device Code Flow [RFC 8628](https://datatracker.ietf.org/doc/html/rfc8628)

When the user login with their own personal credentials in the external provider's website but this time from the Perses
command line (`percli`). User will be invited to go to the provider's website to enter a device code, and then login.

#### Client Credentials Flow [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3.4)

Here we log in as an application, not a user. This is useful for scripted tasks not necessarily requiring a user to be logged in.

### List of providers

For each of the providers, the main pre-requisite is always to create an app in the provider's console and to get the
client ID and client secret, but we realised that each of them had their own little oddities that we'll try to list up
there.

> Disclaimer: We try to keep this page up-to-date, but the provider's documentation is always the most reliable source
> of information.

#### Azure AD

```yaml
authentication:
  providers:
    oidc:
      - slug_id: azure
        name: "Azure AD"
        client_id: "<your client ID>"
        client_secret: "<your client Secret>"
        issuer: "https://login.microsoftonline.com/<your tenant ID>/v2.0"
        scopes: ["openid", "profile", "email", "User.read"] # For Auth code / Device code
        client_credentials:
          scopes: ["https://graph.microsoft.com/.default"] # For Client Credentials
```

!!! tip
    The **scope** used to generate a token from client credentials is different from the one used in other flows.

    *Ref: [https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)*

#### <Place Your Provider here ...\>

... (don't hesitate to propose new providers to add!)

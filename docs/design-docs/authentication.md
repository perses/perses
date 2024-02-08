# Authentication

Perses has various authentication flows configurable. You can choose to authenticate from a
[native provider](./authentication.md#native-provider) that will allow you to create some users,
or else rely on an external [identity provider](./authentication.md#external-oidcoauth-providers).

In both cases
- each new user will be saved in the Perses database. 
- at login time, a Perses session (access_token/refresh_token) will be created

Please note that the number of identity providers is not limited.
```yaml
authentication:
  providers:
    # Enable or not the native Perses identity provider
    enable_native: true/false
    # Register one or several OIDC provider(s)
    oidc: []
    # Register one or several OAuth provider(s)
    oauth: []
```
## Native provider

In case a native provider is used, the users and their password are stored in the Perses database.

Login is done through http POST on /api/auth/providers/native/login.

## External OIDC/OAuth provider(s)

It is possible to configure Perses to sign in user with an external identity provider supporting OIDC/Oauth.
For both of these provider's types, the flow is quite similar:

When a user sign in with an external provider (e.g. Github) the Perses backend will then use the information
collected (email, firstname, lastname, picture) to **sync the user in database**.
Then the backend takes in charge the creation of the access_token/refresh_token that will be used to
authenticate this user in the subsequent requests.

> The **user synchronization** can possibly be used to update also its [permissions](./authorization.md), based on
> some roles/groups present in the external idp's token.
>
> At the time we write this documentation, there is nothing implemented yet. User have to login first and ask specific
> permissions to an admin.

### => Configuration example
```yaml
  authentication:
    providers:
      oidc:
      # Example with an Azure AD OIDC configuration
      - slug_id: azure
        name: "Azure AD"
        client_id: "<secret>"
        client_secret: "<secret>"
        issuer: "https://login.microsoftonline.com/<tenant-id>/v2.0"
        redirect_uri: "http://localhost:3000/api/auth/providers/oidc-azure/callback"
        scopes: ["openid", "profile", "email", "User.read"]
      oauth:
      - slug_id: github
        name: "Github"
        client_id: "<secret>"
        client_secret: "<secret>"
        auth_url: "https://github.com/login/oauth/authorize"
        token_url: "https://github.com/login/oauth/access_token"
        logout_url: "https://github.com/login/oauth/logout"
        redirect_uri: "http://localhost:3000/api/auth/providers/oauth-github/callback"
        user_infos_url: "https://api.github.com/user"
```

### => Login from external OIDC or OAuth2.0 provider through Web UI.
```mermaid    
sequenceDiagram
    actor hu as John
    #actor ro as Robot
    participant br as Perses Frontend
    participant rp as Perses Backend
    participant op as External Identity Provider
    
    hu->>br: Login with OIDC provider (e.g Azure AD)
    activate br
    br->>rp: GET /api/auth/providers/{oidc|oauth}/{slug_id}/login
    activate rp
    rp->>br: 302: redirect to Provider
    deactivate rp
    br->>op: /oauth/authorize
    activate op
    op->>br: 302: redirect to Perses
    deactivate op
    br->>rp: GET /api/auth/providers/{oidc|oauth}/{slug_id}/callback?code=...
    activate rp
    alt OIDC
        rp->>op: GET /oauth/token
        activate op
        op->>rp: 200: id_token & access_token
        deactivate op
        rp->>op: GET /api/userinfo<br/> (endpoint from .well-known URL)
        activate op
        op->>rp: 200: User Info
        deactivate op
        Note right of rp: User Info + id token are<br/> used to sync user in database
        rp->>rp: Create or Update user in DB
    else OAUTH 2.0
        rp->>op: GET /oauth/token
        activate op
        op->>rp: 200: access_token
        deactivate op
        rp->>op: GET /api/userinfo<br/> (endpoint from Perses Config)
        activate op
        op->>rp: 200: User Info
        deactivate op
        Note right of rp: Only User Info is<br/> used to sync user in database
        rp->>rp: Create or Update user in DB
    end
    Note right of rp: A new session is created<br /> with a new signed access_token+refresh_token
    rp->>br: 200: save session in cookie
    deactivate rp
    br->>hu: Home Page
    deactivate br
    hu->>br: Click on Projects
    activate br
    br->>rp: GET /api/v1/projects
    activate rp
    rp->>rp: Verify token and permissions
    rp->>br: 200: projects list
    deactivate rp
    br->>hu: Projects Page
    deactivate br
```

### => Login from external OIDC or OAuth2.0 provider through ``percli`` command line.

> 🚧 This documentation is not necessarily the final design but describes the implemention plan
> 
```mermaid    
sequenceDiagram
    actor hu as John
    #actor ro as Robot
    participant pc as percli Command Line
    participant rp as Perses Backend
    participant op as External Identity Provider
    
    hu->>pc: EXEC: percli login
    activate pc
    pc->>rp: GET /api/config
    activate rp
    rp->>pc: 200: Config<br/> (containing Providers List)
    deactivate rp
    pc->>hu: PROMPT: which provider?
    deactivate pc
    hu->>pc: select provider
    activate pc
    pc->>rp: GET /api/auth/providers/{oidc|oauth}/{slug_id}/device/code
    activate rp
    rp->>op: GET /oauth/device/code
    activate op
    op->>rp: 200: Device Code + User Code + Verification URL
    deactivate op
    rp->>pc: 200: Device Code + User Code + Verification URL
    pc->>hu: PRINT: User Code + Verification URL (clickable)
    rect rgba(66, 95, 237, 0.2)
        Note over hu, op: Through the browser
        hu->>op: Go to Verification URL + enter User Code
        activate op
        op->>hu: 302: Redirect to Authorization prompt
        hu->>op: Consent
        op->>op: Mark device as authorized
        op->>hu: 200: Invite to close browser
        deactivate op
    end
    Note over hu, op: Meanwhile, percli is polling the following endpoint, until it succeed.
    pc->>rp: GET /api/auth/providers/{oidc|oauth}/{slug_id}/token
    activate rp
    alt OIDC
        rp->>op: GET /oauth/token
        activate op
        op->>rp: 200: id_token & access_token
        deactivate op
        rp->>op: GET /api/userinfo<br/> (endpoint from .well-known URL)
        activate op
        op->>rp: 200: User Info
        deactivate op
        Note right of rp: User Info + id token are<br/> used to sync user in database
        rp->>rp: Create or Update user in DB
    else OAUTH 2.0
        rp->>op: GET /oauth/token
        activate op
        op->>rp: 200: access_token
        deactivate op
        rp->>op: GET /api/userinfo<br/> (endpoint from Perses Config)
        activate op
        op->>rp: 200: User Info
        deactivate op
        Note right of rp: Only User Info is<br/> used to sync user in database
        rp->>rp: Create or Update user in DB
    end
    Note right of rp: A new session is created<br /> with a new signed acces_token+refresh_token
    rp->>pc: 200: access_token + refresh_token
    deactivate rp
    pc->>pc: WRITE: session into config file
    pc->>hu: PRINT: Successfully authenticated!
    deactivate pc
    hu->>pc: EXEC: percli get projects
    activate pc
    pc->>rp: GET /api/v1/projects
    activate rp
    rp->>rp: Verify token and permissions
    rp->>pc: 200: Projects list
    deactivate rp
    pc->>hu: PRINT: Projects list
    deactivate pc
```

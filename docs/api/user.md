# User

For the moment, user is a way to create an account and then get a write access to a project you created.

## User Specification

```yaml
kind: "User"
metadata:
  # User name for login
  name: <string>
spec:
  [ firstName: <string> ]
  [ lastName: <string> ]

  # Password when provided is hashed and salted before going to the database
  # Password is optional because depending on the Perses configuration, you might be able to login with external
  # authentication provider or not be able to create a user at all.
  # It can happen when the Perses server relies on a ldap database for authentication.
  [ nativeProvider: [ password: <string>]] 

  # Save the context of the oauth provider used if the user has been created from an external OIDC or OAuth
  # authentication provider.
  oauthProviders:  
  - [ <oauthProvider> ]
```

### `<oauthProvider>`

```yaml
  # Identifying the provider
  issuer: <string>

  # Email of the user in the provider
  email: <string>

  # Identifying the user in the provider
  subject: <string>
```

## API definition

### Get a list of `User`

```bash
GET /api/v1/users
```

URL query parameters:

- name = `<string>` : filters the list of users based on their login name (prefix).

### Get a single `User`

```bash
GET /api/v1/users/<name>
```

### Create a single `User`

```bash
POST /api/v1/users
```

### Update a single `User`

```bash
PUT /api/v1/users/<name>
```

### Delete a single `User`

```bash
DELETE /api/v1/users/<name>
```

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
  # Password is optional because depending on the Perses configuration, you might not be able to create a user.
  # It can happen when the Perses server relies on a ldap database for authentication.
  [ password: <string> ]
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

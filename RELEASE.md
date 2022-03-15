Releases
========

This page describes the release processes. It's inspired from
the [Prometheus release process](https://github.com/prometheus/prometheus/blob/main/RELEASE.md)

## How to cut an individual release

### Branch management and versioning strategy

We use [Semantic Versioning](https://semver.org/).

The current flow is to merge new features and bugfixes into the main branch.

As we are in early stage of the project, we don't intend to maintain previous version. Only the last version will be
patched if we estimate it requires an urgent patch that cannot wait for the next minor release.

### 0. Updating dependencies

We are using dependabot to keep up to date our dependencies (of Go or npm).

In case you would like to update manually the dependencies :

#### Updating Go dependencies

```bash
make update-go-deps
git add go.mod go.sum
git commit -m "Update dependencies"
```

### Updating npm dependencies

TBD

### 1. Prepare your release

You should start to create a branch that follows the pattern `release/v<X.Y.Z>`

Update the file `Changelog.md` and the different `package.json` with the corresponding version. Once you updated
every `package.json`, you need to run `npm install` at the UI root folder `ui/`.

Do this in a proper PR pointing to the release branch as this gives others the opportunity to chime in on the release in
general and on the addition to the changelog in particular.

Entries in the `Changelog.md` are meant to be in this order:

* `[FEATURE]`
* `[ENHANCEMENT]`
* `[BUGFIX]`
* `[BREAKINGCHANGE]`

As we have many libraries we aime to expose, it's better if you also put a clear indication about what lib is concerning
by these changes.

### 2. Draft the new release

Tag the new release via the following commands:

```bash
git checkout release/v<version_to_be_replaced>
tag="v<version_to_be_replaced>"
git tag -w "${tag}" -m "${tag}"
git push origin "${tag}"
```

Signing a tag with a GPG key is appreciated, but in case you can't add a GPG key to your Github account using the
following [procedure](https://docs.github.com/en/authentication/managing-commit-signature-verification), you can replace
the `-s` flag by `-a` flag of the git tag command to only annotate the tag without signing.

Once a tag is created, the release process through the Github Actions will be triggered for this tag.

You should then create the Github release associated to the tag and put the content of the `Changelog.md` there.

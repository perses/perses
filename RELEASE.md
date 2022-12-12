# Releases

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
git commit -m "Update Go dependencies"
```

### Updating npm dependencies

```bash
make update-npm-deps
git add ./ui/package-lock.json ./**/package.json
git commit -m "Update npm dependencies"
```

Note: in case you feel it, you can also upgrade the npm dependencies to their latest release (major or minor)
with `make upgrade-npm-deps`

### 1. Prepare your release

You should start to create a branch that follows the pattern `release/v<X.Y>`. Release candidates and patch releases
for any given major or minor release happen in the same release/v<major>.<minor> branch. Do not create release/<version>
for patch or release candidate releases.

- Do this in a proper PR pointing to the release branch as this gives others the opportunity to chime in on the release
  in general and on the addition to the changelog in particular.

- Update the file `VERSION` with the new version to be created.

- Update the file `CHANGELOG.md` :

```bash
make generate-changelog
```

Note: it will generate a first changelog version based on the git history. You should review what has been generated.
Error can happen ;)

- Entries in the `CHANGELOG.md` are meant to be in this order:

* `[FEATURE]`
* `[ENHANCEMENT]`
* `[BUGFIX]`
* `[BREAKINGCHANGE]`

As we have many libraries we publish, it's better if you also put a clear indication about what library is affected by
these changes.

- Update the different `package.json` with the corresponding version:

```bash
make bump-version
```

### 2. Draft the new release

Tag the new release via the following commands:

```bash
git checkout release/v<version_to_be_replaced>
make tag
git push origin v<version_to_be_replaced>
```

Signing a tag with a GPG key is appreciated, but in case you can't add a GPG key to your Github account using the
following [procedure](https://docs.github.com/en/authentication/managing-commit-signature-verification), you can replace
the `-s` flag by `-a` flag of the git tag command to only annotate the tag without signing.

Once a tag is created, the release process through the GitHub Actions will be triggered for this tag.

The Github releases will be created automatically by the GitHub Action triggered. Hopefully you will find the accurate
changelog there. It won't hurt if you check quickly if it does not miss anything there.

## How to cut a UI snapshot release

Occasionally, it is helpful to test a packaged version of the UI to validate specific functionality before cutting a
real release. Where there are difficulties doing this via tools like `npm link` and `npm pack` because of complexities
with workspaces, a maintainer can create a "snapshot" release of the UI.

### Limits of snapshot releases

- **DO NOT** merge snapshot branches into `main`. They are intended only as a tool for testing.
- **DO NOT** recommend using snapshot branches in production code. They are intended to be ephemeral for testing
  purposes.

### Creating a snapshot branch

The creation of snapshots is automated by Github actions based on branch naming schemes.

- Create a branch following the naming scheme `snapshot/tag-name` (e.g. `snapshot/theme-updates`) with the changes you
  want to test. The `tag-name` should be short and kebab-case because it will be used as part of a version name and tag
  name in npm.
- Github actions will build the UI and release a version named `0.0.0-snapshot-tag-name-SHA` at a tag
  named `snapshot-tag-name` where `tag-name` comes from your branch name and `SHA` is a short version of the git sha for
  the latest commit on the branch.
    - We use `0.0.0` as the version prefix to keep snapshots at the bottom of the npm versions UI to avoid confusion for
      consumers of the package. This also helps differentiate snapshots from the concept of prereleases, which we do not
      currently provide, but may add in the future.
- Github actions will release a new version with the latest sha each time you push to the snapshot branch.

### Using a snapshot branch

- Install the snapshot branch for all relevant packages using the `snapshot-NAME` tag (
  e.g. `npm install --save-exact @perses-dev/core@snapshot-theme-updates`). Recommend using `--save-exact` to avoid
  inconsistencies with how snapshot version names may match using `^`.

### Removing a snapshot

- Delete the branch.
- Github actions will automatically remove the tag from npm. The version will still show up in the "version history"
  section of npm.

# monorepo-changes

[![build-test](https://github.com/silverlyra/monorepo-changes/actions/workflows/test.yml/badge.svg)](https://github.com/silverlyra/monorepo-changes/actions/workflows/test.yml)

Use this action to determine which “workspaces” within a [monorepo][] have changed on a commit or in a pull request.


## Usage

See [`action.yml`](./action.yml) for descriptions of this action’s outputs.

<!-- start usage -->
```yaml
- uses: silverlyra/monorepo-changes@v0.1
  id: changes

- name: Build backend
  if: fromJSON(steps.changes.outputs.changes)['packages/backend']
  run: >-
    ...

- name: Build frontend
  if: fromJSON(steps.changes.outputs.changes)['packages/frontend']
  run: >-
    ...
```
<!-- end usage -->


[monorepo]: https://en.wikipedia.org/wiki/Monorepo

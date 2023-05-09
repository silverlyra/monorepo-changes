import {spawnSync} from 'child_process'

import type {Workspace} from './workspace'
import path from 'path'

export function getWorkspaceChanges(
  workspaces: Map<string, Workspace>
): Map<string, boolean> {
  const changes: Map<string, boolean> = new Map()
  const files = [...getChangedFiles()]

  for (const base of workspaces.keys()) {
    visit(base)
  }

  return changes

  function visit(base: string): boolean {
    const workspace = workspaces.get(base)
    if (!workspace) return false

    const known = changes.get(workspace.path)
    if (known != null) return known

    const changed =
      [...workspace.dependencies].some(visit) ||
      files.some(file => file.startsWith(`${base}${path.sep}`))
    changes.set(workspace.path, changed)

    return changed
  }
}

export function getChangedFiles(): Set<string> {
  const base = fetchComparisonBase()

  const {stdout} = spawnSync(
    'git',
    ['diff', '--name-status', '--diff-filter=d', `${base}..HEAD`],
    {stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf-8'}
  )
  return new Set(
    stdout
      .split('\n')
      .filter(Boolean)
      .map(change => change.split('\t')[1])
  )
}

export function fetchComparisonBase(): string {
  const base = getComparisonBase()

  if (!hasCommit(base)) {
    if (base.startsWith('HEAD')) {
      spawnSync('git', ['fetch', 'origin', '--deepen=1'], {stdio: 'inherit'})
    } else {
      spawnSync('git', ['fetch', 'origin', base], {stdio: 'inherit'})
      spawnSync('git', ['branch', base, 'FETCH_HEAD'], {stdio: 'inherit'})
    }
  }

  return base
}

export function getComparisonBase(): string {
  const base = process.env.GITHUB_BASE_REF
  return base ? base.replace(/^refs\/heads\//, '') : 'HEAD^'
}

function hasCommit(commit: string): boolean {
  const {status} = spawnSync('git', ['rev-parse', '--verify', commit], {
    stdio: 'ignore'
  })
  return status === 0
}

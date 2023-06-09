import * as core from '@actions/core'

import {
  getChangedFiles,
  getComparisonBase,
  getWorkspaceChanges,
  parseRevision
} from './compare'
import {detect} from './workspace'

async function run(): Promise<void> {
  const now = new Date()
  const workspaces = await detect()

  if (core.isDebug()) {
    // eslint-disable-next-line no-console
    console.dir(workspaces, {colors: true})
  }

  const files = getChangedFiles()
  const changes = getWorkspaceChanges(workspaces, files)
  for (const base of [...changes.keys()].sort((a, b) => a.localeCompare(b))) {
    if (changes.get(base)) core.info(`Workspace changed: ${base}`)
  }

  if ([...files].some(f => f.startsWith('.github/'))) {
    core.info('.github/ changed; treating all workspaces as needing a rebuild')

    for (const base of changes.keys()) {
      changes.set(base, true)
    }
  }

  const paths = new Map(
    [...workspaces.values()]
      .map(workspace =>
        [...workspace.aliases].map(alias => [alias, workspace.path] as const)
      )
      .flat(1)
  )

  const base = getComparisonBase()
  core.setOutput('base', base)
  core.setOutput('base_commit', parseRevision(base))
  core.setOutput('changes', JSON.stringify(Object.fromEntries(changes)))
  core.setOutput('paths', JSON.stringify(Object.fromEntries(paths)))
  core.setOutput(
    'workspaces',
    JSON.stringify(
      Object.fromEntries(
        [...workspaces.values()].map(workspace => [
          workspace.path,
          {...workspace, changed: changes.get(workspace.path) ?? null}
        ])
      ),
      (_key, value) => (value instanceof Set ? [...value] : value)
    )
  )
  core.setOutput('time', now.toJSON())
  core.setOutput('time_unix', Math.floor(+now / 1000))
  core.setOutput('time_unix_ms', +now)
}

run().catch(core.setFailed)

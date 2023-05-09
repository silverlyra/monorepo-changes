import * as core from '@actions/core'

import {getWorkspaceChanges} from './compare'
import {detect} from './workspace'

async function run(): Promise<void> {
  const now = new Date()
  const workspaces = await detect()

  if (core.isDebug()) {
    // eslint-disable-next-line no-console
    console.dir(workspaces, {colors: true})
  }

  const changes = getWorkspaceChanges(workspaces)
  for (const base of [...changes.keys()].sort((a, b) => a.localeCompare(b))) {
    if (changes.get(base)) core.info(`Workspace changed: ${base}`)
  }

  const paths = new Map(
    [...workspaces.values()]
      .map(workspace =>
        [...workspace.aliases].map(alias => [alias, workspace.path] as const)
      )
      .flat(1)
  )

  core.setOutput('changes', JSON.stringify(Object.fromEntries(changes)))
  core.setOutput('paths', JSON.stringify(Object.fromEntries(paths)))
  core.setOutput('time', now.toJSON())
  core.setOutput('time_unix', Math.floor(+now / 1000))
  core.setOutput('time_unix_ms', +now)
}

run().catch(core.setFailed)

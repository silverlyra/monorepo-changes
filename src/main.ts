import * as core from '@actions/core'

import {getWorkspaceChanges} from './compare'
import {detect} from './workspace'

async function run(): Promise<void> {
  const workspaces = await detect()

  if (core.isDebug()) {
    // eslint-disable-next-line no-console
    console.dir(workspaces, {colors: true})
  }

  const changes = getWorkspaceChanges(workspaces)
  for (const base of [...changes.keys()].sort((a, b) => a.localeCompare(b))) {
    core.info(`Workspace changed: ${base}`)
  }

  core.setOutput('changes', JSON.stringify(Object.fromEntries(changes)))
  core.setOutput('time', new Date().toJSON())
}

run().catch(core.setFailed)

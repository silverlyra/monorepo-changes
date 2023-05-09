import fs from 'fs/promises'

import * as core from '@actions/core'
import * as glob from '@actions/glob'
import YAML from 'yaml'

import type {Workspace} from '.'
import {type NPMWorkspace, visit, resolve} from './npm'

export async function detect(): Promise<Map<string, Workspace> | null> {
  const decl = await discover()
  if (decl == null) return null

  const workspaces: Map<string, NPMWorkspace> = new Map()
  const globber = await glob.create(decl.packages.join('\n'))

  for await (const base of globber.globGenerator()) {
    if ((await fs.stat(base)).isDirectory()) {
      const workspace = await visit(base)
      workspaces.set(base, workspace)
    }
  }

  resolve(workspaces)
  return workspaces
}

async function discover(): Promise<Declaration | null> {
  try {
    const contents = await fs.readFile('pnpm-workspace.yaml', 'utf-8')
    return YAML.parse(contents)
  } catch (err) {
    core.debug(`Failed to read pnpm-workspace.yaml: ${err}`)
    return null
  }
}

interface Declaration {
  packages: string[]
}

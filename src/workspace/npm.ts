import fs from 'fs/promises'
import path from 'path'

import * as core from '@actions/core'
import * as glob from '@actions/glob'

import type {Workspace} from '.'

export interface NPMWorkspace extends Workspace {
  npm: {name: string; dependencies: Set<string>}
}

export async function detect(): Promise<Map<string, Workspace> | null> {
  const packages = await discover()
  if (packages == null) return null

  const workspaces: Map<string, NPMWorkspace> = new Map()
  const globber = await glob.create(packages.join('\n'))

  for await (const base of globber.globGenerator()) {
    if ((await fs.stat(base)).isDirectory()) {
      const workspace = await visit(base)
      workspaces.set(base, workspace)
    }
  }

  resolve(workspaces)
  return workspaces
}

export async function discover(): Promise<string[] | null> {
  try {
    const contents = await fs.readFile('package.json', 'utf-8')
    const pkg: NPMPackage = JSON.parse(contents)
    return Array.isArray(pkg.workspaces) ? pkg.workspaces : null
  } catch (err) {
    core.debug(`Failed to read package.json: ${err}`)
    return null
  }
}

export async function visit(base: string): Promise<NPMWorkspace> {
  const pkg: NPMPackage = JSON.parse(
    await fs.readFile(path.join(base, 'package.json'), 'utf-8')
  )

  return {
    path: base,
    dependencies: new Set(),
    npm: {
      name: pkg.name,
      dependencies: new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {})
      ])
    }
  }
}

export function resolve(workspaces: Map<string, NPMWorkspace>): void {
  const packages = new Map(
    [...workspaces.values()].map(
      workspace => [workspace.npm.name, workspace.path] as const
    )
  )

  for (const workspace of workspaces.values()) {
    for (const dependency of workspace.npm.dependencies) {
      const peer = packages.get(dependency)
      if (peer) workspace.dependencies.add(peer)
    }
  }
}

export interface NPMPackage {
  name: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  workspaces?: string[]
}
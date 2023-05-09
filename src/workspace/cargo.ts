import fs from 'fs/promises'
import path from 'path'

import * as core from '@actions/core'
import TOML from 'toml'

import {glob} from '../glob'
import type {Workspace} from '.'

export interface CargoWorkspace extends Workspace {
  cargo: {name: string; dependencies: Set<string>}
}

export async function detect(): Promise<Map<string, Workspace> | null> {
  const packages = await discover()
  if (packages == null) return null

  const workspaces: Map<string, CargoWorkspace> = new Map()
  const matches = await glob(packages)

  for (const base of matches) {
    if ((await fs.stat(base)).isDirectory()) {
      core.debug(`cargo: visit ${base}`)
      const workspace = await visit(base)
      if (workspace != null) workspaces.set(base, workspace)
    }
  }

  return workspaces
}

export async function discover(): Promise<string[] | null> {
  try {
    const contents = await fs.readFile('Cargo.toml', 'utf-8')
    const pkg: CargoPackage = TOML.parse(contents)
    return pkg.workspace && Array.isArray(pkg.workspace.members)
      ? pkg.workspace.members
      : null
  } catch (err) {
    core.debug(`Failed to read Cargo.toml: ${err}`)
    return null
  }
}

export async function visit(base: string): Promise<CargoWorkspace | null> {
  const contents = await fs.readFile(path.join(base, 'Cargo.toml'), 'utf-8')
  const pkg: CargoPackage = TOML.parse(contents)
  const name = pkg.package?.name
  if (!name) return null

  const workspace: CargoWorkspace = {
    path: base,
    aliases: new Set([name]),
    dependencies: new Set(),
    cargo: {name, dependencies: new Set()}
  }

  visitDependencies(pkg.dependencies)
  visitDependencies(pkg['build-dependencies'])
  visitDependencies(pkg['dev-dependencies'])

  if (pkg.target && typeof pkg.target === 'object') {
    for (const target of Object.values(pkg.target)) {
      visitDependencies(target.dependencies)
      visitDependencies(target['build-dependencies'])
      visitDependencies(target['dev-dependencies'])
    }
  }

  return workspace

  function visitDependencies(
    deps: Record<string, CargoDependency> | undefined
  ): void {
    if (!deps) return

    // eslint-disable-next-line no-shadow
    for (const [name, dep] of Object.entries(deps)) {
      workspace.cargo.dependencies.add(name)
      if (typeof dep === 'object' && dep.path) {
        workspace.dependencies.add(path.resolve(base, dep.path))
      }
    }
  }
}

interface CargoPackage extends CargoDependencies {
  package?: {name: string}
  workspace?: {members: string[]}
  target?: Record<string, CargoDependencies>
}

type CargoDependency = string | CargoDependencySpec

interface CargoDependencySpec {
  version?: string
  path?: string
}

interface CargoDependencies {
  dependencies?: Record<string, CargoDependency>
  'build-dependencies'?: Record<string, CargoDependency>
  'dev-dependencies'?: Record<string, CargoDependency>
}

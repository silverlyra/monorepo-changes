import path from 'path'

import * as cargo from './cargo'
import * as npm from './npm'
import * as pnpm from './pnpm'

export interface Workspace {
  path: string
  dependencies: Set<string>
}

export async function detect(): Promise<Map<string, Workspace>> {
  const detected = await Promise.all([
    cargo.detect(),
    npm.detect(),
    pnpm.detect()
  ])

  return merge(detected)
}

function merge(
  detected: Array<Map<string, Workspace> | null>
): Map<string, Workspace> {
  const merged: Map<string, Workspace> = new Map()

  for (const results of detected) {
    if (results == null) continue

    for (const [fullPath, workspace] of results) {
      const base = toRelative(fullPath)

      if (!merged.has(base)) {
        merged.set(base, {
          ...workspace,
          dependencies: new Set([...workspace.dependencies].map(toRelative))
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const existing = merged.get(base)!

        merged.set(base, {
          ...existing,
          ...workspace,
          dependencies: new Set([
            ...existing.dependencies,
            ...[...workspace.dependencies].map(toRelative)
          ])
        })
      }
    }
  }

  return merged
}

function toRelative(fullPath: string): string {
  return path.relative(process.env.GITHUB_WORKSPACE || process.cwd(), fullPath)
}

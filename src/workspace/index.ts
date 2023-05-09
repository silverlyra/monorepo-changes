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

    for (const [base, workspace] of results) {
      if (!merged.has(base)) {
        merged.set(base, workspace)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const existing = merged.get(base)!

        merged.set(base, {
          ...existing,
          ...workspace,
          dependencies: new Set([
            ...existing.dependencies,
            ...workspace.dependencies
          ])
        })
      }
    }
  }

  return merged
}

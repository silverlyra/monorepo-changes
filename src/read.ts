import {readFile} from 'fs/promises'
import {resolve} from 'path'

import * as core from '@actions/core'

/**
 * Read a workspace definition file, feeding it through the given `parser`.
 *
 * Fails the action if either reading or parsing throws an exception.
 */
export default async function read<T>(
  path: string,
  parser: (data: string) => T
): Promise<T> {
  core.debug(`  read: ${JSON.stringify(resolve(path))}`)

  let contents: string
  try {
    contents = await readFile(path, 'utf-8')
  } catch (err) {
    core.setFailed(`Failed to read ${resolve(path)}:`)
    core.error(err instanceof Error ? err : `${err}`)
    process.exit(1)
  }

  try {
    return parser(contents)
  } catch (err) {
    core.setFailed(`Failed to parse ${resolve(path)}:`)
    core.error(err instanceof Error ? err : `${err}`)
    process.exit(1)
  }
}

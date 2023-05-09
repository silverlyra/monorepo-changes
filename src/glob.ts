import {globby} from 'globby'

export async function glob(patterns: string[]): Promise<string[]> {
  return globby(patterns, {
    onlyDirectories: true,
    onlyFiles: false,
    expandDirectories: false
  })
}

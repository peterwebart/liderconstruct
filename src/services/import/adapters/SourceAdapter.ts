import type { RawRow } from '../types'

export interface SheetData {
  name: string
  rows: RawRow[]
}

/** A source adapter turns a file/feed into uniform sheets of raw rows. */
export interface SourceAdapter {
  readonly format: string
  read(filePath: string): SheetData[]
}

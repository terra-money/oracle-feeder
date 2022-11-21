import { createObjectCsvWriter } from 'csv-writer'
import { CsvWriter } from 'csv-writer/src/lib/csv-writer'

export function createReporter(path: string, headers: string[]): CsvWriter<Record<string, unknown>> {
  return createObjectCsvWriter({
    path,
    header: headers.map((header) => ({ id: header, title: header })),
  })
}

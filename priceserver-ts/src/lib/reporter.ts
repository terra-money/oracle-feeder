import { createObjectCsvWriter } from 'csv-writer';

export function createReporter(path: string, headers: string[]) {
  return createObjectCsvWriter({
    path,
    header: headers.map(header => ({ id: header, title: header }))
  });
}

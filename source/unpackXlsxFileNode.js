import fs from 'fs'
import Stream from 'stream'
import unzip from 'unzipper'

/**
 * Reads XLSX file in Node.js.
 * @param  {(string|Stream)} input - A Node.js readable stream or a path to a file.
 * @param  {object} options
 * @param  {string?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(input, { sheet }) {
  // XLSX file is a zip archive.
  // The `entries` object stores the files
  // and their contents from this XLSX zip archive.
  const entries = {}

  const stream = input instanceof Stream ? input : fs.createReadStream(input)

  return new Promise((resolve, reject) => {
    const entryPromises = []

    stream
      .pipe(unzip.Parse())
      .on('error', reject)
      .on('close', () =>  Promise.all(entryPromises).then(() => resolve(entries)))
      .on('entry', (entry) => {
        let contents = ''
        // To ignore an entry: `entry.autodrain()`.
        entryPromises.push(new Promise((resolve) => {
          entry
            .on('data', data => contents += data.toString())
            .on('end', () => resolve(entries[entry.path] = contents))
        }))
      })
  })
}

const axios = require('axios')
const fs = require('fs')
const path = require('path')

let downloadCount = 0

function printUsage() {
  console.log('Usage: node downloadpic.js magiccookie')
  console.log('Example: node downloadpic.js DgU00=uQjQ7mAJPRO76JTfKvAPJScfiLr7b97N2')
  process.exit(1)
}

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file))
  })
  return filelist
}

async function processEventJson (fileName, cookie) {
  const evt = require('./' + fileName)
  for (const att of evt.new_attachments) {
    let dlFileName = `${evt.event_date}-${evt.event_time}-${att.filename}`
    if (att.mime_type === 'image/jpeg') {
      dlFileName = dlFileName.replace('.bin', '.jpg')
    }
    const fullDlFileName = ('./' + fileName).replace(/\d{4}-\d{2}-\d{2}-\w+\.json$/, dlFileName)
    console.log(`downloading ${att.filename} to ${fullDlFileName}`)
    if (fs.existsSync(fullDlFileName) && fs.statSync(fullDlFileName).size > 0) {
      console.log(`    file already downloaded`)
    } else {
      downloadCount++
      const resp = await axios.get('https://www.tadpoles.com/remote/v1/attachment?key=' + att.key,
        { responseType: 'arraybuffer', headers: { 'Cookie' : cookie } })
      console.log(`  downloaded, size =`, resp.data.length)
      const stream = fs.createWriteStream(fullDlFileName)
      stream.write(resp.data)
      stream.end()
    }
  }
}

async function main () {
  if (!process.argv[2]) {
    printUsage()
  }
  const allFiles = walkSync('./data').filter(fn => fn.match(/\d{4}-\d{2}-\d{2}-.*\.json$/))
  console.log(`found ${allFiles.length} json files in data dir`)
  for (const f of allFiles) {
    await processEventJson(f, process.argv[2])
  }
  console.log(`Done! downloaded ${downloadCount} files`)
}

main().catch(err => {
  console.error('unexpected error', err)
  process.exit(2)
})
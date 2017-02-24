const fs = require('fs')
const path = require('path')
const piexif = require('piexifjs')

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file))
  })
  return filelist
}

function unixTimeToExifTime (unixTime) {
  const date = new Date(unixTime * 1000)
  return date.getFullYear() + ':' + ('0' + (date.getMonth() + 1)).slice(-2) + ':' + ('0' + date.getDate()).slice(-2) + ' ' +
    ('0' + (date.getHours() + 1)).slice(-2) + ':' + ('0' + (date.getMinutes() + 1)).slice(-2) + ':' + ('0' + (date.getSeconds() + 1)).slice(-2)
}

let okCount = 0
let failedCount = 0
let skipCount = 0

async function processEventJson (fileName) {
  const evt = require('./' + fileName)
  for (const att of evt.new_attachments) {
    let mediaFileName = `${evt.event_date}-${att.filename}`
    if (att.mime_type !== 'image/jpeg') {
      skipCount++
      console.log(`Skipping ${mediaFileName}`)
      continue
    }
    mediaFileName = mediaFileName.replace('.bin', '.jpg')
    const fullMediaFileName = ('./' + fileName).replace(/\d{4}-\d{2}-\d{2}-\w+\.json$/, mediaFileName)
    console.log(`Modifying ${fullMediaFileName} via ${fileName}`)
    if (fs.statSync(fullMediaFileName).size > 0) {
      okCount++
      const fileContent = fs.readFileSync(fullMediaFileName)
      const fileBinary = fileContent.toString('binary')
      const exifObj = piexif.load(fileBinary)
      exifObj.Exif[piexif.ExifIFD.DateTimeOriginal] = unixTimeToExifTime(evt.event_time)
      let comment = ''
      if (evt.comment) {
        comment += evt.comment + ' -- '
      }
      comment += '{ ' + evt.members_display.join(',') + ' }'
      exifObj.Exif[piexif.ExifIFD.UserComment] = comment
      const exifbytes = piexif.dump(exifObj)
      const newBinary = piexif.insert(exifbytes, fileBinary)
      const newJpeg = new Buffer(newBinary, 'binary')
      fs.writeFileSync(fullMediaFileName.replace('.jpg', '-mod.jpg'), newJpeg)
      console.log(exifObj)
    } else {
      failedCount++
      console.log(` !!! expected file ${fullMediaFileName} not found`)
    }
  }
}

async function main () {
  const allJsonFiles = walkSync('./data').filter(fn => fn.match(/\d{4}-\d{2}-\d{2}-.*\.json$/))
  console.log(`found ${allJsonFiles.length} json files in data dir`)
  for (const f of allJsonFiles) {
    await processEventJson(f)
  }
  console.log(`Done! OK count = ${okCount}, failed count = ${failedCount}, skip count = ${skipCount}`)
}

main().catch(err => {
  console.error('unexpected error', err)
  process.exit(2)
})
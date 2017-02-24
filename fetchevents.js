const axios = require('axios')
const mkdirp = require('mkdirp')
const crypto = require('crypto')
const fs = require('fs')

function printUsage() {
  console.log('Usage: node fetchevents.js magiccookie')
  console.log('Example: node fetchevents.js DgU00=uQjQ7mAJPRO76JTfKvAPJScfiLr7b97N2')
  process.exit(1)
}

function processEventJson(data) {
  const allEvents = data.events
  console.log('total events count =', allEvents.length)
  console.log('daily report count = ', allEvents.filter(e => e.type === 'DailyReport').length)
  allEvents.sort((x, y) => x.event_date > y.event_date)
  console.log('earliest day = ', allEvents[allEvents.length - 1].event_date)
  console.log('latest day = ', allEvents[0].event_date)
  console.log('activity report count = ', allEvents.filter(e => e.type === 'Activity').length)
  console.log('now writing events to dirs...')
  let fileWritten = 0
  allEvents.filter(e => e.type === 'Activity').forEach(act => {
    if (act.event_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const month = act.event_date.substring(0, 4) + act.event_date.substring(5, 7)
      mkdirp.sync('./data/' + month)
      // currently, seems one activity only has one attachment
      // if (act.new_attachments.filter(na => na.mime_type === 'image/jpeg' || na.mime_type === 'video/mp4').length != 1) {
      //   console.log(act)
      // }
      const fileName = `${act.event_date}-${crypto.createHash('md5').update(act.key).digest("hex")}.json`
      fs.writeFileSync(`./data/${month}/${fileName}`, JSON.stringify(act, null, 2))
      fileWritten++
    } else {
      console.error('invalid activity payload', act)
    }
  })
  console.log(`** Done! ${fileWritten} written into ./data, you can now download pic/vid`)
}

async function main () {
  if (!process.argv[2]) {
    printUsage()
  }
  console.log('fetching the events from server side...')
  const resp = await axios.get('https://www.tadpoles.com/remote/v1/events?num_events=78&state=client', { timeout: 60000, headers: { 'Cookie' : process.argv[2] } })
  console.log('got the events json')
  const cachedEventJsonFile = `./data/event.json`
  fs.writeFileSync(cachedEventJsonFile, JSON.stringify(resp.data, null, 2))
  const data = require(cachedEventJsonFile)
  processEventJson(data)
}

main().catch(err => {
  console.error('unexpected error', err)
  process.exit(2)
})
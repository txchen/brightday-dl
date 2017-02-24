## My bright day downloader

To backup the pictures from my bright day app.

You can now download the pics from their app, but the jpg has not correct exif time info, so putting them into your gallery will be a mess.

This tool will help you to download the pictures and set the correct exif for you.

### Usage

Step 1) fetch events

`node fetchevents.js magiccookie`

Step 2) download photos and videos

`node downloadpic.js magiccookie`

Step 3) modify the exif info

`node modifyexif.js`

Step 4) copy the files and upload to somewhere

`cp data/**/*-mod.jpg finaldata && cp data/**/*.MOV finaldata`

### App protocol

#### Login

`http -f POST https://familyinfocenter.brighthorizons.com/mybrightday/login 'username=xxx@yyy.com' 'password=secret' response=jwt`

If success, response body will be the jwt token. Then validate it.

`http -f POST https://www.tadpoles.com/auth/jwt/validate 'token=THELONGTOKEN'`

If okay, the response will return a cookie, record it. Next, we need to admit something?

`http -f POST https://www.tadpoles.com/remote/v1/athome/admit 'cookie:COOKIE_IN_LAST_STEP' available_memory=16298568 uses_dst=true 'utc_offset=-08:00' 'tz=America Los_Angeles' logged_in=false 'mac=00:00:00:00:00:00' locale=en-US state=client v=2 battery_level=-1 app_version=7.2.7 platform_version=5.1.1 device_id=GUID ostype=32bit os_name=android model=SM-G920I`

This call will set another cookie in response, let's say cookie_2

Then register with this cookie.

`http -f POST https://www.tadpoles.com/remote/v1/push/register 'registration=URL_ENCODED_JSON_PALOAD_STUPID' 'cookie:COOKIE_2'`

The registration payload is like.

```json
{"alias":"your_account_email","badge":0,"quiettime":{"start":"1:00","end":"6:30"},"tz":"America/Los_Angeles","messageservice":"gcm","tags":[],"device_token":"some magic string","device_id":"a guid","app":"parent:bh","app_version":"7.2.7","is_provider":false}
```

I am too lazy to implement this flow in code, so you can either do it with httpie yourself, or, capture the phone packets and get the magic cookie.

#### Fetch all the events

Now, the cookie_2 is all you need, you can do crazy things. First, you might want to fetch all the events.

`http https://www.tadpoles.com/remote/v1/events?num_events=78&state=client 'cookie:THECOOKIEYOUSAVED'`

And maybe this is for pagination: `/remote/v1/events?num_events=78&state=client&direction=newer&latest_create_time=1487815536`

Event has type, it can be `Activity` or `DailyReport`

Activity sample:

```json
{
  "comment": "The comment that should be put into exif",
  "members_display": [
    "Name"
  ],
  "attachments": [
    "picture_id"
  ],
  "labels": [
    "label1 label2"
  ],
  "create_time": 1487815534.0,
  "event_eta": null,
  "tz": "America/Los_Angeles",
  "event_time": 1487791483.0,
  "actor": "aaaaaaaa",
  "member": "mmmmmm",
  "location": "llllll",
  "scope": "dependant",
  "type": "Activity",
  "new_attachments": [
    {
      "width": null,
      "filename": "01487791485.bin",
      "source": "providerapp",
      "key": "picture_id",
      "height": null,
      "mime_type": "image/jpeg"
    }
  ],
  "members": [
    "mmmmmm"
  ],
  "actor_display": "qqqq",
  "visibility": [
    "p",
    "d",
    "t"
  ],
  "location_display": "Some Campus",
  "grouped_event_is_primary": false,
  "key": "kkkkkk",
  "event_date": "2017-02-22",
  "group": "gggggg",
  "grouped_event_id": null,
  "member_display": "Name",
  "in_outbox": false,
  "action": "AddToDaily",
  "c_domains": [
    "0KIaRPjLQ1ud2_YOuGiZOA"
  ]
},
```

DailyReport sample:

```json
{
  "comment": null,
  "members_display": [
    "Name"
  ],
  "attachments": [
  ],
  "entries": [
    {
      "start_time": 1487793600.0,
      "child_type": "toddler",
      "type": "nap",
      "id": "h8_waj7zqecxk3vl-ebv6a",
      "end_time": 1487803080.0
    }
  ],
  "create_time": 1487815536.0,
  "event_eta": null,
  "report_type": "toddler",
  "tz": "America/Los_Angeles",
  "event_time": 1487750400.0,
  "actor": "xxxxxxxx",
  "member": "xxxx",
  "location": "xxxx",
  "scope": "dependant",
  "type": "DailyReport",
  "new_attachments": [
  ],
  "members": [
    "xxxxxx"
  ],
  "actor_display": "QQQQ",
  "visibility": [
  ],
  "location_display": "Some Campus",
  "grouped_event_is_primary": false,
  "key": "kkkk",
  "event_date": "2017-01-22",
  "group": "gggg",
  "grouped_event_id": null,
  "member_display": "Zachary",
  "in_outbox": false,
  "action": "Notify",
  "server_report_key": "rrrr"
}
```

#### Download a picture

`http https://www.tadpoles.com/remote/v1/attachment?key=picture_id_in_acvitity 'cookie:COOKIE_2'
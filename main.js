// calanderd 0.1
// GNU GPL 3+
// Written for #priyom on freenode (priyom.org) by Tomáš Hetmer.

var config = require('./config');
var calendar = require('./calendar');
var irc = require('irc');
require('./extends');

var client = new irc.Client(config.server, config.botName, {
    userName: 'calanderd',
    realName: 'calanderd 0.1',
    port: 7000,
    showErrors: true,
    autoConnect: false,
    retryDelay: 4000,
    retryCount: 1000,
    secure: true
});

client.connect(5, function (input) {
    console.log("[i] calanderd on server");

    client.join(config.room, function (input) {
        hasRoom = true;

        console.log('[i] room connection is ready');

        setInterval(function () {
            client.send('PONG', 'empty');
        }, 2 * 60 * 1000);

        if (hasRoom && hasEvents) {
            onReady();
        }
    });
});

client.addListener('error', function (message) {
    console.log('[!] error: ', message);
});

var hasRoom = false;
var hasEvents = false;
var events = [];

function main() {
    console.log('[i] Asking Google for data');

    var now = new Date();
    var endDate = now.addDays(config.numberOfDaysToFetch);
    var calanderUrl = "https://www.googleapis.com/calendar/v3/calendars/" + config.calendarId + "@group.calendar.google.com/events?orderBy=startTime&singleEvents=true&timeMax=" + endDate.toISOString() + "&timeMin=" + now.toISOString() +
        "&fields=items(start%2Csummary)%2Csummary&key=AIzaSyCobUsCNLg2lIsBlKYtbeHsAaN_X2LjwV0";

    var https = require('https');

    https.get(calanderUrl, function (res) {
        console.log("[i] got statusCode: ", res.statusCode);

        res.on('data', function (d) {
            obj = JSON.parse(d);
            onHttpReturn(obj);
        });

    }).on('error', function (e) {
        console.log("[!] " + e.message);
        // it shouldn't cycle :>
        // yeah i know, it's stupid
        // why not fix it for me?
        main();
    });
}

function onHttpReturn(obj) {
    hasEvents = true;

    console.log("[i] Number of events found: " + obj.items.length);
    console.log("[i] Time of first event: " + obj.items[0].start.dateTime);

    for (var i = 0; i < obj.items.length; i++) {
        var title = obj.items[i].summary;
        var time = obj.items[i].start.dateTime;
        var eventDate = new Date(time);
        var frequency = calendar.extractFrequency(title);
        var theEvent = {
            "eventDate": eventDate,
            "title": title,
            "frequency": frequency
        };
        events.push(theEvent);
    }

    client.addListener('message', function (from, to, message) {
        if (message.startsWith('!next')) {
            console.log('[i] received next command from ' + from);
            cmdNext(false);
        }
    });

    if (hasRoom && hasEvents) {
        onReady();
    }
}


function onReady() {
    console.log('[i] both actions succeeded, starting main system');
    nextAnnouncement();
}

function nextAnnouncement() {
    var next = calendar.getNextEvent(events, false);

    if (next === '-1') {
        hasEvents = false;
        events = [];
        main();
        console.log('[i] restarting');
        return false;
    }

    var nextTime = next.getTime() - (new Date()).getTime();
    var time = nextTime - config.announceEarly;
    setTimeout(cmdNext, time);

    console.log('[i] scheduler event cmdNext added for ' + time);
}

function cmdNext(recursion) {
    recursion = typeof recursion !== 'undefined' ? recursion : true;

    var next = calendar.getNextEvent(events);

    client.say(config.room, next);

    if (recursion) {
        var next = calendar.getNextEvent(events, false);
        var time = next.getTime() - (new Date()).getTime();
        setTimeout(nextAnnouncement, time);

        console.log('[i] scheduler event nextAnnouncement added for ' + time);
    }
}


main();

var config = {}

// irc config
config.room = '#priyom';
config.server = 'kornbluth.freenode.net';
config.botName = 'IvoSchwarz';

// calendar settings
config.calendarId = 'ul6joarfkgroeho84vpieeaakk' // this is in your iCal, html, etc. URLs

// announce before ...
config.announceEarly = 2 * 60000; // milliseconds

// calendar limits
config.maxResults = 5;

module.exports = config;

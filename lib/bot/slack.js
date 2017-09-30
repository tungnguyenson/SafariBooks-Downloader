var Botkit = require('botkit')
const program = require('commander');
const logger = require('../logger');
const Safari = require('../safari');
const EbookWriter = require('../ebook-writer');
const debug = require('debug')('cli');
const fs = require('fs-promise');
require('dotenv').config()

var token = process.env.SLACK_API_TOKEN;
var username = process.env.SAFARI_USERNAME;
var password = process.env.SAFARI_PASSWORD;
var downloadPrefix = process.env.DOWNLOAD_PREFIX;

if (token == null) {
    console.log("Credential 'SLACK_API_TOKEN' was not found!");
    process.exit(1);
}

var controller = Botkit.slackbot({
  debug: true
});

controller.spawn({
  token: process.env.SLACK_API_TOKEN,
}).startRTM();

controller.hears(
  ['https://www.safaribooksonline.com/library/view/(.*)/(.*)/'],
  ['direct_message', 'direct_mention', 'mention'],
  function(bot, message) {
    var bookName = message.match[1];
    var bookId = message.match[2];
    console.log('I see this book by its ID: ' + bookId);
    bot.reply(message, "Ok! Pirate. I'm downloading this book's ID `" + bookId + "`. Please wait for few seconds...");

    var outputFile = bookName + '-' +bookId + '.epub';
    var outputPath = __dirname + '/../../books/' + outputFile;
    var downloadUrl = downloadPrefix + outputFile;

  // ## Authorize User
  var safariClient = new Safari();
  safariClient.fetchBookById(bookId, username, password).then( (bookJSON) => {
    // console.log(bookJSON);
    var ebook = new EbookWriter(bookJSON);
    return ebook.save(outputPath);
  }).then( () => {
    // ## finished saving
    debug("the epub was successfully saved");
    logger.log("epub successfully saved. exiting...");

      bot.reply(message, 'Done! Your book can be downloaded now at: ' + downloadUrl);

  }).catch( (err) => {
    logger.log(err);
  });

});

controller.hears(
  ['hi'],
  ['direct_message', 'direct_mention', 'mention'],
  function(bot, message) {
    bot.reply(message, 'Hello <3')
});


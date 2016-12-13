// Instagram like bot will help you like any accounts automatically.
//
// Installation: npm install
//               edit user-specific variables in settings.json
//               node instagram_likebot.js
//
var phantomjs = require('phantomjs');
var webdriver = require('selenium-webdriver');
var by = webdriver.By;
var Promise = require('promise');

var settings = require('./settings.json');

var http = require('http');
var fs = require('fs');
var request = require('request');

var log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('instabot.log'), 'instabot');
var logger = log4js.getLogger('instabot');
logger.setLevel('DEBUG');

var cssSelector = {
    likeBtn: '._ebwb5._1tv0k',
    pics: '._icyx7'
};

var browser = new webdriver
    .Builder()
    .withCapabilities(webdriver.Capabilities.phantomjs())
    .build();

browser.manage().window().setSize(1024, 100);
browser.get('https://www.instagram.com/accounts/login/');
browser.findElement(by.name('username')).sendKeys(settings.instagram_account_username);
browser.findElement(by.name('password')).sendKeys(settings.instagram_account_password);
browser.findElement(by.xpath('//button')).click();

setInterval(function () {
    browser.sleep(settings.sleep_delay).then(function () {
        downloadByNickname(0);
    });
}, 60000);

function downloadByNickname(indexNickname) {
    browser.get('https://instagram.com/' + settings.instagram_accounts_to_be_liked[indexNickname]);
    browser.sleep(settings.sleep_delay);
    getLastPics();
}

function download(uri, filename, callback) {
    request.head(uri, function () {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

function getLastPics() {
    browser.getCurrentUrl().then(function (url) {
        // logger.debug('Current url:   ' + url);
        browser.sleep(settings.sleep_delay);

        browser.findElements(by.css(cssSelector.pics)).then(function (elements) {
            var existFiles = fs.readdirSync('./pics');

            var urls = elements.map(function (e) {
                return e.getAttribute('src');
            });

            Promise.all(urls).then(function (allUrls) {
                logger.info('Checking for new pics...');
                for (var i = 0; i < allUrls.length; i++) {
                    var fileName = /com.*\/(.*\.jpg)/i.exec(allUrls[i])[1];
                    (function (url, fileName) {
                        if (existFiles.indexOf(fileName) === -1) {
                            download(url, './pics/' + fileName, function () {
                                logger.info('done ' + fileName);
                            });
                        } else {
                            // logger.warn('skipping ' + fileName);
                        }
                    })(allUrls[i], fileName);
                }
                // browser.close();
            });
        });
    });
}

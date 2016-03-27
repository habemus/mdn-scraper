var https = require('https');
var util = require('util');
var path = require('path');
var fs   = require('fs');

var request = require('request');

const DEST_DIR = path.join(__dirname, 'tags');
const LOCALE = process.env.LOCALE || 'en-US';

function getIndexURL(locale) {
  return util.format('https://developer.mozilla.org/%s/docs/Web/HTML/Element$children', locale);
}

function getMDNURL(url) {
  return util.format('https://developer.mozilla.org%s$json?summary', url);
}

function getTagPath(tagName) {
  return path.join(DEST_DIR, tagName + '.json');
}

request(getIndexURL(LOCALE), (err, response, body) => {
  if (err) {
    console.warn(err);
    return;
  }

  var result = JSON.parse(body);

  var subpages = result.subpages;

  subpages.forEach((subpage, index) => {
    var tagName = subpage.title.replace(/^</, '').replace(/>$/, '');
    var subpageURL = getMDNURL(subpage.url);

    request(subpageURL, (err, response, body) => {

      if (err) {
        console.warn(err);
        return;
      }

      fs.writeFile(getTagPath(tagName), body);
    });
  });
});
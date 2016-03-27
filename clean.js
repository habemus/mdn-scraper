var fs = require('fs');

var request = require('request');
var cheerio = require('cheerio');
var Q       = require('q');

const TAG_REGEXP = /^<(.+)>$/;


function getMDNSectionURL(url, sectionId) {
  return 'https://developer.mozilla.org' + url + '?raw&macros&section=' + sectionId;
}

var finalData = [];

fs.readFile(__dirname + '/raw.json', 'utf8', function (err, data) {
  data = JSON.parse(data);
  
  var exemploRequestPromises = [];

  data.subpages.forEach(function (page) {

    var tagMatch = page.title.match(TAG_REGEXP);

    if (tagMatch) {

      var tagData = {
        name: tagMatch[1],
        summary: page.summary,

        url: 'https://developer.mozilla.org' + page.url,

        examples: []
      };

      // check if the page has an 'Exemplo' or 'Exemplos' section
      var examplesSection = page.sections.find(function (section) {
        return section.id === 'Exemplo' || section.id === 'Exemplos';
      });

      if (examplesSection) {

        var exampesURL = getMDNSectionURL(page.url, examplesSection.id);

        exemploRequestPromises.push(new Promise((resolve, reject) => {

          request(exampesURL, function (err, response, body) {
            if (err) {
              console.warn(err);
              reject(err);
              return;
            }

            var $ = cheerio.load(body);

            var examples = Array.prototype.map.call($('pre'), function (el) {
              return $(el).html();
            });

            tagData.examples = examples;

            // resolve finally
            resolve(true);
          });

        }));
      }

      finalData.push(tagData);
    }

  });
  

  Promise.all(exemploRequestPromises)
    .then(function () {

      console.log(finalData);

      fs.writeFile(__dirname + '/clean.json', JSON.stringify(finalData));
    }, function (err) {
      console.warn(err);

      throw err;
    });
});
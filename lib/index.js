const cheerio = require('cheerio');
const request = require('request');
const url = require('url')
const _ = require('lodash');
const urlModel = require('../db/model/url');

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
const urlRegex = new RegExp(URL_REGEX);
var REQUEST_COUNT = 0;

function fetchMediumUrls(content) {
  let mediumUrls = content.match(urlRegex);
  //removing duplicate
  mediumUrls = _.uniqBy(mediumUrls);
  //filtering medium URL only
  mediumUrls = mediumUrls.filter((url) => url.indexOf('medium.com') !== -1);

  return mediumUrls;
}

function parseUrl(inputUrlArray) {
  let urlWithoutParam;
  let parsedUrl;
  let finalUrlArray = [/** url: { count[int], params[param1, param2....] } */];

  inputUrlArray.forEach(inputUrl => {
    parsedUrl = url.parse(inputUrl, true);
    urlWithoutParam = parsedUrl.protocol + '//' + parsedUrl.hostname + parsedUrl.pathname;

    let existingUrl = finalUrlArray.find(urlObj => urlObj.url === urlWithoutParam)
    if (existingUrl) {
      existingUrl.refernceCount++;
      parsedUrl.query && Object.keys(parsedUrl.query).forEach(param => {
        if (!existingUrl.paramList) {
          existingUrl.paramList = [param];
        } else if (existingUrl.paramList.indexOf(param) === -1) {
          existingUrl.paramList.push(param)
        }
      })
    } else {
      finalUrlArray.push({
        url: urlWithoutParam,
        refernceCount: 1,
        paramList: parsedUrl.query ? Object.keys(parsedUrl.query) : []
      })
    }
  });
  return finalUrlArray;
}

function canMakeRequest() {
  return REQUEST_COUNT < 5
}

function scrapeMedium(url) {
  console.log(REQUEST_COUNT);
  console.log(url);
  if (!url) {
    return console.log('no url found');
  }

  function callScrapeMedium() {
    scrapeMedium(url);
  }
  if (!canMakeRequest()) {
    return setTimeout(callScrapeMedium, 2000);
  }

  console.log(`started scapping ${url}`);
  REQUEST_COUNT++;
  request(url, function (error, response, body) {
    REQUEST_COUNT = REQUEST_COUNT === 0 ? 0 : REQUEST_COUNT-1;
    if (error) {
      return console.log(`error occured while making a request to: ${url}`);
    }
    var $ = cheerio.load(body);
    var pageContent = $('body').toString();

    let mediumUrls = fetchMediumUrls(pageContent);
    console.log('mediumUrls fetch: ' + mediumUrls.length);
    finalUrlArray = parseUrl(mediumUrls);
    console.log('finalUrlArray fetch: ' + finalUrlArray.length);

    if (finalUrlArray.length < 1) {
      return 'nothing to process';
    }

    finalUrlArray.forEach(urlObject => {
      urlModel.find({ url: urlObject.url })
        .then(dbUrlObject => {
          if (dbUrlObject.length === 1) {
            urlObject = {
              url: urlObject.url,
              refernceCount: dbUrlObject[0].refernceCount + urlObject.refernceCount,
              paramList: _.uniq(dbUrlObject[0].paramList.concat(urlObject.paramList))
            }
            urlModel.updateOne(urlObject, function (err) {
              if (err) {
                return console.error('Error ocurred while Updating document in mongdb: ' + err);
              } else {
                console.log("Documnet updated successfully");
              }
            });
          } else {
            urlModel.create(urlObject, function (err) {
              if (err) {
                return console.error('Error ocurred while inserting document in mongdb: ' + err);
              } else {
                console.log("Document inerted successfully");
              }
            });
            scrapeMedium(urlObject.url)
          }
        })
    })
  });
}

module.exports = {
  scrapeMedium: scrapeMedium
}
/**
 * Created by calvin on 10/29/15.
 */

var co = require('co');
var _ = require('underscore');
var corequest = require('co-request');
var util = require('util');

var config = require('./config');
var db = require('./db');
var parser = require('./parsehtml');

var isTagIdDone = {};
var startTagId = 1;
var endTagId = 70395500; // you can binary search the max id when you encounter it
var count = 0;


co(function* () {
    var tagIds = yield db.getNiceTagIds();
    count = tagIds.length;
    console.info('tags in db, count = ' + tagIds.length);
    _.each(tagIds, function(tagId) {isTagIdDone[tagId] = true});

    var processList = [];
    console.info(config.concurrent);
    _.times(config.concurrent, function() {
        var tagId = getNextTagId();
        co(function* () {
            yield processTagId(tagId);
        }).catch(function (err) {
            console.error(err.stack);
        });
    });

    yield processList;
}).catch(function(err) {
    console.error(err.stack);
});


function* processTagId(tagId) {
    // get the html, parse it, save to mongodb
    var parsedObj = yield getTag(tagId);
    if (parsedObj) {
        yield db.addTag(parsedObj);
    }
    // success, add the count
    count += 1;
    console.info('done processing id: ' + tagId, 'status:', count, '/', endTagId, 'tagName: ', parsedObj.tag);
    return co(function* () {
        yield processTagId(getNextTagId());
    });

}


function getNextTagId() {
    while (isTagIdDone[startTagId]) {
        startTagId++;
    }

    //stop
    if (startTagId > endTagId) {
        return 0;
    }

    var returnTagId = startTagId;
    startTagId++;
    while (isTagIdDone[startTagId]) {
        startTagId++;
    }
    return returnTagId;
}

function* getTag(tagId) {
    var tagUrl = config.url.tag;
    tagUrl = util.format(tagUrl, tagId);
    var html = yield getHtml(tagUrl);
    var parsedObj = parser.parseTagPage(html);
    if (parsedObj && parsedObj.tag) {
        parsedObj.niceId = tagId;
        return parsedObj;
    }
}

function *getHtml(url) {
    //console.info(url);
    var result = yield corequest(url);
    return result.body;
}
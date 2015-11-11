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
var startTagId = 35288717;
var endTagId = 70395500; // you can binary search the max id when you encounter it
var count = 0;

var dnscache = require('dnscache')({
        "enable" : true,
        "ttl" : 300,
        "cachesize" : 1000
    });


co(function* () {
    //var tagIds = yield db.getNiceTagIds();
    count = startTagId-1;//tagIds.length;
    console.info('tags in db, count = ' + count);
    //_.each(tagIds, function(tagId) {isTagIdDone[tagId] = true});

    console.info(config.concurrent);
    _.times(config.concurrent, function() {
        co(function* () {
            var tagId = getNextTagId();
            console.info(tagId);
            while (tagId) {
                yield processTagId(tagId);
                tagId = getNextTagId();
            }
        }).catch(function (err) {
            console.error(err.stack);
        });
    });
}).catch(function(err) {
    console.error(err.stack);
    process.exit();
});


function* processTagId(tagId) {
    // get the html, parse it, save to mongodb
    try {
        var parsedObj = yield getTag(tagId);
        if (parsedObj) {
            yield db.addTag(parsedObj);
            // success, add the count
            count += 1;
            console.info('done processing id: ' + tagId, 'status:', count, '/', endTagId, 'tagName: ', parsedObj.tag);
        }
    } catch(e) {
        console.error(e.stack);
    }
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

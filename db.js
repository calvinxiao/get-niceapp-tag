/**
 * Created by calvin on 10/29/15.
 */

var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config');

module.exports = {
    getNiceTagIds: getNiceTagIds,
    addTag: addTag
};

var cacheDb = null;
function getDb() {
    if (cacheDb) {
        return Promise.resolve(cacheDb);
    }

    return MongoClient.connect(config.dbConnectionUrl).then(function(db) {
        cacheDb = db;
        return db;
    });
}

function *getNiceTagIds() {
    var db = yield getDb();
    var collection = db.collection(config.collections.niceTag);
    var tagList = yield collection.find({}).project({_id:0, niceId:1}).toArray();
    return _.map(tagList, function(tag) {
        return tag.niceId
    });
}

function* addTag(tagObj) {
    var db = yield getDb();
    var collection = db.collection(config.collections.niceTag);
    yield collection.insertOne(tagObj);
}

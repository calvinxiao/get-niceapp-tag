/**
 * Parse page from oneniceapp.com
 * Created by calvin on 10/29/15.
 */

var cheerio = require('cheerio');

module.exports = {
    parseTagPage: parseTagPage
};

/**
 * parse this page
 * @param html, string of html
 * @return {tag: '', photoCount, shareCount}
 */
function parseTagPage(html) {
    //console.log(html);
    var returnData = {
        tag: '',
        photoCount: 0,
        shareCount: 0,
    };
    $ = cheerio.load(html);
    returnData.tag = $('.basic-info .name').text();
    var num = $('.num');
    if (num.length > 0) {
        returnData.photoCount = parseInt($(num[0]).text(), 10);
    }

    if (num.length > 1) {
        returnData.shareCount = parseInt($(num[1]).text(), 10);
    }

    //console.log(returnData);
    return returnData;
}
var Stat = require("content/stat").Stat,
    statApi = require("./stat");

function GET(request){
    // list available tests
    return {
        json: Stat.all().fetch().map(function(stat){
            return {
                uri:           "/api/stat/?key=" + stat.key(),
                parent:        "/api/unit/?key=" + stat.parent.key(),
                timestamp:     stat.timestamp,
                userAgent:     stat.userAgent,
                browser:       stat.browser,
                version:       stat.version,
                repetitions:   stat.repetitions,
                length:        stat.length,
                average:       stat.average,
                minimum:       stat.minimum,
                maximum:       stat.maximum,
                median:        stat.median,
                lowerQuartile: stat.lowerQuartile,
                upperQuartile: stat.upperQuartile,
                firstDecile:   stat.firstDecile,
                lastDecile:    stat.lastDecile
            };
        })
    };
}

exports.GET  = GET;
exports.POST = statApi.POST;

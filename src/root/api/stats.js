var Test = require("content/models").Test,
    Group = require("content/models").Group,
    Unit = require("content/models").Unit,
    Stat = require("content/models").Stat,
    toJson = require("utils"),
    getItems = require("utils").getItems,
    statApi = require("./stat");

function GET(request){
    var rsp = getItems(request.queryParams.unit, Unit, "getStats");
    if(rsp){ return rsp; }
    rsp = getItems(request.queryParams.group, Group, "getStats");
    if(rsp){ return rsp; }
    rsp = getItems(request.queryParams.test, Test, "getStats");
    if(rsp){ return rsp; }
    // list available stats
    return {
        json: Stat.all().fetch().map(toJson)
    };
}

exports.GET  = GET;
exports.POST = statApi.POST;

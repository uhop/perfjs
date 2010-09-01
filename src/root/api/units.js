var Test = require("content/models").Test,
    Group = require("content/models").Group,
    Unit = require("content/models").Unit,
    toJson = require("utils"),
    getItems = require("utils").getItems,
    unitApi = require("./unit");

function GET(request){
    var rsp = getItems(request.queryParams.group, Group, "getUnits");
    if(rsp){ return rsp; }
    rsp = getItems(request.queryParams.test, Test, "getUnits");
    if(rsp){ return rsp; }
	// list available units
	return {
		json: Unit.all().fetch().map(toJson)
	};
}

exports.GET  = GET;
exports.POST = unitApi.POST;

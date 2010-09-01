var Test = require("content/models").Test,
    Group = require("content/models").Group,
    toJson = require("utils"),
    getItems = require("utils").getItems,
    groupApi = require("./group");

function GET(request){
    var rsp = getItems(request.queryParams.test, Test, "getGroups");
    if(rsp){ return rsp; }
	// list available groups
	return {
		json: Group.all().fetch().map(toJson)
	};
}

exports.GET  = GET;
exports.POST = groupApi.POST;

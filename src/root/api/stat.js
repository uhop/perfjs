var Response = require("nitro/response").Response,
    users = require("google/appengine/api/users"),
    allowedUser = require("utils").allowedUser,
	decorators = require("decorators"),
    utils = require("utils");

var Stat = require("content/models").Stat,
    Form = require("google/appengine/ext/db/forms").ModelForm(Stat);

var GET = utils.standardGet(Stat);

function POST(request){
    var user = users.getCurrentUser(),
        stat = new Stat();
    stat.userId = user && user.userId || "";
    var form = new Form(request.postParams, {instance: stat});
    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return {json: {uri: stat.uri()}};
}

function PUT(request){
    var stat = Stat.get(request.pathInfo);

    if(!stat){
        return Response.notFound();
    }
    if(!allowedUser(stat.userId)){
        return Response.unauthorized();
    }

    var form = new Form(request.postParams, {instance: stat});

    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return {json: {uri: stat.uri()}};
}

function DELETE(request){
    var stat = Stat.get(request.pathInfo);
    if(!stat){
        return Response.notFound();
    }
    if(!allowedUser(stat.userId)){
        return Response.unauthorized();
    }
    stat.remove();
    return Response.ok();
}

exports.GET    = GET;
exports.POST   = POST;
exports.PUT    = decorators.onlyForRegisteredUsers(PUT);
exports.DELETE = decorators.onlyForRegisteredUsers(DELETE);

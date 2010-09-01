var Response = require("nitro/response").Response,
    users = require("google/appengine/api/users"),
    allowedUser = require("utils").allowedUser,
	decorators = require("decorators"),
    utils = require("utils");

var Unit = require("content/models").Unit,
    Form = require("google/appengine/ext/db/forms").ModelForm(Unit);

var GET = utils.standardGet(Unit);

function POST(request){
    var unit = new Unit();
    unit.userId = users.getCurrentUser().userId;
    var form = new Form(request.postParams, {instance: unit});
    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return {json: {uri: unit.uri()}};
}

function PUT(request){
    var unit = Unit.get(request.pathInfo);

    if(!unit){
        return Response.notFound();
    }
    if(!allowedUser(unit.userId)){
        return Response.unauthorized();
    }

    var form = new Form(request.postParams, {instance: unit});

    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return {json: {uri: unit.uri()}};
}

function DELETE(request){
    var unit = Unit.get(request.pathInfo);
    if(!unit){
        return Response.notFound();
    }
    if(!allowedUser(unit.userId)){
        return Response.unauthorized();
    }
    unit.remove();
    return Response.ok();
}

exports.GET    = GET;
exports.POST   = decorators.onlyForRegisteredUsers(POST);
exports.PUT    = decorators.onlyForRegisteredUsers(PUT);
exports.DELETE = decorators.onlyForRegisteredUsers(DELETE);

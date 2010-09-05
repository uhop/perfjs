var Response = require("nitro/response").Response,
    users = require("google/appengine/api/users"),
    allowedUser = require("utils").allowedUser,
	decorators = require("decorators"),
    utils = require("utils");

var Group = require("content/models").Group,
    Form = require("google/appengine/ext/db/forms").ModelForm(Group);

var GET = utils.standardGet(Group);

function POST(request){
    var group = new Group();
    group.userId = users.getCurrentUser().userId;
    var form = new Form(request.postParams, {instance: group});
    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return Response.created(group.uri());
}

function PUT(request){
    var group = Group.get(request.pathInfo);

    if(!group){
        return Response.notFound();
    }
    if(!allowedUser(group.userId)){
        return Response.unauthorized();
    }

    var form = new Form(request.postParams, {instance: group});

    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return {json: {uri: group.uri()}};
}

function DELETE(request){
    var group = Group.get(request.pathInfo);
    if(!group){
        return Response.notFound();
    }
    if(!allowedUser(group.userId)){
        return Response.unauthorized();
    }
    group.remove();
    return Response.ok();
}

exports.GET    = GET;
exports.POST   = decorators.onlyForRegisteredUsers(POST);
exports.PUT    = decorators.onlyForRegisteredUsers(PUT);
exports.DELETE = decorators.onlyForRegisteredUsers(DELETE);

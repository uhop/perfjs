var Response = require("nitro/response").Response,
    users = require("google/appengine/api/users"),
    allowedUser = require("utils").allowedUser,
	decorators = require("decorators"),
    utils = require("utils");

var Test = require("content/models").Test,
    Form = require("google/appengine/ext/db/forms").ModelForm(Test);

var GET = utils.standardGet(Test);

function testAndCreate(request){
    var slug = request.postParams.slug,
        dups = Test.all().filter("slug =", slug).fetch();
    if(dups.length){
        throw Error("slug is not unique");
    }
    var test = new Test(),
        user = users.getCurrentUser();
    test.userId = user.userId;
    test.userName = user.nickname;
    var form = new Form(request.postParams, {instance: test});
    form.put();
    return test;
}

function POST(request){
    try{
        var test = db.runInTransaction(testAndCreate, request);
    }catch (errors){
        return {json: {errors: errors}};
    }
    return Response.created(test.uri());
}

function PUT(request){
    var test = Test.get(request.pathInfo);

    if(!test){
        return Response.notFound();
    }
    if(!allowedUser(test.userId)){
        return Response.unauthorized();
    }

    var form = new Form(request.postParams, {instance: test});
    try{
        form.put();
    }catch (errors){
        return {json: {errors: errors}};
    }
    return {json: {uri: test.uri()}};
}

function DELETE(request){
    var test = Test.get(request.pathInfo);
    if(!test){
        return Response.notFound();
    }
    if(!allowedUser(test.userId)){
        return Response.unauthorized();
    }
    test.remove();
    return Response.ok();
}

exports.GET    = GET;
exports.POST   = decorators.onlyForRegisteredUsers(POST);
exports.PUT    = decorators.onlyForRegisteredUsers(PUT);
exports.DELETE = decorators.onlyForRegisteredUsers(DELETE);

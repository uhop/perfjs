var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response;

var TestGroup = require("content/test_group").TestGroup,
    Form = require("google/appengine/ext/db/forms").ModelForm(TestGroup),
	TestUnit = require("content/test_unit").TestUnit,
	StatUnit = require("content/stat_unit").StatUnit;

exports.GET = function(request){
    var params = request.params;

	if(params.key){
		var testGroup = TestGroup.get(params.key);
		if(!testGroup){
			return Response.notFound();
		}
		return Response.json({
			uri:    "/test_groups/?key=" + testGroup.key(),
			parent: "/tests/?key=" + testGroup.parent.key(),
			title:  testGroup.title
		});
	}

	// list available tests
	return Response.json(TestGroup.all().fetch().map(function(testGroup){
		return {
			uri:    "/test_groups/?key=" + testGroup.key(),
			parent: "/tests/?key=" + testGroup.parent.key(),
			title:  testGroup.title
		};
	}));
}

exports.POST = function(env){
    var params = new Request(env).params,
        testGroup = params.key ? TestGroup.get(params.key) : new TestGroup();

    var form = new Form(params, {instance: testGroup});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return Response.json({uri: "/test_groups/?key=" + testGroup.key()});
}

exports.DELETE = function(env){
    var params = new Request(env).params,
        testGroup = TestGroup.get(params.key);

    if(testGroup){
		TestUnit.all().filter("parent =", testGroup.key()).fetch().forEach(function(testUnit){
			StatUnit.all().filter("parent =", testUnit.key()).fetch().forEach(function(statUnit){
				statUnit.remove();
			});
			testUnit.remove();
		});
        testGroup.remove();
        return Response.ok();
    }
    return Response.notFound();
}

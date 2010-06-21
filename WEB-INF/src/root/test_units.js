var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response;

var TestUnit = require("content/test_unit").TestUnit,
    Form = require("google/appengine/ext/db/forms").ModelForm(TestUnit),
	StatUnit = require("content/stat_unit").StatUnit;

exports.GET = function(request){
    var params = request.params;

	if(params.key){
		var testUnit = TestUnit.get(params.key);
		if(!testUnit){
			return Response.notFound();
		}
		return Response.json({
			uri:    "/test_units/?key=" + testUnit.key(),
			parent: "/test_groups/?key=" + testUnit.parent.key(),
			title:  testUnit.title,
			code:   testUnit.code
		});
	}

	// list available tests
	return Response.json(TestUnit.all().fetch().map(function(testUnit){
		return {
			uri:    "/test_units/?key=" + testUnit.key(),
			parent: "/test_groups/?key=" + testUnit.parent.key(),
			title:  testUnit.title,
			code:   testUnit.code
		};
	}));
}

exports.POST = function(env){
    var params = new Request(env).params,
        testUnit = params.key ? TestUnit.get(params.key) : new TestUnit();

    var form = new Form(params, {instance: testUnit});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return Response.json({uri: "/test_units/?key=" + testUnit.key()});
}

exports.DELETE = function(env){
    var params = new Request(env).params,
        testUnit = TestUnit.get(params.key);

    if(testUnit){
		StatUnit.all().filter("parent =", testUnit.key()).fetch().forEach(function(statUnit){
			statUnit.remove();
		});
        testUnit.remove();
        return Response.ok();
    }
    return Response.notFound();
}

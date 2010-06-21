var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response;

var Test = require("content/test").Test,
    Form = require("google/appengine/ext/db/forms").ModelForm(Test),
	TestGroup = require("content/test_group").TestGroup,
	TestUnit = require("content/test_unit").TestUnit,
	StatUnit = require("content/stat_unit").StatUnit;

exports.GET = function(request){
    var params = request.params;

	if(params.key){
		var test = Test.get(params.key);
		if(!test){
			return Response.notFound();
		}
		return Response.json({
			uri: "/tests/?key=" + test.key(),
			title: test.title
		});
	}

	// list available tests
	var tests = Test.all().fetch();
	return Response.json(tests.map(function(test){
		return {
			uri: "/tests/?key=" + test.key(),
			title: test.title
		};
	}));
}

exports.POST = function(env){
    var params = new Request(env).params,
        test = params.key ? Test.get(params.key) : new Test();

    var form = new Form(params, {instance: test});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return Response.json({uri: "/tests/?key=" + test.key()});
}

exports.DELETE = function(env){
    var params = new Request(env).params,
        test = Test.get(params.key);

    if(test){
		TestGroup.all().filter("parent =", test.key()).fetch().forEach(function(testGroup){
			TestUnit.all().filter("parent =", testGroup.key()).fetch().forEach(function(testUnit){
				StatUnit.all().filter("parent =", testUnit.key()).fetch().forEach(function(statUnit){
					statUnit.remove();
				});
				testUnit.remove();
			});
			testGroup.remove();
		});
        test.remove();
        return Response.ok();
    }
    return Response.notFound();
}

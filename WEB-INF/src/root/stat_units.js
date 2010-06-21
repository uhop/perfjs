var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response;

var StatUnit = require("content/stat_unit").StatUnit,
    Form = require("google/appengine/ext/db/forms").ModelForm(StatUnit);

exports.GET = function(request){
    var params = request.params;

	if(params.key){
		var statUnit = StatUnit.get(params.key);
		if(!statUnit){
			return Response.notFound();
		}
		return Response.json({
			uri:           "/stat_units/?key=" + statUnit.key(),
			parent:        "/test_units/?key=" + statUnit.parent.key(),
			timestamp:     statUnit.timestamp,
			userAgent:     statUnit.userAgent,
			browser:       statUnit.browser,
			version:       statUnit.version,
			repetitions:   statUnit.repetitions,
			length:        statUnit.length,
			average:       statUnit.average,
			minimum:       statUnit.minimum,
			maximum:       statUnit.maximum,
			median:        statUnit.median,
			lowerQuartile: statUnit.lowerQuartile,
			upperQuartile: statUnit.upperQuartile,
			firstDecile:   statUnit.firstDecile,
			lastDecile:    statUnit.lastDecile
		});
	}

	// list available tests
	return Response.json(StatUnit.all().fetch().map(function(statUnit){
		return {
			uri:           "/stat_units/?key=" + statUnit.key(),
			parent:        "/test_units/?key=" + statUnit.parent.key(),
			timestamp:     statUnit.timestamp,
			userAgent:     statUnit.userAgent,
			browser:       statUnit.browser,
			version:       statUnit.version,
			repetitions:   statUnit.repetitions,
			length:        statUnit.length,
			average:       statUnit.average,
			minimum:       statUnit.minimum,
			maximum:       statUnit.maximum,
			median:        statUnit.median,
			lowerQuartile: statUnit.lowerQuartile,
			upperQuartile: statUnit.upperQuartile,
			firstDecile:   statUnit.firstDecile,
			lastDecile:    statUnit.lastDecile
		};
	}));
}

exports.POST = function(env){
    var params = new Request(env).params,
        statUnit = params.key ? StatUnit.get(params.key) : new StatUnit();

    var form = new Form(params, {instance: statUnit});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return Response.json({uri: "/stat_units/?key=" + statUnit.key()});
}

exports.DELETE = function(env){
    var params = new Request(env).params,
        statUnit = StatUnit.get(params.key);

    if(statUnit){
        statUnit.remove();
        return Response.ok();
    }
    return Response.notFound();
}

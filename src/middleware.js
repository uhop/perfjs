var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response;

exports.Json = exports.middleware = function(app){
    return function (env) {
	    var callback = new Request(env).params.callback;

        var response = app(env);

        if(response.json){
			if(callback){
				return Response.jsonp(response.json, callback);
			}
			return Response.json(response.json);
        }

        return response;
    }
}

var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response,
	users = require("google/appengine/api/users");

exports.Json = function(app){
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
};

exports.AddUser = function(app){
    return function (env) {
		var user = users.getCurrentUser(), path;
		if(!user){
			path = new Request(env).path;
		}
		
        var response = app(env);

        if(response.data && !("user" in response.data)){
			if(user){
				response.data.user = {
					isAdmin:    users.isCurrentUserAdmin(),
					nickname:   user.nickname,
					logout_uri: users.createLogoutURL("/")
				};
			}else{
				response.data.user = {
					login_uri: users.createLoginURL(path)
				};
			}
        }

        return response;
    }
};

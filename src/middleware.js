var Response = require("nitro/response").Response,
	users = require("google/appengine/api/users");

exports.Json = function(app){
    return function (request) {
        var response = app(request);

        if(response.json){
            var callback = request.params.callback;
			if(callback){
				return Response.jsonp(response.json, callback);
			}
			return Response.json(response.json);
        }

        return response;
    }
};

exports.AddUser = function(app){
    return function (request) {
        var response = app(request);

		var user = users.getCurrentUser(), path;
		if(!user){
			path = request.path;
		}
		
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

function getMiddleware(item){
    if(Object.prototype.toString.call(item) == "[object Array]"){
        var args = item.slice(1);
        item = item[0];
        return function(){
            return item.apply(null, Array.prototype.slice.call(arguments, 0).concat(args));
        }
    }
    return item;
}

exports.Combine = function(list){
    var len = list.length;

    // the unlikely corner case: no middleware
    if(len == 0){
        return function(app){ return app; };
    }

    // iterate backwards invoking middleware
    var item = getMiddleware(list[len - 1])();
    for(var i = len - 2; i >= 0; --i){
        item = getMiddleware(list[i])(item);
    }

    return item;
};
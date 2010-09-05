var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response;

exports.JsonAgg = exports.middleware = function (app, options) {

    var serviceRoot = options && options.serviceRoot || "/json-agg";

    return function (request) {

        // bypass all normal requests
        if (request.pathInfo !== serviceRoot) {
            return app(request);
        }

        // process JSON Aggregator request
        if (request.method !== "GET"){
            // we do not support non-GET requests
            return {status: 501, headers: {}, body: ["501 Not Implemented"]};
        }

        var headers, results,
            query = request.queryParams,
            t = query.t || "j";

        if (!query.q) {
            // empty request
            if (t == "j") {
                return query.c ?
                      Response.jsonp({status: 200, result: []}, query.c) :
                      Response.json({status: 200, result: []});
            }
            return {status: 200, headers: {}, body: [""]};
        }

        var responses = (Array.isArray(query.q) ? query.q : [query.q]).map(function (q) {

            var path = q, query = "", idx = q.indexOf("?");

            if (idx >= 0) {
                path = q.slice(0, idx);
                query = q.slice(idx + 1);
            }

            delete request.path;    // this is a hack to pretend that the response is not extended yet

            request.pathInfo = path;
            request.queryString = query;

            new Request(request);   // extend the request

            return app(request);
        });

        if (!responses.every(function (r) { return r.status != 200; })) {
            return {status: 400, headers: {}, body: ["400 Bad Request"]};
        }

        if (t == "j") {
            if (!responses.every(function (r) { return r.status != 200 || r.headers["Content-Type"] == "application/json"; })) {
                return {status: 409, headers: {}, body: ["409 Conflict"]};
            }

            results = responses.map(function (r) {
                if (r.status != 200) {
                    return "null";
                }
                if (!headers) {
                    headers = r.headers;
                }
                return r.body.join("");
            });

            var result = '{"status":200,"result":[' + result.join(",") + "]}";
            if (query.c) {
                result = query.c + "(" + result + ")";
            }

            return {status: 200, headers: headers, body: [result]};
        }

        // t == "t"
        var contentType;
        function theSameContentType(r) {
            if (r.status != 200) { return true; }
            if (!contentType) {
                contentType = r.headers["Content-Type"] || "text/html";
                return true;
            }
            return r.headers["Content-Type"] == contentType;
        }
        if (!responses.every(theSameContentType)) {
            return {status: 409, headers: {}, body: ["409 Conflict"]};
        }

        results = responses.map(function (r) {
            if (r.status != 200) {
                return "";
            }
            if (!headers) {
                headers = r.headers;
            }
            return r.body.join("");
        });

        return {status: 200, headers: headers, body: results};
    };
};

var Combine = require("middleware").Combine;

function getNitroMiddleware(name){
    return require("nitro/middleware/" + name).middleware;
}

exports.app = Combine([
    getNitroMiddleware("setup"),
    getNitroMiddleware("path"),
    getNitroMiddleware("errors"),
    [getNitroMiddleware("render"), {templateRoot: "src/templates"}],
    require("./middleware").AddUser,
    require("./middleware").Json,
    [getNitroMiddleware("dispatch"), {dispatchRoot: "src/root"}]
]);

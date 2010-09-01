var makeStack = require("middleware").makeStack;

function getNitroMiddleware(name){
    return require("nitro/middleware/" + name).middleware;
}

exports.app = makeStack([
    getNitroMiddleware("setup"),
    getNitroMiddleware("path"),
    getNitroMiddleware("errors"),
    [getNitroMiddleware("render"), {templateRoot: "src/templates"}],
    require("./middleware").AddUser,
    require("./middleware").Json,
    [getNitroMiddleware("dispatch"), {dispatchRoot: "src/root"}]
]);

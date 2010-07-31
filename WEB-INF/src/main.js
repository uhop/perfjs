var Setup = require("nitro/middleware/setup").Setup,
    Path = require("nitro/middleware/path").Path,
    Errors = require("nitro/middleware/errors").Errors,
    Render = require("nitro/middleware/render").Render,
    Dispatch = require("nitro/middleware/dispatch").Dispatch,
	Json = require("middleware").Json;

exports.app = Setup(Path(Errors(Render(Json(Dispatch({dispatchRoot: "WEB-INF/src/root"})), {templateRoot: "WEB-INF/src/templates"}))));

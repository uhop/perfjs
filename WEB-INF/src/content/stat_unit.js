var DB = require("google/appengine/ext/db"),
	TestUnit = require("./test_unit").TestUnit;

var StatUnit = exports.StatUnit = DB.Model("StatUnit", {
    parent:    new DB.ReferenceProperty({referenceClass: TestUnit}),
	timestamp: new DB.DateTimeProperty({required: true}),
	// browser UA string, and sniffed browser/version
	userAgent: new DB.StringProperty({required: true, multiline: false}),
	browser:   new DB.StringProperty({required: true, multiline: false}),
	version:   new DB.FloatProperty({required: true}),
	// statistics
	repetitions:   new DB.IntegerProperty({required: true}),
	length:        new DB.IntegerProperty({required: true}),
	average:       new DB.FloatProperty({required: true}),
	// the five-number summary
	minimum:       new DB.FloatProperty({required: true}),
	maximum:       new DB.FloatProperty({required: true}),
	median:        new DB.FloatProperty({required: true}),
	lowerQuartile: new DB.FloatProperty({required: true}),
	upperQuartile: new DB.FloatProperty({required: true}),
	// extended to the Bowley's seven-figure summary
	firstDecile:   new DB.FloatProperty({required: true}),
	lastDecile:    new DB.FloatProperty({required: true})
});

StatUnit.prototype.toString = function(){
    return this.median + " (" + this.browser + " " + this.version + ")";
}

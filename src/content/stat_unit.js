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
};

StatUnit.prototype.api_uri = function(){
	return "/api/stat_units/?key=" + this.key();
};

StatUnit.prototype.view_uri = function(){
	return "/view/stat_unit/?key=" + this.key();
};

StatUnit.prototype.edit_uri = function(){
	return "/admin/stat_unit/?key=" + this.key();
};

// augment TestGroup

var oldRemove = TestUnit.prototype.remove;
TestUnit.prototype.remove = function(){
	StatUnit.all().filter("parent =", this.key()).fetch().forEach(function(statUnit){
		statUnit.remove();
	});
	oldRemove.call(this);
};

TestUnit.prototype.removeStats = function(){
	StatUnit.all().filter("parent =", this.key()).fetch().forEach(function(statUnit){
		statUnit.remove();
	});
};

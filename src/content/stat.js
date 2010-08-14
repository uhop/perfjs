var DB = require("google/appengine/ext/db"),
	Unit = require("./unit").Unit;

var Stat = exports.Stat = DB.Model("Stat", {
        parent:    new DB.ReferenceProperty({referenceClass: Unit}),
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

Stat.prototype.toString = function(){
    return this.median + " (" + this.browser + " " + this.version + ")";
};

Stat.prototype.api_uri = function(){
	return "/api/stat_units/?key=" + this.key();
};

Stat.prototype.view_uri = function(){
	return "/view/stat_unit/?key=" + this.key();
};

Stat.prototype.edit_uri = function(){
	return "/admin/stat_unit/?key=" + this.key();
};

// augment Unit

var oldRemove = Unit.prototype.remove;
Unit.prototype.remove = function(){
	Stat.all().filter("parent =", this.key()).fetch().forEach(function(stat){
		stat.remove();
	});
	oldRemove.call(this);
};

Unit.prototype.removeStats = function(){
	Stat.all().filter("parent =", this.key()).fetch().forEach(function(stat){
		stat.remove();
	});
};

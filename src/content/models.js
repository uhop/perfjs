var DB = require("google/appengine/ext/db");


var Test = exports.Test = DB.Model("Test", {
        slug:          new DB.StringProperty({required: true, multiline: false}),
        title:         new DB.StringProperty({required: true, multiline: false}),
        description:   new DB.TextProperty(),
        published:     new DB.BooleanProperty({required: true, defaultValue: false}),
        userName:      new DB.StringProperty({required: true, multiline: false}),
        // housekeeping
        userId:        new DB.StringProperty({multiline: false})
    });

var Group = exports.Group = DB.Model("Group", {
        title:         new DB.StringProperty({required: true, multiline: false}),
        description:   new DB.TextProperty(),
        // housekeeping
        test:          new DB.ReferenceProperty({required: true, referenceClass: Test}),
        userId:        new DB.StringProperty({multiline: false})
    });

var Unit = exports.Unit = DB.Model("Unit", {
        title:         new DB.StringProperty({required: true, multiline: false}),
        description:   new DB.TextProperty(),
        code:          new DB.TextProperty({required: true}),
        head:          new DB.TextProperty(),
        startup:       new DB.TextProperty(),
        teardown:      new DB.TextProperty(),
        // housekeeping
        test:          new DB.ReferenceProperty({required: true, referenceClass: Test}),
        group:         new DB.ReferenceProperty({required: true, referenceClass: Group}),
        userId:        new DB.StringProperty({multiline: false})
    });

var Stat = exports.Stat = DB.Model("Stat", {
        timestamp:     new DB.DateTimeProperty({required: true}),
        // browser UA string, and sniffed browser/version
        userAgent:     new DB.StringProperty({required: true, multiline: false}),
        browser:       new DB.StringProperty({required: true, multiline: false}),
        version:       new DB.FloatProperty({required: true}),
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
        lastDecile:    new DB.FloatProperty({required: true}),
        // housekeeping
        test:          new DB.ReferenceProperty({required: true, referenceClass: Test}),
        group:         new DB.ReferenceProperty({required: true, referenceClass: Group}),
        unit:          new DB.ReferenceProperty({required: true, referenceClass: Unit}),
        userId:        new DB.StringProperty({multiline: false})
    });


// Test's methods

Test.prototype.toString = function(){
    return this.title;
};

Test.prototype.uri = function(){
	return "/api/test/" + this.key();
};

Test.prototype.publicUri = function(){
	return "/test/" + this.slug;
};

Test.prototype.toJson = function(){
    return {
        key:         this.key(),
        uri:         this.uri(),
        title:       this.title,
        description: this.description,
        published:   this.published,
        userName:    this.userName,
        publicUri:   this.publicUri()
    };
};

Test.prototype.remove = function(){
    // removes an object with all dependencies
    // using DELETE to avoid cascading
    this.getStats().forEach(function(o){ o.DELETE(); });
    this.getUnits().forEach(function(o){ o.DELETE(); });
    this.getGroups().forEach(function(o){ o.DELETE(); });
	this.DELETE();
};

Test.prototype.removeGroups = function(){
	this.getGroups().forEach(function(o){ o.remove(); });
};

Test.prototype.removeUnits = function(){
	this.getUnits().forEach(function(o){ o.remove(); });
};

Test.prototype.removeStats = function(){
	this.getStats().forEach(function(o){ o.remove(); });
};

Test.prototype.getGroups = function(){
	return Group.all().filter("test =", this.key()).fetch();
};

Test.prototype.getUnits = function () {
    return Unit.all().filter("test =", this.key()).fetch();
};

Test.prototype.getStats = function () {
    return Stat.all().filter("test =", this.key()).fetch();
};


// Group's methods

Group.prototype.toString = function(){
    return this.title;
};

Group.prototype.uri = function(){
	return "/api/group/" + this.key();
};

Group.prototype.toJson = function(){
    return {
        key:         this.key(),
        uri:         this.uri(),
        test:        this.test.uri(),
        title:       this.title,
        description: this.description
    };
};

Group.prototype.remove = function(){
    // removes an object with all dependencies
    // using DELETE to avoid cascading
    this.getStats().forEach(function(o){ o.DELETE(); });
    this.getUnits().forEach(function(o){ o.DELETE(); });
	this.DELETE();
};

Group.prototype.removeUnits = function(){
	this.getUnits().forEach(function(o){ o.remove(); });
};

Group.prototype.removeStats = function(){
	this.getStats().forEach(function(o){ o.remove(); });
};

Group.prototype.getUnits = function () {
    return Unit.all().filter("group =", this.key()).fetch();
};

Group.prototype.getStats = function () {
    return Stat.all().filter("group =", this.key()).fetch();
};


// Unit's methods

Unit.prototype.toString = function(){
    return this.title;
};

Unit.prototype.uri = function(){
	return "/api/unit/" + this.key();
};

Unit.prototype.toJson = function(){
    return {
        key:         this.key(),
        uri:         this.uri(),
        test:        this.test.uri(),
        group:       this.group.uri(),
        title:       this.title,
        description: this.description,
        code:        this.code,
        head:        this.head,
        startup:     this.startup,
        teardown:    this.teardown
    };
};

Unit.prototype.remove = function(){
    // removes an object with all dependencies
    // using DELETE to avoid cascading
	this.DELETE();
};

Unit.prototype.removeStats = function(){
	this.getStats().forEach(function(o){ o.remove(); });
};

Unit.prototype.getStats = function () {
    return Stat.all().filter("unit =", this.key()).fetch();
};


// Stat's methods

Stat.prototype.toString = function(){
    return this.median + " (" + this.browser + " " + this.version + ")";
};

Stat.prototype.uri = function(){
	return "/api/stat/" + this.key();
};

Stat.prototype.toJson = function(){
    return {
        key:           this.key(),
        uri:           this.uri(),
        test:          this.test.uri(),
        group:         this.group.uri(),
        unit:          this.unit.uri(),
        timestamp:     this.timestamp,
        userAgent:     this.userAgent,
        browser:       this.browser,
        version:       this.version,
        repetitions:   this.repetitions,
        length:        this.length,
        average:       this.average,
        minimum:       this.minimum,
        maximum:       this.maximum,
        median:        this.median,
        lowerQuartile: this.lowerQuartile,
        upperQuartile: this.upperQuartile,
        firstDecile:   this.firstDecile,
        lastDecile:    this.lastDecile
    };
};

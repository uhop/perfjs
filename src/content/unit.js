var DB = require("google/appengine/ext/db"),
	Group = require("./group").Group;

var Unit = exports.Unit = DB.Model("Unit", {
        title:       new DB.StringProperty({required: true, multiline: false}),
        description: new DB.TextProperty(),
        parent:      new DB.ReferenceProperty({referenceClass: Group}),
        code:        new DB.TextProperty({required: true}),
        includes:    new DB.TextProperty()
    });

Unit.prototype.toString = function(){
    return this.title;
};

Unit.prototype.api_uri = function(){
	return "/api/unit/?key=" + this.key();
};

Unit.prototype.view_uri = function(){
	return "/view/unit/?key=" + this.key();
};

Unit.prototype.edit_uri = function(){
	return "/admin/unit/?key=" + this.key();
};


// augment Group

var oldRemove = Group.prototype.remove;
Group.prototype.remove = function(){
	Unit.all().filter("parent =", this.key()).fetch().forEach(function(unit){
		unit.remove();
	});
	oldRemove.call(this);
};

Group.prototype.removeStats = function(){
	Unit.all().filter("parent =", this.key()).fetch().forEach(function(unit){
		unit.removeStats();
	});
};

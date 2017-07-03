/*
 * Simulated in-memory database
 */

var self = module.exports,
	utils = require('./utils'),
	tables = {};

/*
 * Reset by removing all tables
 */
self.reset = function () {
	tables = {};
};

/*
 * Creates a new object (row in a table)
 * It creates the table, if it does not already exist
 */
self.createObject = function (object) {
	var className = object.getClass().name;
	if(!tables[className]) {
		tables[className] = {
			name: className,
			nextId: 1,
			rows: {}
		};
	}
	object.id = tables[className].nextId++;
	tables[className].rows[object.id] = object;
	dumpToTextFile();
};

function dumpToTextFile () {
	utils.writeFile('./storage.json', JSON.stringify(tables, null, 4));
}

/*
 * Saves an object (row in a table)
 */
self.saveObject = function (object) {
	var className = object.getClass().name;
	if(!tables[className]) throw new Error('Non existant class ' + className);
	if(!tables[className].rows[object.id]) throw new Error('Object with id ' + object.id + ' does not exist');
	tables[className].rows[object.id] = object;
	dumpToTextFile();
};

/*
 * Get an object by id from a table
 */
self.getById = function (className, id) {
	if(!tables[className]) throw new Error('Non existant class ' + className);
	return tables[className].rows[id];
};

/*
 * Return all rows matching the filter
 */
self.filter = function (className, filterFunction) {
	if(!tables[className]) throw new Error('Non existant class ' + className);
	var result = [], row;
	for(var id in tables[className].rows) {
		row = tables[className].rows[id];
		if(filterFunction(row)) result.push(row);
	}
	return result;
};

/*
 * Iterate through all objects
 */
self.iterate = function (className, callback) {
	if(!tables[className]) throw new Error('Non existant class ' + className);
	for(var id in tables[className].rows) {
		callback(tables[className].rows[id]);
	}
};
/*
 * Utilities
 */

var self = module.exports,
	fs = require('fs'),
	shell = require('shelljs');

/*
 * Reads and returns the contents of a text file
 */
function readFile (fileName) {
	return fs.readFileSync(fileName).toString();
}

/*
 * Writes the given string into a text file. The path is created if it does not exist
 */
function writeFile (fileName, str) {
	// Create the path if required
	var temp = fileName.split('/');
	temp.splice(temp.length-1, 1);
	mkdirp(temp.join('/'));
	fs.writeFileSync(fileName, str);
}

/*
 * Create the given path, if it does not exist
 */
function mkdirp (fullPath) {
	shell.mkdir('-p', fullPath);
}

/*
 * Copy the given text file to a new location
 */
function copyFile (from, to) {
	writeFile(to, readFile(from));
}

/*
 * Debug
 */
function debug () {
	console.log.apply(console, ['DEBUG'].concat(Array.prototype.slice.call(arguments)));
}

/*
 * Info
 */
function info () {
	console.log.apply(console, ['INFO'].concat(Array.prototype.slice.call(arguments)));
}

/*
 * Error
 */
function error () {
	console.error.apply(console, ['ERROR'].concat(Array.prototype.slice.call(arguments)));
}

/*
 * Deletes the specified file
 */
function deleteFile (fileName) {
	if(fileExists(fileName)) fs.unlinkSync(fileName);
}

/*
 * Returns true if the given file exists
 */
function fileExists (fileName) {
	return fs.existsSync(fileName);
}

self.readFile = readFile;
self.writeFile = writeFile;
self.mkdirp = mkdirp;
self.copyFile = copyFile;
self.debug = debug;
self.info = info;
self.error = error;
self.deleteFile = deleteFile;
self.fileExists = fileExists;
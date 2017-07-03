var self = module.exports,
	utils = require('./utils'),
	storage = require('./storage'),
	FamilyMember = require('./family-member');

/*
 * Start with a clean slate, delete family-tree.txt, family-tree.json and storage.json
 */
self.cleanup = function () {
	storage.reset();
	utils.deleteFile('./family-tree.txt');
	utils.deleteFile('./family-tree.json');
	utils.deleteFile('./storage.json');
};

/*
 * Returns the family tree created from seed-data.txt file
 */
self.createFamilyTree = function () {
	var father = null,
		mother = null,
		ancestors = [];
	function findPrefixTabs (line) {
		var i = 0, len = line.length;
		for(; i<len; i++) {
			if(line[i]!='\t') return i;
		}
		return i;
	}
	function extractDetails (familyMember) {
		// Format: <name>[:<gender>]
		var temp = familyMember.split(':');
		if(temp.length === 1) temp[1] = 'm'; // Gender defaults to 'm'
		return temp;
	}
	function getFatherId () {
		return ancestors.length === 0 ? null : ancestors[ancestors.length-1].father.id;
	}
	function getMotherId () {
		return ancestors.length === 0 ? null : ancestors[ancestors.length-1].mother.id;
	}
	function addAsChild (child) {
		if(ancestors.length > 0) {
			ancestors[ancestors.length-1].father.addChild(child.id);
			ancestors[ancestors.length-1].mother.addChild(child.id);
		}
	}
	// For each line of the input file...
	utils.readFile('seed-data.txt').split('\n').forEach(function (line) {
		// Ignore comment lines
		if(line.length>1 && line.substr(0,2)=='//') return;
		// Check if we are now processing data about children (next generation)
		var prefixTabs = findPrefixTabs(line);
		if(prefixTabs === ancestors.length + 1) {
			// This is the next generation, store parent information in the stack
			ancestors.push({ father: father, mother: mother });
		} else if(prefixTabs < ancestors.length) {
			// Pop items from the stack
			while(prefixTabs < ancestors.length) {
				ancestors.pop();
			}
		} else if(prefixTabs !== ancestors.length){
			utils.error('Invalid seed-data file: invalid number of tabs on line "' + line + '"');
		}
		// Read information about single/couple
		var familyMembers = line.split('-').map(function(familyMember) { return extractDetails(familyMember.trim()); });
		// Deduct the gender of the spouse
		father = null;
		mother = null;
		familyMembers[0][2] = new FamilyMember(familyMembers[0][0], familyMembers[0][1], getFatherId(), getMotherId());
		familyMembers[0][2].save(); // This will generate a unique id for this family member
		addAsChild(familyMembers[0][2]);
		if(familyMembers.length === 2) { // Couple
			// Deduct the gender of the spouse
			familyMembers[1][1] = (familyMembers[0][1] === 'm' ? 'f' : 'm' );
			familyMembers[1][2] = new FamilyMember(familyMembers[1][0], familyMembers[1][1], null, null, familyMembers[0][2].id);
			familyMembers[1][2].save(); // Now id will be generated
			familyMembers[0][2].spouseId = familyMembers[1][2].id;
			// Save in temp variables for pushing on the stack, if this couple has children
			if(familyMembers[1][2].gender === 'm') {
				father = familyMembers[1][2];
			} else {
				mother = familyMembers[1][2];
			}
		}
		familyMembers[0][2].save();
		if(familyMembers[0][2].gender === 'm') {
			father = familyMembers[0][2];
		} else {
			mother = familyMembers[0][2];
		}
	});
	utils.info('Family tree created.');
	utils.writeFile('./family-tree.txt', FamilyMember.print());
	utils.writeFile('./family-tree.json', JSON.stringify(FamilyMember.toJSON(), null, 4));
};

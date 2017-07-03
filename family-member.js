/*
 * Class FamilyMember
 */

var utils = require('./utils'),
	storage = require('./storage');

//------------------------------------------------------------------------------
/*
 * Methods
 */

/*
 * Returns the class, this is used by storage
 */
FamilyMember.prototype.getClass = function () {
	return FamilyMember;
};

/*
 * Constructor
 */
function FamilyMember (name, gender, fatherId, motherId, spouseId) {
	this.name = name;
	this.gender = gender;
	this.spouseId = spouseId;
	this.children = [];
	// One of the parents is the direct descendent of the family, the other one is married into the family
	// Only the direct descendent has ancestor values set. This is used for finding relationships between two persons
	this.ancestors = [
		{
			fatherId: fatherId,
			motherId: motherId
		}
	];
	if(fatherId) {
		//  Only the direct descendent has ancestor values set, which needs to be pre-pended to the ancestor
		var father = this.getFather();
		if(father.ancestors.length > 1) { // Father is the direct descendent
			this.ancestors = father.ancestors.concat(this.ancestors);
		} else {
			var mother = this.getMother();
			this.ancestors = mother.ancestors.concat(this.ancestors);
		}
	}
}

/*
 * Save
 */
FamilyMember.prototype.save = function () {
	if(this.id) {
		storage.saveObject(this);
	} else {
		storage.createObject(this);
	}
};

/*
 * Add a child
 */
FamilyMember.prototype.addChild = function (childId) {
	if(!(childId in this.children)) this.children.push(childId);
};

FamilyMember.prototype.getFather = function (childId) {
	return FamilyMember.getById(this.getFatherId());
};

FamilyMember.prototype.getMother = function (childId) {
	return FamilyMember.getById(this.getMotherId());
};

FamilyMember.prototype.getSpouse = function (childId) {
	return FamilyMember.getById(this.spouseId);
};

FamilyMember.prototype.getFatherId = function (childId) {
	return this.ancestors[this.ancestors.length - 1].fatherId;
};

FamilyMember.prototype.getMotherId = function (childId) {
	return this.ancestors[this.ancestors.length - 1].motherId;
};

/*
 * Get children of the specified gender, null returns all
 * exclude is the list of ids that needs to be excluded from the result, this is optional
 */
FamilyMember.prototype.getChildren = function (gender, exclude) {
	return this.getDescendents(0, gender, exclude);
};

/*
 * Get descendents of the specified gender, until the specified level, null returns all
 * level = 0 for children, level = 1 for grand children, level = 2 for great grand children and so on
 * exclude is the list of ids that needs to be excluded from the result, this is optional
 */
FamilyMember.prototype.getDescendents = function (level, gender, exclude) {
	var result = [];
	exclude = exclude || [];
	this.children.forEach(function (childId) {
		var child = FamilyMember.getById(childId);
		if(level === 0) {
			if((!gender || gender === child.gender) && (exclude.indexOf(child.id) < 0)) result.push(child);
		} else {
			result = result.concat(child.getDescendents(level - 1, gender));
		}
	});
	return result;
};

/*
 * Get ancestors of the specified gender, at the specified level
 * level = 0 for parent, level = 1 for grand parent, level = 2 for great grand parent and so on
 */
FamilyMember.prototype.getAncestor = function (level, gender) {
	var result = [];
	if(this.getFatherId()) { // Assumption: If fatherId exists, then both father and mother data are available
		if(level === 0) {
			if(gender === 'm' || !gender) result.push(this.getFather());
			if(gender === 'f' || !gender) result.push(this.getMother());
		} else {
			result = result.concat(this.getFather().getAncestor(level - 1, gender));
			result = result.concat(this.getMother().getAncestor(level - 1, gender));
		}
	}
	return result;
};

/*
 * Get siblings of the specified gender, null returns all
 */
FamilyMember.prototype.getSiblings = function (gender) {
	if(this.getFatherId()) {
		return FamilyMember.getById(this.getFatherId()).getChildren(gender, [this.id]);
	} else {
		return [];
	}
};

/*
 * Get cousins of the specified gender, null returns all
 */
FamilyMember.prototype.getCousins = function (gender) {
	var result = [];
	if(this.getFatherId()) {
		this.getFather().getSiblings().forEach(function (fatherSibling) {
			result = result.concat(fatherSibling.getChildren(gender));
		});
	}
	if(this.getMotherId()) {
		this.getMother().getSiblings().forEach(function (motherSibling) {
			result = result.concat(motherSibling.getChildren(gender));
		});
	}
	return result;
};

FamilyMember.prototype.getBrothersInLaw = function () {
	var result = [];
	if(this.spouseId) {
		result = this.getSpouse().getSiblings('m');
	}
	this.getSiblings('f').forEach(function (sibling) {
		var spouse = sibling.getSpouse();
		if(spouse) result.push(spouse);
	});
	return result;
};

FamilyMember.prototype.getSistersInLaw = function () {
	var result = [];
	if(this.spouseId) {
		result = this.getSpouse().getSiblings('f');
	}
	this.getSiblings('m').forEach(function (sibling) {
		var spouse = sibling.getSpouse();
		if(spouse) result.push(spouse);
	});
	return result;
};

FamilyMember.prototype.getPaternalUncles = function () {
	var result = [];
	if(this.getFatherId()) {
		var father = this.getFather();
		result = father.getSiblings('m').concat(father.getBrothersInLaw());
	}
	return result;
};

FamilyMember.prototype.getMaternalUncles = function () {
	var result = [];
	if(this.getMotherId()) {
		var mother = this.getMother();
		result = mother.getSiblings('m').concat(mother.getBrothersInLaw());
	}
	return result;
};

FamilyMember.prototype.getPaternalAunts = function () {
	var result = [];
	if(this.getFatherId()) {
		var father = this.getFather();
		result = father.getSiblings('f').concat(father.getSistersInLaw());
	}
	return result;
};

FamilyMember.prototype.getMaternalAunts = function () {
	var result = [];
	if(this.getMotherId()) {
		var mother = this.getMother();
		result = mother.getSiblings('f').concat(mother.getSistersInLaw());
	}
	return result;
};

/*
 * Get all relatives of the specified relation type
 */
FamilyMember.prototype.getRelatives = function (relationType) {
	if(typeof relationType === 'string') relationType = FamilyMember.RELATION_TYPE.indexOf(relationType);
	// TODO
	if(relationType < 0 || relationType >= FamilyMember.RELATION_TYPE.length) throw 'Invalid relation type';
	var result = [];
	switch(FamilyMember.RELATION_TYPE[relationType]) {
		case 'Father':
			if(this.getFatherId()) result.push(this.getFather());
			break;
		case 'Mother':
			if(this.getMotherId()) result.push(this.getMother());
			break;
		case 'Spouse':
			if(this.spouseId) result.push(this.getSpouse());
			break;
		case 'Sibling(s)':
			result = this.getSiblings();
			break;
		case 'Brother(s)':
			result = this.getSiblings('m');
			break;
		case 'Sister(s)':
			result = this.getSiblings('f');
			break;
		case 'Child(ren)':
			result = this.getChildren();
			break;
		case 'Son(s)':
			result = this.getChildren('m');
			break;
		case 'Daughter(s)':
			result = this.getChildren('f');
			break;
		case 'Grand Child(ren)':
			result = this.getDescendents(1);
			break;
		case 'Grand Son(s)':
			result = this.getDescendents(1, 'm');
			break;
		case 'Grand Daughter(s)':
			result = this.getDescendents(1, 'f');
			break;
		case 'Great Grand Child(ren)':
			result = this.getDescendents(2);
			break;
		case 'Great Grand Son(s)':
			result = this.getDescendents(2, 'm');
			break;
		case 'Great Grand Daughter(s)':
			result = this.getDescendents(2, 'f');
			break;
		case 'Cousin(s)':
			result = this.getCousins();
			break;
		case 'Male Cousin(s)':
			result = this.getCousins('m');
			break;
		case 'Female Cousin(s)':
			result = this.getCousins('f');
			break;
		case 'Brother-in-law(s)':
			result = this.getBrothersInLaw();
			break;
		case 'Sister-in-law(s)':
			result = this.getSistersInLaw();
			break;
		case 'Paternal Uncle(s)':
			result = this.getPaternalUncles();
			break;
		case 'Maternal Uncle(s)':
			result = this.getMaternalUncles();
			break;
		case 'Paternal Aunt(s)':
			result = this.getPaternalAunts();
			break;
		case 'Maternal Aunt(s)':
			result = this.getMaternalAunts();
			break;
		case 'Grand Father':
			result = this.getAncestor(1, 'm');
			break;
		case 'Grand Mother':
			result = this.getAncestor(1, 'f');
			break;
		case 'Great Grand Father':
			result = this.getAncestor(2, 'm');
			break;
		case 'Great Grand Mother':
			result = this.getAncestor(2, 'f');
			break;
	}
	return result;
};

/*
 * Returns the relation of the given relativeId
 */
FamilyMember.prototype.getRelationOf = function (relative) {
	// Find the common ancestor path
	var commonAncestors = [],
		myAncestors = this.ancestors,
		relativeAncestors = relative.ancestors;
	if(myAncestors.length === 1 && this.spouseId) {
		// May be I am not a direct descendent (or I am at the top of the tree)
		// If my spouse is a direct descendent then get the ancestor path from him/her
		myAncestors = this.getSpouse().ancestors;
	}
	// Same applies to the relative
	if(relativeAncestors.length === 1 && relative.spouseId) {
		relativeAncestors = relative.getSpouse().ancestors;
	}
	myAncestors.some(function (ancestor, idx) {
		if(idx >= relativeAncestors.length || ancestor.fatherId !== relativeAncestors[idx].fatherId || ancestor.motherId !== relativeAncestors[idx].motherId) {
			return true;
		} else {
			commonAncestors.push(ancestor);
		}
	});
	// Narrow the relationship-types which need to be searched to find this relative
	if(myAncestors.length === commonAncestors.length) {
		if(myAncestors.length === relativeAncestors.length) {
			// Spouse, sibling, brother-in-law, sister-in-law
			relationshipTypes = [
				'Spouse',
				'Sibling(s)',
				'Brother-in-law(s)',
				'Sister-in-law(s)'
			];
		} else {
			// Child, grand-child, great-grand-child
			if(myAncestors.length + 1 === relativeAncestors.length) {
				relationshipTypes = [
					'Son(s)',
					'Daughter(s)'
				];
			} else if(myAncestors.length + 2 === relativeAncestors.length) {
				relationshipTypes = [
					'Grand Son(s)',
					'Grand Daughter(s)'
				];
			} else {
				relationshipTypes = [
					'Great Grand Son(s)',
					'Great Grand Daughter(s)'
				];
			}
		}
	} else {
		// Parent, cousin, uncle, aunt, grand-parent, great-grand-parent
		if(myAncestors.length === relativeAncestors.length) {
			relationshipTypes = [ 'Cousin(s)' ];
		} else if(myAncestors.length - 1 === relativeAncestors.length) {
			relationshipTypes = [
				'Father',
				'Mother',
				'Paternal Uncle(s)',
				'Maternal Uncle(s)',
				'Paternal Aunt(s)',
				'Maternal Aunt(s)'
			];
		} else if(myAncestors.length - 2 === relativeAncestors.length) {
			relationshipTypes = [
				'Grand Father',
				'Grand Mother'
			];
		} else {
			relationshipTypes = [
				'Great Grand Father',
				'Great Grand Mother'
			];
		}
	}
	// Iterate
	var self = this,
		relationship = 'None';
	relationshipTypes.some(function (relationshipType) {
		if(self.getRelatives(relationshipType).map(function (temp) { return temp.id; }).indexOf(relative.id) >= 0) {
			relationship = relationshipType;
			return true;
		}
	});
	return relationship.split('(')[0]; // Eliminate plural from the string: Sibling(s) => Sibling, Child(ren) => Child
};

/*
 * Print
 */
FamilyMember.prototype.print = function () {
	return this.name + "(" + this.gender + ")";
};

/*
 * Custom JSON serialiser used internally by FamilyMember.toJSON()
 */
FamilyMember.prototype.toJson = function () {
	return {
		name: this.name,
		gender: this.gender,
		id: this.id
		// Add more properties here, if required
	};
};

//------------------------------------------------------------------------------
/*
 * Static Methods
 */

/*
 * Get a family member by id
 */
FamilyMember.getById = function (id) {
	return storage.getById('FamilyMember', id);
}

/*
 * Get the first Family member
 */
FamilyMember.getFirstOne = function () {
	return this.getById(1);
};

/*
 * Print the entire family tree, recursively
 */
FamilyMember.print = function (id, indent) {
	indent = indent || '';
	var result = indent + '';
	id = id || 1; // Defaults to the first one
	// Print this one and the spouse, if there is one
	var familyMember = this.getById(id);
	result += familyMember.print() + (familyMember.spouseId ? ( ' - ' + this.getById(familyMember.spouseId).print()) : '');
	// Print the children
	familyMember.children.forEach(function (child) {
		result += ('\n' + FamilyMember.print(child, indent + '\t'));
	});
	return result;
};

/*
 * Returns the entire family tree as JSON
 */
FamilyMember.toJSON = function (id) {
	var result = {};
	id = id || 1; // Defaults to the first one
	// Print this one and the spouse, if there is one
	var familyMember = this.getById(id);
	result = familyMember.toJson();
	if(familyMember.spouseId) {
		result.spouse = this.getById(familyMember.spouseId).toJson();
	}
	// Print the children
	if(familyMember.children.length > 0) result.children = [];
	familyMember.children.forEach(function (child) {
		result.children.push(FamilyMember.toJSON(child));
	});
	return result;
};

/*
 * Get all family members matching the filter condition
 */
FamilyMember.filter = function (filterFunction) {
	return storage.filter('FamilyMember', filterFunction);
};

/*
 * Get a family member by his/her name
 */
FamilyMember.getByName = function (name) {
	name = name.toLowerCase();
	var result = this.filter(function (familyMember) {
			return familyMember.name.toLowerCase() == name;
		});
	return (result.length > 1 ? result :
		(result.length === 1 ? result[0] : null)
	);
};

/*
 * Returns the list of mothers with the maximum number of children of the specified gender
 */
FamilyMember.getMothersWithMaximumChildren = function (gender) {
	var maxChildren = 0,
		mothers = [];
	storage.iterate('FamilyMember', function (familyMember) {
		if(familyMember.gender === 'f' && familyMember.spouseId && familyMember.children.length > 0) {
			// This is a mother, find the number of children of the specified gender
			var children = familyMember.getChildren(gender);
			if(children.length > maxChildren) {
				maxChildren = children.length;
				mothers = [familyMember];
			} else if(children.length === maxChildren) {
				mothers.push(familyMember);
			}
		}
	});
	return mothers;
};

FamilyMember.RELATION_TYPE = [
	'Father',
	'Mother',
	'Spouse',
	'Sibling(s)',
	'Brother(s)',
	'Sister(s)',
	'Child(ren)',
	'Son(s)',
	'Daughter(s)',
	'Grand Child(ren)',
	'Grand Son(s)',
	'Grand Daughter(s)',
	'Great Grand Child(ren)',
	'Great Grand Son(s)',
	'Great Grand Daughter(s)',
	'Cousin(s)',
	'Male Cousin(s)',
	'Female Cousin(s)',
	'Brother-in-law(s)',
	'Sister-in-law(s)',
	'Paternal Uncle(s)',
	'Maternal Uncle(s)',
	'Paternal Aunt(s)',
	'Maternal Aunt(s)',
	'Grand Father',
	'Grand Mother',
	'Great Grand Father',
	'Great Grand Mother'
];

module.exports = FamilyMember;
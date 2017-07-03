var assert = require('assert'),
	utils = require('./utils'),
	seed = require('./seed-data'),
	FamilyMember = require('./family-member');

/*
 * Some convenience functions, mostly for syntax sugar
 */

/*
 * Tests if val1 equals val2
 */
function eq (description, val1, val2) {
	it(description, function (done) {
		assert.equal(val1, val2);
		done();
	});
}

/*
 * Tests if val is false
 */
function isFalse (description, val) {
	eq(description, false, val);
}

/*
 * Tests if val is true
 */
function isTrue (description, val) {
	eq(description, true, val);
}

/*
 * Get a family member by id
 */
function getById (id) {
	return FamilyMember.getById(id);
}

/*
 * Get a family member by name
 */
function getByName (name) {
	return FamilyMember.getByName(name);
}

/*
 * Test relatives of family members
 * Format of testCases:
 * 	[
 * 		{
 * 			name: '<name of person>',
 * 			relatives: [
 * 					[ '<relationship>', '<comma separated list of name of relatives>' ],
 * 					...
 * 				]
 * 		},
 * 		...
 * 	]
 */
function testRelatives (testCases) {
	testCases.forEach(function (testCase) {
		describe('Relatives of ' + testCase.name + ':', function () {
			var familyMember = getByName(testCase.name);
			testCase.relatives.forEach(function (relative) {
				var answer = familyMember.getRelatives(relative[0]).map(function (rel) { return rel.name; });
				// utils.debug(relative[0], ': ', (answer.length > 0 ? answer.join() : 'None'));
				isTrue(relative[0] + ' = ' + relative[1], (answer.length > 0 ? answer.join() : 'None') === relative[1]);
			});
		});
	});
}

/*
 * Returns true if the given list contains a person by the specified name
 */
function containsPerson (list, personName) {
	var result = false;
	list.some(function (person) {
		if(person.name === personName) {
			result = true;
			return true;
		}
	});
	return result;
}

/*
 * Returns one of the strings 'son' or 'daughter' depending on the specified value for gender
 */
function isSonOrDaughter (gender) {
	return gender === 'm' ? 'son' : 'daughter';
}

/*
 * Returns comma separated list of names of mothers with the maximum number of daughters
 */
function getMothersWithMaximumDaughters () {
	return FamilyMember.getMothersWithMaximumChildren('f').map(function(mother) { return mother.name;}).join();
}

/*
 * Cleanup the database
 */
function cleanup () {
	describe('Initialize:', function() {
		describe('Cleanup family-tree.txt, family-tree.json and storage.json:', function() {
			seed.cleanup();
			isFalse('family-tree.txt should not exist', utils.fileExists('./family-tree.txt'));
			isFalse('family-tree.json should not exist', utils.fileExists('./family-tree.json'));
			isFalse('storage.json should not exist', utils.fileExists('./storage.json'));
		});
		describe('Create family tree from seed-data.txt:', function() {
			seed.createFamilyTree();
			isTrue('family-tree.txt should now exist', utils.fileExists('./family-tree.txt'));
			isTrue('family-tree.json should now exist', utils.fileExists('./family-tree.json'));
			isTrue('storage.json should now exist', utils.fileExists('./storage.json'));
			isTrue('King Shan should be the first family member', getById(1).name === 'King Shan');
			isTrue('Queen Anga should be the second family member', getById(2).name === 'Queen Anga');
			// TODO: and so on...
			isTrue('Misa should be the last family member', getById(29).name === 'Misa');
		});
	});
}

/*
 * A child is born
 */
function newChild (motherName, childName, gender) {
	var mother = getByName(motherName),
		child = new FamilyMember(childName, gender, mother.spouseId, mother.id);
	child.save();
	mother.addChild(child.id);
	mother.save();
	child.getFather().addChild(child.id);
	child.getFather().save();
	utils.writeFile('./family-tree.txt', FamilyMember.print());
	utils.writeFile('./family-tree.json', JSON.stringify(FamilyMember.toJSON(), null, 4));
	return child;
}

/*
 * A daughter is born
 */
function newDaughter (motherName, childName) {
	return newChild(motherName, childName, 'f');
}

/*
 * Tests additions to the family tree
 * Format of testCases:
 * 	[
 * 		{ mother: '<name of mother>', child: '<name of child>', gender: '<gender of child>' },
 * 		...
 * 	]
 */
function testBirths (testCases) {
	testCases.forEach(function (testCase) {
		var mother = getByName(testCase.mother);
		describe(testCase.mother + ' gave birth to ' + testCase.child, function () {
			var child = newChild(mother.name, testCase.child, testCase.gender);  new FamilyMember(testCase.child, testCase.gender, mother.spouseId, mother.id);
			isTrue(testCase.child + ' is ' + isSonOrDaughter(testCase.gender) + ' of ' + testCase.mother, containsPerson(mother.getRelatives('Child(ren)'), testCase.child));
			isTrue(testCase.mother + ' is the mother of ' + testCase.child, containsPerson(getByName(testCase.child).getRelatives('Mother'), testCase.mother));
		});
	});
}

//----------------------------------------------------------------------------------------------------------------------

/*
 * Let the tests begin!
 */

describe('Problem #1 - Meet the family:', function() {
	var testCases = [
		{
			name: 'King Shan',
			relatives: [
				[ 'Father', 'None' ],
				[ 'Mother', 'None' ],
				[ 'Spouse', 'Queen Anga' ],
				[ 'Sibling(s)', 'None' ],
				[ 'Brother(s)', 'None' ],
				[ 'Sister(s)', 'None' ],
				[ 'Child(ren)', 'Ish,Chit,Vich,Satya' ],
				[ 'Son(s)', 'Ish,Chit,Vich' ],
				[ 'Daughter(s)', 'Satya' ],
				[ 'Grand Child(ren)', 'Drita,Vrita,Vila,Chika,Satvy,Savya,Saayan' ],
				[ 'Grand Son(s)', 'Drita,Vrita,Vila,Savya,Saayan' ],
				[ 'Grand Daughter(s)', 'Chika,Satvy' ],
				[ 'Great Grand Child(ren)', 'Jata,Driya,Lavnya,Kriya,Misa' ],
				[ 'Great Grand Son(s)', 'Jata,Kriya,Misa' ],
				[ 'Great Grand Daughter(s)', 'Driya,Lavnya' ],
				[ 'Cousin(s)', 'None' ],
				[ 'Male Cousin(s)', 'None' ],
				[ 'Female Cousin(s)', 'None' ],
				[ 'Brother-in-law(s)', 'None' ],
				[ 'Sister-in-law(s)', 'None' ],
				[ 'Paternal Uncle(s)', 'None' ],
				[ 'Maternal Uncle(s)', 'None' ],
				[ 'Paternal Aunt(s)', 'None' ],
				[ 'Maternal Aunt(s)', 'None' ],
				[ 'Grand Father', 'None' ],
				[ 'Grand Mother', 'None' ],
				[ 'Great Grand Father', 'None' ],
				[ 'Great Grand Mother', 'None']
			]
		},
		{
			name: 'Queen Anga',
			relatives: [
				[ 'Father', 'None' ],
				[ 'Mother', 'None' ],
				[ 'Spouse', 'King Shan' ],
				[ 'Sibling(s)', 'None' ],
				[ 'Brother(s)', 'None' ],
				[ 'Sister(s)', 'None' ],
				[ 'Child(ren)', 'Ish,Chit,Vich,Satya' ],
				[ 'Son(s)', 'Ish,Chit,Vich' ],
				[ 'Daughter(s)', 'Satya' ],
				[ 'Grand Child(ren)', 'Drita,Vrita,Vila,Chika,Satvy,Savya,Saayan' ],
				[ 'Grand Son(s)', 'Drita,Vrita,Vila,Savya,Saayan' ],
				[ 'Grand Daughter(s)', 'Chika,Satvy' ],
				[ 'Great Grand Child(ren)', 'Jata,Driya,Lavnya,Kriya,Misa' ],
				[ 'Great Grand Son(s)', 'Jata,Kriya,Misa' ],
				[ 'Great Grand Daughter(s)', 'Driya,Lavnya' ],
				[ 'Cousin(s)', 'None' ],
				[ 'Male Cousin(s)', 'None' ],
				[ 'Female Cousin(s)', 'None' ],
				[ 'Brother-in-law(s)', 'None' ],
				[ 'Sister-in-law(s)', 'None' ],
				[ 'Paternal Uncle(s)', 'None' ],
				[ 'Maternal Uncle(s)', 'None' ],
				[ 'Paternal Aunt(s)', 'None' ],
				[ 'Maternal Aunt(s)', 'None' ],
				[ 'Grand Father', 'None' ],
				[ 'Grand Mother', 'None' ],
				[ 'Great Grand Father', 'None' ],
				[ 'Great Grand Mother', 'None']
			]
		},
		{
			name: 'Ish',
			relatives: [
				[ 'Father', 'King Shan' ],
				[ 'Mother', 'Queen Anga' ],
				[ 'Spouse', 'None' ],
				[ 'Sibling(s)', 'Chit,Vich,Satya' ],
				[ 'Brother(s)', 'Chit,Vich' ],
				[ 'Sister(s)', 'Satya' ],
				[ 'Child(ren)', 'None' ],
				[ 'Son(s)', 'None' ],
				[ 'Daughter(s)', 'None' ],
				[ 'Grand Child(ren)', 'None' ],
				[ 'Grand Son(s)', 'None' ],
				[ 'Grand Daughter(s)', 'None' ],
				[ 'Great Grand Child(ren)', 'None' ],
				[ 'Great Grand Son(s)', 'None' ],
				[ 'Great Grand Daughter(s)', 'None' ],
				[ 'Cousin(s)', 'None' ],
				[ 'Male Cousin(s)', 'None' ],
				[ 'Female Cousin(s)', 'None' ],
				[ 'Brother-in-law(s)', 'Vyan' ],
				[ 'Sister-in-law(s)', 'Ambi,Lika' ],
				[ 'Paternal Uncle(s)', 'None' ],
				[ 'Maternal Uncle(s)', 'None' ],
				[ 'Paternal Aunt(s)', 'None' ],
				[ 'Maternal Aunt(s)', 'None' ],
				[ 'Grand Father', 'None' ],
				[ 'Grand Mother', 'None' ],
				[ 'Great Grand Father', 'None' ],
				[ 'Great Grand Mother', 'None']
			]
		}
		// TODO: and so on...
	];
	cleanup();
	testRelatives(testCases);
});

describe('Problem #2 - Meet the family', function() {
	var testCases = [
		{ mother: 'Lavnya', child: 'Vanya', gender: 'f' },
		{ mother: 'Driya', child: 'Priya', gender: 'f' },
		{ mother: 'Satvy', child: 'Ra', gender: 'm' }
		// TODO: and so on
	];
	cleanup();
	testBirths(testCases);
});

describe('Problem #3- Meet the family', function() {
	var testCases = [
		{ mother: 'Jaya', daughter: 'Drini', winningMothers: 'Jaya' },
		{ mother: 'Lika', daughter: 'Mini', winningMothers: 'Jaya,Lika' }
		// TODO: and so on...
	];
	cleanup();
	describe('Who has the maximum number of daughers?', function() {
		isTrue('Queen Anga,Jaya,Lika,Jnki,Satya have the maximum number of daughters', getMothersWithMaximumDaughters() === 'Queen Anga,Jaya,Lika,Jnki,Satya');
	});
	testCases.forEach(function (testCase) {
		testCase.child = testCase.daughter;
		testCase.gender = 'f';
		testBirths([testCase]);
		describe('Now who has the maximum number of daughers?', function() {
			isTrue('Now ' + testCase.winningMothers + ' have the maximum number of daughters', getMothersWithMaximumDaughters() === testCase.winningMothers);
		});
	});
});

describe('Problem #4 - Meet the family', function() {
	var testCases = [
		[ 'King Shan', 'Queen Anga', 'Spouse' ],
		[ 'Queen Anga', 'King Shan', 'Spouse' ],
		[ 'King Shan', 'Ish', 'Son' ],
		[ 'Queen Anga', 'Ish', 'Son' ],
		[ 'Queen Anga', 'Satya', 'Daughter' ],
		[ 'Ish', 'Ambi', 'Sister-in-law' ],
		[ 'King Shan', 'Lavnya', 'Great Grand Daughter' ],
		[ 'Misa', 'King Shan', 'Great Grand Father' ]
		// TODO: and so on...
	];
	cleanup();
	describe('Finding relationships:', function() {
		testCases.forEach(function (testCase) {
			var person = getByName(testCase[0]),
				relative = getByName(testCase[1]);
			isTrue('Relation of ' + testCase[1] + ' to ' + testCase[0] + ' is ' + testCase[2], person.getRelationOf(relative) === testCase[2]);
		});
	});
});

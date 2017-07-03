/*
 * Entry point of the program
 */

var self = module.exports,
	utils = require('./utils'),
	seed = require('./seed-data'),
	inquirer = require('inquirer'),
	FamilyMember = require('./family-member');

utils.info('Start', new Date());

/*
 * Start with a clean slate, delete family-tree.txt, family-tree.json and storage.json
 */
seed.cleanup();

/*
 * The family tree is stored in a text file called seed-data.txt in an easy to type format
 * This code will parse and convert that data into an object tree which gets
 * stored in an in-memory database. For debugging, the family tree is saved in text format in family-tree.txt
 * and saved in family-tree.json as JSON.
 */
seed.createFamilyTree();

/*
 * Listen to commands from the CLI and respond accordingly.
 */
console.log('\nWelcome to King Shan\'s family tree CLI.\n');
function repl () {
	inquirer.prompt([{
		type: 'input',
		name: 'command',
		message: [
			' Please type in a command number and press enter key:',
			'\t1 -> Problem #1 (Meet the family)',
			'\t2 -> Problem #2 (A new born)',
			'\t3 -> Problem #3 (The girl child)',
			'\t4 -> Problem #4 (Who\'s your daddy?)',
			'\t-----------------------------------',
			'\t5 -> Print family tree',
			'\t6 -> Print family tree as JSON',
			'\t-----------------------------------',
			'\t0 -> Quit',
			''
		].join('\n')
	}])
	.then(function (answers) {
		switch(parseInt(answers.command)) {
			case 1:
				problem1();
				break;
			case 2:
				problem2();
				break;
			case 3:
				problem3();
				break;
			case 4:
				problem4();
				break;
			case 5:
				console.log('\n' + utils.readFile('./family-tree.txt') + '\n');
				repl();
				break;
			case 6:
				console.log('\n' + utils.readFile('./family-tree.json') + '\n');
				repl();
				break;
			case 0:
				utils.info('End', new Date());
				break;
			default:
				utils.info('Invalid command, please try again.\n');
				repl();
		}
	});
}
repl();

/*
 * Functions to handle each of the problem types
 */

function stopIt (error) {
	// This is called to interrupt the current problem and return to the main menu
	// error = 'q' when the user wants to exit to the main menu
	// error = null when the problem has been completed without an error
	// error = <error message> when there was some error
	return Promise.reject(error);
}

function problem1 () {
	// Meet the family
	// Inputs: Person name, Relation
	// Output: Name of relative(s)
	// Step 1: Get the name of the person
	var person;
	console.log("\nProblem #1 (Meet the family)");
	console.log("Input is not case sensitive :)");
	console.log("Type q and press enter at any point to get back to the main menu.");
	inquirer.prompt([{
		type: 'input',
		name: 'person',
		message: ' Please type in the name of the person and press enter key: '
	}])
	.then(function (answers) {
		if(answers.person === 'q') return stopIt('q');
		var personName = answers.person;
		// Validate
		person = FamilyMember.getByName(personName);
		if(!person) return stopIt('Sorry, ' + personName + ' does not exist in the family tree');
		if(person instanceof Array) return stopIt('Oops! There are more than one family members by the name ' + personName);
		// Step 2: Get the relation
		var relationTypes = FamilyMember.RELATION_TYPE.map(function (rel, idx) { return '\t' + (idx+1) + ' -> ' + rel; });
		relationTypes.push(''); // Add an empty line at the end, to beautify the output a little
		return inquirer.prompt([{
			type: 'input',
			name: 'relation',
			message: [' Please select a number for the relation type and press enter key: '].concat(relationTypes).join('\n'),
		}]);
	})
	.then(function (answers) {
		if(answers.relation === 'q') return stopIt('q');
		var answer = person.getRelatives(parseInt(answers.relation) - 1).map(function (rel) { return rel.name; });
		console.log('Answer: ' + (answer.length > 0 ? answer.join() : 'None'));
		return stopIt(); // Done, repeat this problem
	})
	.catch(function (error) {
		// Quit this problem
		if(error !== undefined && error !== 'q') {
			console.log('');
			utils.error(error); // Print the error
		}
		process.nextTick((error === 'q' ) ? repl : problem1); // Loop the same problem until user enters 'q'
	});
}

function problem2 () {
	// A new born
	// Inputs: Name of the mother, the name of the child and gender of the child
	// Output: The family tree is displayed with the new addition
	var mother, childName, gender;
	console.log("\nProblem #2 (A new born)");
	console.log("Inputs are not case sensitive :)");
	console.log("Type q and press enter at any point to get back to the main menu.");
	// Step 1: Get mother's name
	inquirer.prompt([{
		type: 'input',
		name: 'motherName',
		message: ' Please type in the name of the mother and press enter key: '
	}])
	.then(function (answers) {
		if(answers.motherName === 'q') return stopIt('q');
		var motherName = answers.motherName;
		// Validate
		mother = FamilyMember.getByName(motherName);
		if(!mother) return stopIt('Sorry, ' + motherName + ' does not exist in the family tree');
		if(mother instanceof Array) return stopIt('Oops! There are more than one family members by the name ' + motherName);
		if(mother.gender !== 'f' || !mother.spouseId) return stopIt('Oops, that is not a mother');
		// Step 2: Get the name of the child
		return inquirer.prompt([{
			type: 'input',
			name: 'childName',
			message: ' Please type in the name of the child and press enter key: '
		}]);
	})
	.then(function (answers) {
		if(answers.childName === 'q') return stopIt('q');
		childName = answers.childName;
		// Validate
		var existingPerson = FamilyMember.getByName(childName);
		if(existingPerson) return stopIt('Sorry, ' + childName + ' already exist in the family tree, duplicate names are not allowed!');
		// Adjust case
		childName = childName.split(' ').map(function (word) { return word[0].toUpperCase() + word.substr(1).toLowerCase(); }).join(' ');
		// Step 3: Get the gender
		return inquirer.prompt([{
			type: 'input',
			name: 'gender',
			message: ' Please type in the gender of the child (m/f) and press enter key: '
		}]);
	})
	.then(function (answers) {
		if(answers.gender === 'q') return stopIt('q');
		gender = answers.gender;
		console.log('\nAdding child', childName, gender, 'to', mother.name);
		var child = new FamilyMember(childName, gender, mother.spouseId, mother.id);
		child.save();
		mother.addChild(child.id);
		mother.save();
		child.getFather().addChild(child.id);
		child.getFather().save();
		utils.writeFile('./family-tree.txt', FamilyMember.print());
		utils.writeFile('./family-tree.json', JSON.stringify(FamilyMember.toJSON(), null, 4));
		console.log('\n' + utils.readFile('./family-tree.txt') + '\n');
		return stopIt(); // Done, repeat this problem
	})
	.catch(function (error) {
		// Quit this problem
		if(error !== undefined && error !== 'q') {
			console.log('');
			utils.error(error); // Print the error
		}
		process.nextTick((error === 'q' ) ? repl : problem2); // Loop the same problem until user enters 'q'
	});
}

function problem3 () {
	// The girl child
	// This problem has no inputs, we just need to print the names of the mothers with the maximum number of girl children
	console.log('Mothers with maximum girl children', FamilyMember.getMothersWithMaximumChildren('f').map(function (mother) { return mother.name; }).join());
	repl();
}

function problem4 () {
	// Who's your daddy?
	// Inputs: Name of a person and name of a relative
	// Output: The relationship between the two
	// Step 1: Get the name of the person
	var person;
	console.log("\nProblem #1 (Who's your daddy?)");
	console.log("Input is not case sensitive :)");
	console.log("Type q and press enter at any point to get back to the main menu.");
	inquirer.prompt([{
		type: 'input',
		name: 'person',
		message: ' Please type in the name of the person and press enter key: '
	}])
	.then(function (answers) {
		if(answers.person === 'q') return stopIt('q');
		var personName = answers.person;
		// Validate
		person = FamilyMember.getByName(personName);
		if(!person) return stopIt('Sorry, ' + personName + ' does not exist in the family tree');
		if(person instanceof Array) return stopIt('Oops! There are more than one family members by the name ' + personName);
		// Step: Get the name of the relative
		return inquirer.prompt([{
			type: 'input',
			name: 'relative',
			message: ' Please type in the name of the relative and press enter key: '
		}])
	})
	.then(function (answers) {
		if(answers.relative === 'q') return stopIt('q');
		var relativeName = answers.relative;
		// Validate
		var relative = FamilyMember.getByName(relativeName);
		if(!relative) return stopIt('Sorry, ' + relativeName + ' does not exist in the family tree');
		if(relative instanceof Array) return stopIt('Oops! There are more than one family members by the name ' + relativeName);
		console.log('\nRelation:', person.getRelationOf(relative));
		return stopIt(); // Done, repeat this problem
	})
	.catch(function (error) {
		// Quit this problem
		if(error !== undefined && error !== 'q') {
			console.log('');
			utils.error(error); // Print the error
		}
		process.nextTick((error === 'q' ) ? repl : problem4); // Loop the same problem until user enters 'q'
	});
}
Jobs = {};

Jobs.private = {};

Jobs.private.collection = new Mongo.Collection("simpleJobs");

Meteor.startup(function () {
	Jobs.private.collection._ensureIndex({
		due: 1, 
		state: 1
	})
})

Jobs.private.registry = {};

Jobs.private.configuration = {
	timer: 5 * 1000,
	activityGap: 5 * 60 * 1000,
	activityDelay: 5 * 1000
}

Jobs.private.run = function (doc, callback) {
	// Goals: 
	// 1- Execute the job
	// 2- Update the document in database
	// 3- Capture the result (if any)

	if (typeof Jobs.private.registry[doc.name] === "function") {
		// should probably switch to
		// pending: true/false
		// ranSuccessfully: true/false 
		try {
			var jobResult = Jobs.private.registry[doc.name](doc.parameters);

			var jobUpdate = Jobs.private.collection.update(doc._id, {
				$set: {
					state: "successful",
					lastRun: new Date(),
					completed: new Date(),
					result: jobResult
				}
			})

			if (typeof callback === "function") {
				callback(null, jobResult);
			} else if (typeof callback !== "undefined") {
				console.log("Jobs: Invalid callback, but job still ran");
				console.log("----")
			}
		} catch (e) {
			var jobUpdate = Jobs.private.collection.update(doc._id, {
				$set: {
					lastRun: new Date(),
					state: "failed"
				}
			});

			if (jobUpdate) {
				console.log("Jobs: Job failed to run: " + doc.name)
			}

			if (typeof callback === "function") {
				callback(e, null)
			} else if (typeof callback !== "undefined") {
				console.log("Jobs: Invalid callback, but job still ran");
				console.log("----")
			}
		}
	} else {
		console.log("Jobs: Job not found in registry: " + doc.name);
	}
}

Jobs.private.date  = function (input1, input2) {
	var currentDate = new Date();
	var action;

	if (input2) {
		try { 
			currentDate = new Date(input1);
			action = input2
		} catch (e) {
			console.log("DateFunc: Invalid date entered");
			return;
		}
	} else {
		action = input1;
	}
	
	var utilities = {
		in: {
			milliseconds: function (int) {
				int = currentDate.getMilliseconds() + int;
				currentDate.setMilliseconds(int);
			},
			seconds: function (int) {
				int = currentDate.getSeconds() + int;
				currentDate.setSeconds(int);
			},
			minutes: function (int) {
				int = currentDate.getMinutes() + int;
				currentDate.setMinutes(int);
			},
			hours: function (int) {
				int = currentDate.getHours() + int;
				currentDate.setHours(int);
			},
			day: function (int) {
				int = currentDate.getDate() + int;
				currentDate.setDate(int);
			},
			month: function (int) {
				int = currentDate.getMonth() + int;
				currentDate.setMonth(int);
			},
			year: function (int) {
				int = currentDate.getYear() + int;
				currentDate.setYear(int);
			}
		},
		on: {
			milliseconds: function (int) {
				currentDate.setMilliseconds(int);
			},
			seconds: function (int) {
				currentDate.setSeconds(int);
			},
			minutes: function (int) {
				currentDate.setMinutes(int);
			},
			hours: function (int) {
				currentDate.setHours(int);
			},
			day: function (int) {
				currentDate.setDate(int);
			},
			month: function (int) {
				currentDate.setMonth(int);
			},
			year: function (int) {
				currentDate.setYear(int);
			}
		}
	}

	if (typeof action === "object") {
		Object.keys(action).forEach(function (key1) {
			if (["in","on"].indexOf(key1) > -1) {

				Object.keys(action[key1]).forEach(function (key2) {
					try {
						if (typeof action[key1][key2] === "number") {
							utilities[key1][key2](action[key1][key2]);
						} else {
							console.log("DateFunc: invalid type was inputted: " + key1 + "." + key2);	
						}
					} catch (e) {
						console.log("DateFunc: invalid argument was ignored: " + key1 + "." + key2);
					}
				});

			} else if (key1  === "tz" ) {
				console.log("DateFunc: Oooo - you found a hidden feature - timezone is not working yet!");
			} else {
				console.log("DateFunc: invalid argument was ignored: " + key1);
			}
		});

		return currentDate;
	} else {
		console.log("DateFunc: Invalid input for second argument");
	}
}
/**
	Angular application for Options page
	(C) OdenTools Project.
**/

angular.module('myApp', [])

/**
	Controller for Sign-in with Google Account
**/
.controller('SignInCtrl', function($scope, $rootScope) {

	var self = this;

	self.isSignedIn = false;

	// Check whether the user has signed-in
	self.checkSignIn = function() {

		chrome.runtime.sendMessage({ cmd: 'getGoogleAuthToken' }, function(res) {

			$scope.$apply(function() {
				self.isSignedIn = (res.token) ? true : false;
			});

			$rootScope.$broadcast('SignInStateChanged', { // Broadcast to other controller
				isSignedIn: self.isSignedIn
			});

		});

	};


	// Sign-in with Google Account
	self.signIn = function() {

		// Request an authorization via background.js
		chrome.runtime.sendMessage({ cmd: 'requestGoogleAuthToken' }, function(res) {

			if (res.token) {
				self.isSignedIn = true;
			}

			$rootScope.$broadcast('SignInStateChanged', { // Broadcast to other controller
				isSignedIn: self.isSignedIn
			});

		});
	};


	/* ---- */

	self.checkSignIn();

})


/**
	Controller for Calendars
**/
.controller('CalendarsCtrl', function($scope, $rootScope) {

	var self = this;

	// An array of calendar
	self.calendars = [];

	// Fetch a list of calendars from Google Calendar
	self.loadCalendars = function() {

		console.log('loadCalendars');

		// Request to WebAPI via background.js
		chrome.runtime.sendMessage({ cmd: 'getGCalCalendars' }, function(res) {

			var all_calendars = res.calendars;

			// Get a selected calendars from background.js
			chrome.runtime.sendMessage({ cmd: 'getOption', key: 'selectedCalendars' }, function(res) {

				var selected_calendar_ids = res.value || [];

				// Merge the checked items
				for (var i = 0, l = all_calendars.length; i < l; i++) {
					if (all_calendars[i]) {
						var id = all_calendars[i].id;
						if (selected_calendar_ids.indexOf(id) != -1) {
							all_calendars[i].checked = true;
						}
					}
				}

				// Apply the changes to DOM
				$scope.$apply(function(){
					self.calendars = all_calendars;
				});

			});

		});

	};


	// This function will called when the selected calendar was changed
	self.onChangedSelected = function() {
		var selected_calendar_ids = [];

		angular.forEach(self.calendars, function(item) {
			if (item.checked) selected_calendar_ids.push(item.id);
		});

		// Save the setting
		chrome.runtime.sendMessage({
			cmd: 'setOption',
			key: 'selectedCalendars',
			value: selected_calendar_ids
		}, function(res) {
			console.log('Saved');
		});
	};

	/* ---- */

	$rootScope.$on('SignInStateChanged', function(event, args) {
		console.log('SignInStateChanged');
		if (args.isSignedIn) {
			self.loadCalendars();
		}
	});

})


/**
	Controller for Options
**/
.controller('OptionsCtrl', function($scope) {

	var self = this;

	// Load options
	self.loadOptions = function() {

		// Get options from background.js
		chrome.runtime.sendMessage({ cmd: 'getOptions' }, function(res) {

			var opts = res.options || {};
			console.log(opts);
			$scope.$apply(function(){ // Apply the changes to DOM
				self.isDebugMode = opts.isDebugMode || false;
			});

		});

	};


	// Save options
	self.saveOptions = function() {

		chrome.runtime.sendMessage({
			cmd: 'setOption',
			key: 'isDebugMode',
			value: self.isDebugMode
		}, function(res) {
			console.log(res);
		});

	};


	// This function will called when the option value was changed
	self.onChangedOptions = function() {
		self.saveOptions();
	};


	/* ---- */

	self.loadOptions();

})

;

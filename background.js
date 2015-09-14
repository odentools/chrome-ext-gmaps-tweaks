/**
	Background script
	(C) OdenTools Project.
**/

// Load The Google API Client Library
function onGAPILoad() { // On the client has been loaded
	// Load the sub clients for The Google Calendar API
	gapi.client.load('calendar', 'v3', function() {});
};

var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://apis.google.com/js/client.js?onload=onGAPILoad";
head.appendChild(script);

var googleAuthToken = null;

// Make a receiver which to communicate with content.js and background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){ // On received message

	var cmd = request.cmd;

	if (cmd == 'getGoogleAuthToken') { // Get an authorized access-token

		// Get an access-token of Google Account via Chrome API
		chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
			if (token) {
				googleAuthToken = token;
				gapi.auth.setToken({
					access_token: token
				});
			}
			sendResponse({
				token: token
			});
		});

	} else if (cmd == 'requestGoogleAuthToken') { // Request the authorization

		// Request the authorization to user with using Google Account via Chrome API
		chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
			// If this app is already authorized, it doesn't show a authorization window.

			if (token) {
				googleAuthToken = token;
				gapi.auth.setToken({
					access_token: token
				});
			}
			sendResponse({
				token: token
			});

		});

	} else if (cmd == 'getGCalCalendars') { // Fetch a list of calendars from Google Calendar

		var req = gapi.client.calendar.calendarList.list({
			'minAccessRole': 'writer'
		});
		req.execute(function(res) {

			console.log(res);
			if (res == null || res.items == null) {
				sendResponse(null);
				return;
			}
			sendResponse({
				calendars: res.items
			});

		});

	} else if (cmd == 'getGCalEvents') { // Fetch a list of events from Google Calendar

		var req = gapi.client.calendar.events.list({
			'calendarId': request.calendarId || 'primary',
			'timeMin':  request.timeMin || (new Date()).toISOString(),
			'showDeleted': false,
			'singleEvents': true,
			'maxResults': 10,
			'orderBy': 'startTime'
		});
		req.execute(function(res) {

			if (res == null || res.items == null) {
				sendResponse(null);
				return;
			}
			sendResponse({
				events: res.items
			});

		});

	} else if (cmd == 'getGCalEvent') { // Fetch the event from google Calendar

		var req = gapi.client.calendar.events.get({
			'calendarId': request.calendarId || 'primary',
			'eventId': request.eventId
		});
		req.execute(function(res) {

			sendResponse({
				event: res
			});

		});

	} else if (cmd == 'patchGCalEvent') { // Update the event on Google Calendar as patch

			// Merge given patch items and required parameters
			var params = request.params;
			params.calendarId = request.calendarId || 'primary';
			params.eventId = request.eventId;

			// Request
			var req = gapi.client.calendar.events.patch(params);
			req.execute(function(res) {

				sendResponse(res);

			});

		} else if (cmd == 'getOptions') { // Get all options from LocalStorage

			var options = {};
			for (var key in localStorage) {
				var value = localStorage[key];
				try {
					if (value != null) value = JSON.parse(value).value;
				} catch (e) {
					console.error(e);
					value = null;
				}
				options[key] = value;
			}

			sendResponse({
				options: options
			});

	} else if (cmd == 'getOption' && request.key != null) {// Get the option from LocalStorage

		var value = localStorage[request.key];
		try {
			if (value != null) value = JSON.parse(value).value;
		} catch (e) {
			console.error(e);
			value = null;
		}

		sendResponse({
			value: value
		});

	} else if (cmd == 'setOption' && request.key != null) { // Set the option to LocalStorage

		var obj = {
			value: request.value
		};
		localStorage[request.key] = JSON.stringify(obj);

		sendResponse(localStorage[request.key]);

	} else {

		sendResponse(null);

	}

	return true; // It indicate to send response as async
});

/**
	Content script for Google Map page
	(C) OdenTools Project.
**/

(function($){

	// A constructor of Handler
	var Handler = function(is_debug) {

		// Debug mode
		this.isDebug = is_debug || false;

		// Prefix string for this extension
		this.prefix = 'DLGMT';

		// Access token for Google Calendar API
		this.gCalToken = null;

		// Generated elements
		this.$btn = null;
		this.$eventSelect = null;
		this.$progress = null;

		// Labels
		this.labelBtnAddRouteToEvent = 'Add the route to an event';

	};


	// Attach an button to the direction card
	Handler.prototype.attachBtnToDirectionCard = function() {

		var self = this;

		// Get the toolbar of the direction card
		var $toolbar = $('.directions-explore-toolbar');

		if ($toolbar.data('is'+ self.prefix +'Injected')) return;
		$toolbar.data('is'+ self.prefix +'Injected', true);

		self.logD('attachBtnToToolbar', $toolbar);

		// Insert an button
		var $btn = $('<a/>');
		$btn.attr('href', 'javascript:void(0);');
		$btn.css({
			display: 'inline-block'
		});
		self.$btn = $btn;

		var $btn_label = $('<div/>');
		$btn_label.css({
			fontSize: '12px',
			paddingLeft: '28px',
			position: 'relative'
		});
		$btn_label.text(self.labelBtnAddRouteToEvent);
		$btn.append($btn_label);
		self.$btnLabel = $btn_label;

		$toolbar.append($btn);

		// Insert a event selector
		var $evt_select = $('<select/>');
		$evt_select.css({
			marginLeft: '10px'
		});
		$toolbar.append($evt_select);
		self.$eventSelect = $evt_select;
		$evt_select.hide();

		// Insert a progress indicator
		var $progress = $('<img />');
		$progress.attr('src', chrome.extension.getURL('img/progress.gif'));
		$progress.css({
			display: 'inline-block',
			verticalAlign: 'middle',
			marginLeft: '20px'
		});
		$toolbar.append($progress);
		self.$progress = $progress;
		$progress.hide();

		// Set an event handlers

		$btn.click(function() { // When the button on toolbar was clicked

			chrome.runtime.sendMessage({ cmd: 'getGoogleAuthToken' }, function(res) {

				if (res.token) {
					self.gCalToken = res.token;
					self.initEventSelector();
				}

			});

		});

		$evt_select.change(function() { // When the event was selected

			// Get the calendar ID and the event ID
			var d = $evt_select.val().split('/');
			if (d.length <= 1) return;
			var calendar_id = d[0];
			var event_id = d[1];

			// To indicate the start of process
			self.$eventSelect.hide();
			self.$progress.show();

			// Processing
			window.setTimeout(function() {
				// Get a transit string from the page
				var transit_str = self.getTransitStringFromDirectionCard();

				// Insert that string to a description of the event
				self.insertEventDescription(calendar_id, event_id, transit_str, function(res) {

					if (res == null) {
						window.alert('Update failed');
						self.$progress.hide();
						self.$btn.show();
						return;
					}

					// Done
					self.$progress.hide();
					self.$btnLabel.text('Event updated :)');
					self.$btn.show();
					window.setTimeout(function(){
						self.$btnLabel.text(self.labelBtnAddRouteToEvent);
					}, 1000);

				});
			}, 500);

		});
	};


	// Initialize a select box and show an upcoming events of calendar
	Handler.prototype.initEventSelector = function() {

		var self = this;

		self.logD('showEventSelector');

		// To indicate the start of process
		self.$btn.hide();
		self.$progress.show();

		if (self.gCalToken == null) { // Could not get
			self.$btn.show();
			self.$progress.hide();
			return;
		}

		// Get a target calendars
		chrome.runtime.sendMessage({
			cmd: 'getOption',
			key: 'selectedCalendars'
		}, function(response){

			var selected_calendar_ids = response.value || [];
			var $select = self.$eventSelect;

			if (selected_calendar_ids.length == 0) {
				window.alert('Please choose at least one or more calendars on Options page.');
				self.$btn.show();
				self.$progress.hide();
				return;
			}

			// Make a function for sort & show a events
			var showFetchedEvents = function(events) {

				// Convert the start date string to date object
				events.forEach(function(evt) {

					var date = null;
					if (evt.start.dateTime) { // Date and time
						date = new Date(evt.start.dateTime);
					} else if (evt.start.date && evt.start.date.match(/^(\d+)-(\d+)-(\d+)$/)) { // Date only
						date = new Date(RegExp.$1, RegExp.$2, RegExp.$3)
					}

					var date_splitter = (window.navigator.language.match(/^(ja|ja-JP)$/)) ? '/' : '-';
					var date_str = self.zPadding(date.getMonth() + 1, 2) + date_splitter + self.zPadding(date.getDate(), 2);

					// Insert it to the event object
					evt.startDate = date;
					evt.startDateStr = date_str;

				});

				// Sort the events
				events = events.sort(function (a, b) {
					if (a.startDate.getTime() < b.startDate.getTime()) return -1;
					if (a.startDate.getTime() > b.startDate.getTime()) return 1;
					return 0;
				});
				self.logD(events);

				// Cleanup the event selector
				$select.empty();
				var $opt = $('<option/>');
				$opt.text('Choose the event:');
				$select.append($opt);

				// Show the event selector
				events.forEach(function(evt) {

					// Make a option of select
					var $opt = $('<option/>');
					if (evt.startDate) {
						$opt.text('[' + evt.startDateStr + ']  ' + evt.summary);
					} else {
						$opt.text(evt.summary);
					}
					$opt.val(calendar_id + '/' + evt.id);
					$select.append($opt);

				});

				// All was done
				$select.show();
				self.$progress.hide();

			};

			// Fetch the events from each calendars
			var fetched_events = [];
			var find_time_min = (new Date()).toISOString();
			var fetched_calendar_ids = [];
			for (var i = 0, l = selected_calendar_ids.length; i < l; i++) {
				var calendar_id = selected_calendar_ids[i];

				chrome.runtime.sendMessage({
					cmd: 'getGCalEvents',
					calendarId: calendar_id,
					timeMin: find_time_min
				}, function(response){ // On fetched events

					// Mark as fetched calendar
					fetched_calendar_ids.push(calendar_id);

					// Insert fetched events into all events array
					if (response.events != null) {
						fetched_events = fetched_events.concat(response.events);
					}

					// Check for whether the all fetching has been completed
					if (selected_calendar_ids.length <= fetched_calendar_ids.length) { // All fetching has been completed
						// Sort and show the all events
						showFetchedEvents(fetched_events);
					}

				});

			}

		});

	};


	// Get a transit string from the direction card
	Handler.prototype.getTransitStringFromDirectionCard = function() {

		var self = this;

		var $detail = $('#directions-side-panel-details');

		// Get a steps
		self.logD('--Steps--');
		var steps = [];
		var $steps = $detail.find('.transit-mode-body > *');
		$steps.each(function() {
			steps = steps.concat( self.getStepsByTransitStepElem($(this)) );
		});

		// Print for debug
		self.logD(steps);

		// Make a transit string
		var output = new String();
		for (var i = 0, l = steps.length; i < l; i++) {
			if (0 < output.length) {
				output += '\n';
			}

			var s = steps[i];
			if (s.type == 'transit-move') {
				output += ' |\n |  ' + s.detail + '\n |';
			} else {
				output += '[' + s.time + ']  ' + s.detail;
			}
		}

		self.logD(output);

		return output;

	};


	// Get a steps by element of transit step
	Handler.prototype.getStepsByTransitStepElem = function($step) {

		var self = this;

		// Detect a type of the step
		var type = self.getTypeByTransitStep($step); // 'waypoint', 'transit-group', 'transit-stop', 'transit-move'
		if (type == null) return [];

		if (type == 'transit-group') {
			// Parse a children
			var steps = [];
			$step.find('div').each(function(){
				steps = steps.concat( self.getStepsByTransitStepElem($(this)) );
			});

			self.logD('-----');

			return steps;
		}

		// Get a time string (e.g. 12:00)
		var time = $step.find('.time-with-period').text();

		// Get a detail string
		var detail = null;
		try {
			if (type == 'waypoint') {
				// Get the address of the waypoint (e.g. 'Foobar Campus')
				var $addresses = $step.find('.waypoint-address');
				detail = $($addresses[0]).text();
			} else if (type == 'transit-stop') {
				// Get the name of the transit stop (e.g. 'Foobar Station')
				var $stop_details = $step.find('.transit-stop-details');
				detail = $($stop_details[0]).text();
			} else if (type == 'transit-move') {
				// Get the line name and destination of the transit (e.g. 'ABC Loop Line - 10 min' or 'Walk', ...)
				var $descriptions = $step.find('.transit-step-description > *');
				var detail = new String();
				$descriptions.each(function(){
					var str = self.getStringByTransitStepDescriptionElem($(this), 0);
					if (str != null && 1 <= str.length) detail += str + ' ';
				});
			}
		} catch (e) {
			console.error(e);
		}

		// Skip the invalid step
		if (detail == null || detail.length <= 0) {
			self.logD('-----');
			return [];
		}

		// Cleanup
		if (type == 'transit-move') {
			// Time is not needed
			time = null;
			// Remove usesless spaces
			detail = detail.replace(/^\s+|\s+$/g, '');
			// Print for debug
			self.logD('Result: --:-- ' +  detail);
		} else {
			// Remove usesless spaces
			detail = detail.replace(/^\s+|\s+$/g, '');
			time = time.replace(/^\s+|\s+$/g, '');
			// Print for debug
			self.logD('Result: --:-- ' +  detail);
		}
		self.logD('-----');

		return [{
			time: time,
			type: type,
			detail: detail
		}];
	};


	// Get a type by the step
	Handler.prototype.getTypeByTransitStep = function($step) {

		var self = this;

		// Detect a type of the step
		var type = null;
		if ($step.hasClass('waypoint')) {
			type = 'waypoint'; // 'waypoint' is start/end point of the route.
		} else if ($step.hasClass('directions-mode-group') || $step.hasClass('directions-mode-group-closed')) {
			type = 'transit-group'; // 'transit-group' is group root. It has children (e.g. 'transit-stop' and 'transit-move')
		} else if ($step.hasClass('transit-stop')) {
			type = 'transit-stop';
		} else if ($step.hasClass('transit-logical-step-row')) {
			type = 'transit-move';
		} else {
			self.logW('Unknown type!', $step);
			return null;
		}

		self.logD(type, $step);

		return type;

	};


	// Insert the string to a detail of the event
	Handler.prototype.insertEventDescription = function(calendar_id, event_id, description_str, callback) {

		var self = this;

		// Get the event
		chrome.runtime.sendMessage({
			cmd: 'getGCalEvent',
			calendarId: calendar_id,
			eventId: event_id
		}, function(response){

			var event = response.event;
			self.logD('insertEventDetail - Event fetched', event);

			// Concat the detail string
			if (event.description) {
				description_str = event.description + "\n\n-----\n\n" + description_str;
			}

			// Update the event
			chrome.runtime.sendMessage({
				cmd: 'patchGCalEvent',
				calendarId: calendar_id,
				eventId: event_id,
				params: {
					description: description_str
				}
			}, function(response){

				self.logD('insertEventDetail - Event updated', response);
				callback(response);

			});

		});

	};


	// Gather a string of the transit-move from .transit-step-description element
	Handler.prototype.getStringByTransitStepDescriptionElem = function($elem, level) {

		var self = this;

		// Skip for verbose or useless text
		if ($elem.is(':hidden')) return null;
		if ($elem.hasClass('directions-confidential')) return null;

		// Check the child elements
		var $children = $elem.children();
		if ($children.length <= 0) { // Not found children
			// Returns a text of myself
			var text = $elem.text();
			return text.replace(/^\s+|\s+$/g, ''); // Remove usesless spaces
		}

		// Gather a string from the child elements
		var string = new String();
		for (var i = 0, l = $children.length; i < l; i++) {
			var $e = $($children[i]);
			try {
				var str = self.getStringByTransitStepDescriptionElem($e, level + 1);
				if (str != null && 1 <= str.length) {
					string += str + ' ';
				}
			} catch (e) {
				console.error(e);
				self.logW('Error occured in', $e);
			}
		}

		// Get a outer string
		if ($elem.html().match(/^([^<>]*)<.*>([^<>]*)$/)) {
			var prefix = RegExp.$1.replace(/^\s+|\s+$/g, '');
			var postfix = RegExp.$2.replace(/^\s+|\s+$/g, '');
			string = prefix + string + postfix;
		}

		return string; // Returns transit-move string (e.g. 'ABC Line - 10 min' or 'Walk', ...)

	};


	// Zero padding
	Handler.prototype.zPadding = function(number, length){
		return (Array(length).join('0') + number).slice(-length);
	};


	// Print a log string
	Handler.prototype.logD = function(str) {

		if (!this.isDebug) return;

		if (arguments.length == 1) { // It is variable-length arguments which injected by processor
			console.log(arguments[0]);
		} else {
			console.log(arguments);
		}

	};


	// Print a warning string
	Handler.prototype.logW = function(str) {

		if (!this.isDebug) return;

		if (arguments.length == 1) { // It is variable-length arguments which injected by processor
			console.warn(arguments[0]);
		} else {
			console.warn(arguments);
		}

	};

	/* ---- */

	// Read an options
	var options = {};
	chrome.runtime.sendMessage({ cmd: 'getOptions' }, function(res) {

		options = res.options;

		// Watch a toolbar on the direction card
		var handler = new Handler(options.isDebugMode);
		window.setInterval(function() {

			try {
				handler.attachBtnToDirectionCard();
			} catch (e) {
				console.error(e);
			}

		}, 1000);

	});

})(jQuery);

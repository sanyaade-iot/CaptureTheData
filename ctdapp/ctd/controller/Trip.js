/*

This file is part of CaptureTheData!

Copyright (c) 2011, Bobbie Smulders

Contact:  mail@bsmulders.com

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

 */

var lat, lng;

Ext.define('CTD.controller.Trip', {
	extend : 'Ext.app.Controller',
	stores : [ 'Trips', 'TimeControl', 'Measurements' ],
	controllers : [ 'TimeControl' ],

	init : function() {
		this.control({
			'triplist' : {
				itemclick : this.onTripClick
			},
		});
		this.getTripsStore().addListener('load', this.onTripLoad, this);

		new Ext.util.TaskRunner().start({
			run : this.onTick,
			interval : 100,
			scope : this,
		});
	},

	onTripClick : function(dataview, record, item, index, e) {
		this.getTripsStore().proxy.url = record.get('URI');
		this.getTripsStore().load();
	},

	onTripLoad : function() {
		var timeRecord = this.getTimeControlStore().first();
		var tripRecord = this.getTripsStore().first();

		if (tripRecord.data) {
			timeRecord.set('StartTime', tripRecord.get('FirstReport')
					+ (0.1 * tripRecord.get('FirstReportSub')));
			timeRecord.set('EndTime', tripRecord.get('LastReport')
					+ (0.1 * tripRecord.get('LastReportSub')));
			timeRecord.set('TimeStamp', tripRecord.get('FirstReport'));
			timeRecord.set('TimeStampSub', tripRecord.get('FirstReportSub'));
			timeRecord.set('Running', true);
			timeRecord.set('Speed', false);
		}
	},

	onTick : function() {
		var timeRecord = this.getTimeControlStore().first();
		var tripRecord = this.getTripsStore().first();

		// When the TimeRecord is running and trip data is loaded
		if (timeRecord.get('Running') == true && tripRecord.data) {
			// Load measurement
			this.getMeasurementsStore().getProxy().url = tripRecord.get('URI')
					+ "/measurement/" + timeRecord.get('TimeStamp') + "/"
					+ timeRecord.get('TimeStampSub');
			this.getMeasurementsStore().load();

			// Increment internal measurement timestamp
			if (timeRecord.get('TimeStampSub') >= 9) {
				timeRecord.set('TimeStamp', timeRecord.get('TimeStamp') + 1);
				timeRecord.set('TimeStampSub', 0);
			} else {
				timeRecord.set('TimeStampSub', timeRecord.get('TimeStampSub')
						+ (timeRecord.get('Speed') ? 9 : 1));
			}

			// Stop playing when the last measurement is reached
			if (timeRecord.get('TimeStamp') >= tripRecord.get('LastReport')
					&& timeRecord.get('TimeStampSub') >= tripRecord
							.get('LastReportSub')) {
				timeRecord.set('Running', false);
			}
		}
	},
});
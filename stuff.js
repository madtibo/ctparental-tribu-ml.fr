#!/usr/bin/gjs

const GLib = imports.gi.GLib;

function getWeekdayStartingMonday() {
    let dow = [ 6, 0, 1, 2, 3, 4, 5 ];
    let now = new Date();
    return dow[now.getDay()];
}

function formatDuration(minutes) {
    return "%02d:%02d".format((minutes - minutes % 60) / 60, minutes % 60);
}

function formatDurationHuman(minutes) {
    let hours = (minutes - minutes % 60) / 60;
    let mins = minutes % 60;
    let res = "";

    if (hours > 0 || mins > 0) {
        if (hours > 0)
            res += "%dh ".format(hours);

        if (mins > 0)
            res += "%dmin".format(mins);
    } else {
        res = "Just started";
    }

    return res;
}

function formatDurationHours(minutes) {
    return new Number(minutes / 60.0).toFixed(1) + "h";
}

function readFile(filename) {
    let read = GLib.file_get_contents(filename);
    if (read[0]) {
	return read[1];
    }
    else {
	log("*** ERROR reading "+filename);
	return false;
    }
}

function parseTimeFromFile(confFile, user) {
    let time = 0;
    let timeRegexp = '^('+user+'[ ]*=[ ]*)([0-9]+)$';
    try {
	let confLines=confFile.toString().split(',')[1].split('\n');
	for (let i=0; i<confLines.length; i++) {
	    if (confLines[i] != '' && confLines[i] != '\n') {
		let userConf = new RegExp(timeRegexp).exec(confLines[i]);
		if (userConf && userConf.length == 3 && userConf[2] > 0) {
    		    time = userConf[2];
		    break;
		}
	    }
	}
    }
    catch(err) {
	log("ERROR getting time from file: "+confFile+" ("+err+")")
	return "Undefined";
    }
    return time;
}

// get the remaining time from CThours.conf and CThourscompteur
function getRemainingTime(confDir) {
    let conf = GLib.file_get_contents(confDir+"/CThours.conf");
    let compteur = GLib.file_get_contents(confDir+"/CThourscompteur");
    let confTime = parseTimeFromFile(conf, GLib.get_user_name());
    let spendTime = parseTimeFromFile(compteur, GLib.get_user_name());
    return confTime-spendTime;
}

// get the day timetable from CThours.conf
function getTodayTimetable(confDir) {
    let timetable = [ "Undefined" ];
    let dow = getWeekdayStartingMonday();
    let timetableRegexp = '^('+GLib.get_user_name()+'[ ]*=[ ]*[ ]*'+dow+'[ ]*=)([0-9h:]+)$';
    let tt = "Undefined";
    try {
	let conf = GLib.file_get_contents(confDir+"/CThours.conf");
	let confLines=conf.toString().split(',')[1].split('\n');
	for (let i=0; i<confLines.length; i++) {
	    if (confLines[i] != '' && confLines[i] != '\n') {
    		let ttConf = new RegExp(timetableRegexp).exec(confLines[i]);
    		if (ttConf && ttConf.length == 3) {
    		    tt = ttConf[2];
    		    break;
    		}
    	    }
    	}
    }
    catch(err) {
    	log("ERROR getting time from file: "+confFile+" ("+err+")")
    	return "Undefined";
    }
    return tt.split(':');
    // let times = tt.split(':');
    // if (times.length == 4) {
    // 	timetable = [ times[0], times[1], times[2], times[3] ];
    // }
    // else if (times.length == 2) {
    // 	timetable = [ times[0], times[1] ];
    // }
    // else {
    // 	timetable = [ times ];
    // }
    // return timetable;
}


/*
 * Simple CTParental extension for gnome-shell
 * Copyright (c) 2017-2018 Thibaut Madelaine <thibaut@tribu-ml.fr>
 *
 * Portions originate from the gnome-shell source code, Copyright (c)
 * its respectives authors.
 * Portions originate from the gnome-shell project-hamster-extension source
 * code, Copyright (c) its respectives authors.
 * This project is released under the GNU GPL License.
 */

const Clutter = imports.gi.Clutter;
const Config = imports.misc.config;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Util = imports.misc.util;
const Gettext = imports.gettext.domain("ctparental-time-displayer");
const _ = Gettext.gettext;
const N_ = function(x) { return x; };

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Stuff = Me.imports.stuff;


const CTParentalMenu = new Lang.Class({
    Name: 'CTParentalMenu.CTParentalMenu',
    Extends: PanelMenu.Button,

    _init: function() {	
        this.parent(0.0, _("CTParental"));

        let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        this.statusLabel = new St.Label({ text: _("CTParental"),
					  y_expand: true,
					  y_align: Clutter.ActorAlign.CENTER });
        hbox.add_child(this.statusLabel);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_actor(hbox);

	this.menuSection = new PopupMenu.PopupMenuSection();
	this.menu.addMenuItem(this.menuSection);
	
	this._updateLabel();
    },

    _updateMenu: function() {
        this.menu.removeAll();
        this._settings = Convenience.getSettings();
	let confDir = this._settings.get_strv("ctparental-configuration-file");
	    
	// get the remaining time
        let timeLeft = Stuff.getRemainingTime(confDir);
	this.remainingTimeItem = new PopupMenu.PopupMenuItem(_("Remaining time: ")+Stuff.formatDurationHuman(timeLeft));
	this.menu.addMenuItem(this.remainingTimeItem);
	
	// get the day timetable	
	this.todayScheduleItem = new PopupMenu.PopupMenuItem(_("Today's schedule: "));
	this.menu.addMenuItem(this.todayScheduleItem);
	
	let todayTimetable = Stuff.getTodayTimetable(confDir);
	for (let i=0; i<todayTimetable.length-1; i+=2) {
	    if (todayTimetable[i] != '' && todayTimetable[i+1] != '' ) {
		let labelText = "\t"+todayTimetable[i]+_(" to ")+todayTimetable[i+1];
		let todayPeriodItem = new PopupMenu.PopupMenuItem(labelText);
		this.menu.addMenuItem(todayPeriodItem);
	    }
	}

	// test
	// this.testItem = new PopupMenu.PopupMenuItem('ctparental-box-label');
	// this.testItem.label.set_text('toto');
	// this.menu.addMenuItem(this.testItem);
	
    },
    
    _updateLabel: function(){
        let refreshTime = 60; // in seconds
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(refreshTime, Lang.bind(this, this._updateLabel));

	this._updateMenu();
	return true;
    },
    
    destroy: function() {
        this.parent();
    },

});

function init(extensionMeta) {
    Convenience.initTranslations("ctparental-time-displayer");
}

let _indicator;

function enable() {
    _indicator = new CTParentalMenu;

    let pos = 1;
    if ('apps-menu' in Main.panel.statusArea)
	pos = 2;
    let panelIntPosition = Convenience.getSettings().get_int("ctparental-panel-position");
    let panelPosition = 'left'; // pref = 0 (default)
    
    if (panelIntPosition == 1) {
    	panelPosition = 'center';
    }
    else if (panelIntPosition == 2) {
    	panelPosition = 'right';
    }
    else if (panelIntPosition == 3) {
    	panelPosition = 'system menu';
    }    
    Main.panel.addToStatusArea('ctparental-menu', _indicator, pos, panelPosition);
}

function disable() {
    Mainloop.source_remove(this._timeout);
    _indicator.destroy();
}

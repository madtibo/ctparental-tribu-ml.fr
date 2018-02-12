/* -*- mode: js2; js2-basic-offset: 4 -*- */
/* jshint esnext: true */
/* global imports: false */
/**
   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 2 of the License, or
   (at your option) any later version.
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Gettext = imports.gettext.domain("ctparental-time-displayer");
const _ = Gettext.gettext;
const N_ = function(x) { return x; };

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

let gsettings;

const CTParentalSettingsWidget = new GObject.Class(
    {
	Name: 'CTParental.Prefs.CTParentalSettingsWidget',
	GTypeName: 'CTParentalSettingsWidget',
	Extends: Gtk.VBox,

	_init : function(params) {
	    this.parent(params);
	    this.margin = 10;

	    this._settings = Convenience.getSettings();

	    let vbox, label;

	    // Appearance in panel
	    label = new Gtk.Label({margin_top: 20});
	    label.set_markup("<b>" + _("Appearance in panel") + "</b>");
	    label.set_alignment(0, 0.5);
	    this.add(label);
	    
	    vbox = new Gtk.VBox({margin: 10});
	    this.add(vbox);
	    
	    let appearanceOptions = new Gtk.ListStore();
	    appearanceOptions.set_column_types([GObject.TYPE_STRING, GObject.TYPE_INT]);
	    
	    appearanceOptions.set(appearanceOptions.append(), [0, 1], [_("Label"), 0]);
	    appearanceOptions.set(appearanceOptions.append(), [0, 1], [_("Icon"), 1]);
	    appearanceOptions.set(appearanceOptions.append(), [0, 1], [_("Label and icon"), 2]);

	    let appearanceCombo = new Gtk.ComboBox({model: appearanceOptions});

	    let renderer = new Gtk.CellRendererText();
	    appearanceCombo.pack_start(renderer, true);
	    appearanceCombo.add_attribute(renderer, 'text', 0);
	    appearanceCombo.connect('changed', Lang.bind(this, this._onAppearanceChange));
	    appearanceCombo.set_active(this._settings.get_int("ctparental-panel-appearance"));

	    vbox.add(appearanceCombo);

	    // position in panel
	    label = new Gtk.Label({margin_top: 20});
	    label.set_markup("<b>" + _("Position in panel") + "</b>");
	    label.set_alignment(0, 0.5);
	    this.add(label);
	    
	    vbox = new Gtk.VBox({margin: 10});
	    this.add(vbox);
	    
	    let positionOptions = new Gtk.ListStore();
	    positionOptions.set_column_types([GObject.TYPE_STRING, GObject.TYPE_INT]);
	    
	    positionOptions.set(positionOptions.append(), [0, 1], [_("Left"), 0]);
	    positionOptions.set(positionOptions.append(), [0, 1], [_("Center"), 1]);
	    positionOptions.set(positionOptions.append(), [0, 1], [_("Right"), 2]);
	    positionOptions.set(positionOptions.append(), [0, 1], [_("System menu"), 3]);

	    let positionCombo = new Gtk.ComboBox({model: positionOptions});

	    let renderer = new Gtk.CellRendererText();
	    positionCombo.pack_start(renderer, true);
	    positionCombo.add_attribute(renderer, 'text', 0);
	    positionCombo.connect('changed', Lang.bind(this, this._onPositionChange));
	    positionCombo.set_active(this._settings.get_int("ctparental-panel-position"));
	    vbox.add(positionCombo);

	    // conf directory
	    label = new Gtk.Label({margin_top: 20});
	    label.set_markup("<b>" + _("Configuration directory") + "</b>");
	    label.set_alignment(0, 0.5);
	    this.add(label);

	    vbox = new Gtk.VBox({margin: 10});
	    this.add(vbox);
	    let entry = new Gtk.Entry({margin_bottom: 10,
	    			       margin_top: 5,
	    			       text: this._settings.get_strv("ctparental-configuration-file")[0]});
	    vbox.add(entry);
	    entry.connect('changed', Lang.bind(this, this._onConfFileChange));

	    vbox.add(new Gtk.Label({label: _("Reload gnome shell after updating prefs (alt+f2 > r)"),
	    			    margin_top: 70}));
	},

	_onAppearanceChange: function(widget) {
	    let [success, iter] = widget.get_active_iter();
	    if (!success)
		return;

	    let newAppearance = widget.get_model().get_value(iter, 1);

	    if (this._settings.get_int("ctparental-panel-appearance") == newAppearance)
		return;

	    this._settings.set_int("ctparental-panel-appearance", newAppearance);
	},

	_onPositionChange: function(widget) {
	    let [success, iter] = widget.get_active_iter();
	    if (!success)
		return;

	    let newPosition = widget.get_model().get_value(iter, 1);

	    if (this._settings.get_int("ctparental-panel-position") == newPosition)
		return;

	    this._settings.set_int("ctparental-panel-position", newPosition);
	},

	_onConfFileChange: function(widget) {
	    let newConFile = widget.get_text();

	    if (this._settings.get_strv("ctparental-configuration-file") == newConFile)
	    	return;

	    this._settings.set_strv("ctparental-configuration-file", [newConFile]);
	}
	
    }
);

function init() {
   Convenience.initTranslations("ctparental-time-displayer");
}

function buildPrefsWidget() {
    let widget = new CTParentalSettingsWidget();
    widget.show_all();

    return widget;
}

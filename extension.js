/*
 * Simple CTParental extension for gnome-shell
 * Copyright (c) 2011 Jerome Oufella <jerome@oufella.com>
 * Copyright (c) 2011-2012 Toms Baugis <toms.baugis@gmail.com>
 * Icons Artwork Copyright (c) 2012 Reda Lazri <the.red.shortcut@gmail.com>
 * Copyright (c) 2017 Thibaut Madelaine <thibaut@tribu-ml.fr>
 *
 * Portions originate from the gnome-shell source code, Copyright (c)
 * its respectives authors.
 * Portions originate from the gnome-shell project-hamster-extension source
 * code, Copyright (c) its respectives authors.
 * This project is released under the GNU GPL License.
 *
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
const Gettext = imports.gettext.domain('hamster-shell-extension');
const _ = Gettext.gettext;
const N_ = function(x) { return x; };

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Stuff = Me.imports.stuff;


let text, button;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showHello() {
    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

    Tweener.addTween(text,
                     { opacity: 0,
                       time: 2,
                       transition: 'easeOutQuad',
                       onComplete: _hideHello });
}


/* a little box or something */
function CTParentalBox() {
    this._init.apply(this, arguments);
}


CTParentalBox.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(itemParams) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {reactive: false});

        let box = new St.BoxLayout({style_class: 'ctparental-box'});
        box.set_vertical(true);

        let label = new St.Label({style_class: 'ctparental-box-label'});
        label.set_text(_("What are you doing?"));
        box.add(label);

				//-------------------
				let helloFile = Gio.File.new_for_path('~/.local/share/gnome-shell/extensions/thibaut@tribu-ml.fr/test');
				let monitor = helloFile.monitor(Gio.FileMonitorFlags.NONE, null);
				monitor.connect('changed', function (file, otherFile, eventType) {
						// change your UI here
				});
				
				Mainloop.timeout_add(60, function () { 
						let stuff = GLib.spawn_command_line_sync("your_command")[1].toString();
						let label = new St.Label({ text: stuff });
						box.add(label);
						button.set_child(label);
						return true;
				});

				//-------------------

        this._textEntry = new St.Entry({name: 'searchEntry',
                                        can_focus: true,
                                        track_hover: true,
                                        hint_text: _("Enter activity...")});
        this._textEntry.clutter_text.connect('activate', Lang.bind(this, this._onEntryActivated));
        this._textEntry.clutter_text.connect('key-release-event', Lang.bind(this, this._onKeyReleaseEvent));


        box.add(this._textEntry);

        // autocomplete popup - couldn't spark it up just yet
        //this._popup = new PopupMenu.PopupComboMenu(this._textEntry);

        label = new St.Label({style_class: 'ctparental-box-label'});
        label.set_text(_("Today's activities"));
        box.add(label);

        let scrollbox = new St.ScrollView({style_class: 'ctparental-scrollbox'});
        this._scrollAdjustment = scrollbox.vscroll.adjustment;
        box.add(scrollbox);

        // Since St.Table does not implement StScrollable, we create a
        // container object that does.
        let container = new St.BoxLayout({});
        container.set_vertical(true);
        scrollbox.add_actor(container);

        this.activities = new St.Widget({style_class: 'ctparental-activities',
                                         layout_manager: new Clutter.TableLayout(),
                                         reactive: true });
        container.add(this.activities);

        this.summaryLabel = new St.Label({style_class: 'summary-label'});
        box.add(this.summaryLabel);


        this.actor.add_child(box);

        this.autocompleteActivities = [];
        this.runningActivitiesQuery = null;

        this._prevText = "";
    },

    focus: function() {
        Mainloop.timeout_add(20, Lang.bind(this, function() {
            // scroll the activities to the bottom
            this._scrollAdjustment.value = this._scrollAdjustment.upper;

            // focus the text entry
            global.stage.set_key_focus(this._textEntry);
        }));
    },

    blur: function() {
        global.stage.set_key_focus(null);
    },

    _onEntryActivated: function() {
        this.emit('activate');
        this._textEntry.set_text('');
    },


    _getActivities: function() {
        if (this.runningActivitiesQuery)
            return this.autocompleteActivities;

        this.runningActivitiesQuery = true;
        this.proxy.GetActivitiesRemote("", Lang.bind(this, function([response], err) {
            this.runningActivitiesQuery = false;
            this.autocompleteActivities = response;
        }));

        return this.autocompleteActivities;
    },

    _onKeyReleaseEvent: function(textItem, evt) {
        let symbol = evt.get_key_symbol();
        let text = this._textEntry.get_text().toLowerCase();
        let starttime = "";
        let activitytext = text;

        // Don't include leading times in the activity autocomplete
        let match = [];
        if ((match = text.match(/^\d\d:\d\d /)) ||
            (match = text.match(/^-\d+ /))) {
            starttime = text.substring(0, match[0].length);
            activitytext = text.substring(match[0].length);
        }

        // if nothing has changed or we still have selection then that means
        // that special keys are at play and we don't attempt to autocomplete
        if (activitytext == "" ||
            this._prevText == text ||
            this._textEntry.clutter_text.get_selection()) {
            return;
        }
        this._prevText = text;

        // ignore deletions
        let ignoreKeys = [Clutter.BackSpace, Clutter.Delete, Clutter.Escape];
        for (var key of ignoreKeys) {
            if (symbol == key)
                return;
        }


        let allActivities = this._getActivities();
        for (var rec of allActivities) {
            let completion = rec[0];
            if (rec[1].length > 0)
                completion += "@" + rec[1];
            if (completion.toLowerCase().substring(0, activitytext.length) == activitytext) {
                this.prevText = text;
                completion = starttime + completion;

                this._textEntry.set_text(completion);
                this._textEntry.clutter_text.set_selection(text.length, completion.length);

                this._prevText = completion.toLowerCase();

                return;
            }
        }
    }
};


function ExtensionController(extensionMeta) {
    let dateMenu = Main.panel.statusArea.dateMenu;

    return {
        extensionMeta: extensionMeta,
        extension: null,
        settings: null,
        placement: 0,
        activitiesText: null,

        enable: function() {
            this.settings = Convenience.getSettings();
            this.extension = new CTParentalExtension(this.extensionMeta);

            this.placement = this.settings.get_int("panel-placement");
            if (this.placement == 1) {
                Main.panel.addToStatusArea("CTParental", this.extension, 0, "center");

                Main.panel._centerBox.remove_actor(dateMenu.container);
                Main.panel._addToPanelBox('dateMenu', dateMenu, -1, Main.panel._rightBox);

            } else if (this.placement == 2) {
                this._activitiesText = Main.panel._leftBox.get_children()[0].get_children()[0].get_children()[0].get_children()[0].get_text();
                Main.panel._leftBox.get_children()[0].get_children()[0].get_children()[0].get_children()[0].set_text('');
                Main.panel.addToStatusArea("CTParental", this.extension, 1, "left");

            } else {
                Main.panel.addToStatusArea("CTParental", this.extension, 0, "right");
            }

            Main.panel.menuManager.addMenu(this.extension.menu);


            Main.wm.addKeybinding("show-ctparental-dropdown",
                this.extension._settings,
                Meta.KeyBindingFlags.NONE,
                //since Gnome 3.16, Shell.KeyBindingMode is replaced by Shell.ActionMode
                Shell.KeyBindingMode ? Shell.KeyBindingMode.ALL : Shell.ActionMode.ALL,
                Lang.bind(this.extension, this.extension.toggle)
            );
        },

        disable: function() {
            Main.wm.removeKeybinding("show-ctparectal-dropdown");

            if (this.placement == 1) {
                Main.panel._rightBox.remove_actor(dateMenu.container);
                Main.panel._addToPanelBox('dateMenu', dateMenu, Main.sessionMode.panel.center.indexOf('dateMenu'), Main.panel._centerBox);

            } else if (this.placement == 2) {
                Main.panel._leftBox.get_children()[0].get_children()[0].get_children()[0].get_children()[0].set_text(this._activitiesText);
            }

            Main.panel.menuManager.removeMenu(this.extension.menu);

            GLib.source_remove(this.extension.timeout);
            this.extension.actor.destroy();
            this.extension.destroy();
            this.extension = null;
        }
    };
}


function init(extensionMeta) {
    Convenience.initTranslations("ctparental-shell-extension");
    return new ExtensionController(extensionMeta);
}

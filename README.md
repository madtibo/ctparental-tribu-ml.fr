# ctparental-tribu-ml.fr


Thanks to dAKirby309 from its icon from deviantart (CC Attribution 3.0 license).


# create pot file
xgettext -k_ -kN_ -o messages.pot extension.js prefs.js stuff.js 

# compile po file
msgfmt -o locale/fr/LC_MESSAGES/fr.mo  locale/fr/LC_MESSAGES/fr.po

# compile xml schema
glib-compile-schemas schemas

# looking glass : Alt-F2 > lg

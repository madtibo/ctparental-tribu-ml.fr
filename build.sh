#!/bin/bash

# compile po file
msgfmt -o locale/fr/LC_MESSAGES/ctparental-time-displayer.mo locale/fr/LC_MESSAGES/ctparental-time-displayer.po

# compile xml schema
glib-compile-schemas schemas

# build zip suitable for upload to extensions.gnome.org
zip -r ctparental@tribu-ml.fr.zip * -x "*~" 

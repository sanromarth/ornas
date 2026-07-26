use gtk::prelude::*;

fn test_api(clipboard: &gtk::Clipboard) {
    clipboard.request_targets(|_, targets| {});
    clipboard.request_text(|_, text| {});
    clipboard.request_image(|_, image| {});
    clipboard.request_uris(|_, uris| {});
    clipboard.request_contents(&gtk::gdk::Atom::intern("x-special/gnome-copied-files"), |_, data| {});
}

use gtk::prelude::*;
fn main() {
    let clipboard = gtk::Clipboard::get(&gtk::gdk::SELECTION_CLIPBOARD);
    clipboard.request_image(|cb, pixbuf| {
        let _p: Option<&gtk::gdk_pixbuf::Pixbuf> = pixbuf;
    });
}

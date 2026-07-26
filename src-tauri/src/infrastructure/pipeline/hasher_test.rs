use xxhash_rust::xxh64::Xxh64;

fn main() {
    let mut hasher = Xxh64::new(0);
    hasher.update(b"hello");
    println!("{:016x}", hasher.digest());
}

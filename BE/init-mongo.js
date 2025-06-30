db = db.getSiblingDB("admin");

try {
  db.createUser({
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    pwd: process.env.MONGO_INITDB_ROOT_PASSWORD,
    roles: [{ role: "root", db: "admin" }],
  });
  print("User created successfully");
} catch (error) {
  if (error.code === 51003) {
    print("User already exists, skipping creation");
  } else {
    print("Error creating user: " + error.message);
  }
}

db = db.getSiblingDB(process.env.MONGO_DATABASE);

db.createCollection("news");
db.createCollection("disclosures");

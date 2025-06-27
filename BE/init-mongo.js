db = db.getSiblingDB("admin");

db.createUser({
  user: process.env.MONGO_INITDB_ROOT_USERNAME,
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD,
  roles: [{ role: "root", db: "admin" }],
});

db = db.getSiblingDB(process.env.MONGO_DATABASE);

db.createCollection("news");
db.createCollection("disclosures");

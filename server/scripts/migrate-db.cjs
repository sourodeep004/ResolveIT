
require("dotenv").config();
const mongoose = require("mongoose");

const collections = ["users", "tickets", "comments", "auditlogs"];

async function migrate() {
  const sourceUri = process.env.MONGODB_URI;

  if (!sourceUri) {
    throw new Error("MONGODB_URI is missing from server/.env");
  }

  // Keep the existing Atlas hosts and connection options.
  const targetUri = sourceUri.replace(
    /\/test(?=\?|$)/,
    "/resolveit"
  );

  if (targetUri === sourceUri) {
    throw new Error(
      "Source URI must point to the test database. Check server/.env."
    );
  }

  const source = new mongoose.Mongoose();
  const target = new mongoose.Mongoose();

  try {
    await source.connect(sourceUri);
    await target.connect(targetUri);

    const sourceDb = source.connection.db;
    const targetDb = target.connection.db;

    if (
      sourceDb.databaseName !== "test" ||
      targetDb.databaseName !== "resolveit"
    ) {
      throw new Error("Database names do not match expected source and target.");
    }

    for (const name of collections) {
      const sourceExists = await sourceDb
        .listCollections({ name }, { nameOnly: true })
        .hasNext();

      if (!sourceExists) {
        console.log(`Skipping missing source collection: ${name}`);
        continue;
      }

      const documents = await sourceDb
        .collection(name)
        .find({})
        .toArray();

      if (documents.length === 0) {
        console.log(`${name}: no source documents`);
        continue;
      }

      const destination = targetDb.collection(name);

      // Preserve existing destination records and avoid overwriting them.
      const existingIds = await destination
        .find(
          { _id: { $in: documents.map((doc) => doc._id) } },
          { projection: { _id: 1 } }
        )
        .toArray();

      const existingSet = new Set(
        existingIds.map((doc) => doc._id.toString())
      );

      const missing = documents.filter(
        (doc) => !existingSet.has(doc._id.toString())
      );

      if (missing.length > 0) {
        await destination.insertMany(missing, { ordered: true });
      }

      console.log(
        `${name}: source=${documents.length}, ` +
        `already present=${existingIds.length}, copied=${missing.length}`
      );
    }

    console.log("Migration copy completed. Verify data before deleting anything.");
  } finally {
    await Promise.allSettled([source.disconnect(), target.disconnect()]);
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});

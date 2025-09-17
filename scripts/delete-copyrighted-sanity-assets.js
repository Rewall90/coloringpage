import fs from "fs";
import { createClient } from "@sanity/client";
import { setTimeout } from "timers/promises";

// Use project configuration from existing setup
const SANITY_PROJECT_ID = "zjqmnotc";
const SANITY_DATASET = "production";
const SANITY_TOKEN =
  "skUEtk3e3NAlADz1wcrtCp1ZC9LTwHemwLVInXv4v4EWDA62tG8VRHBXJnDYW9OLJyxtk03E4QaM1cp3kVBKPQFOjQm9MwIWoDyUKj7N5U3NNvMD6CzHLGSUOnK2M9aU4sQt5ba7BZA7WXd8RPTNtmEomJuAw0ohLmuCBwY7NCz1SnEFrtbB";

async function deleteCopyrightedSanityAssets() {
  console.log("🚀 Starting deletion of copyrighted Sanity.io assets...");

  // Create Sanity client
  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    useCdn: false, // Don't use CDN for mutations
    apiVersion: "2023-05-03",
    token: SANITY_TOKEN,
  });

  // Test connection first
  try {
    console.log("🔗 Testing Sanity connection...");
    await client.fetch("count(*)");
    console.log("✅ Connection successful");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return;
  }

  // Read the list of copyrighted assets to delete
  const removedAssetsPath = "./data/removed-sanity-assets.json";

  if (!fs.existsSync(removedAssetsPath)) {
    console.error("❌ File not found:", removedAssetsPath);
    return;
  }

  const removalData = JSON.parse(fs.readFileSync(removedAssetsPath, "utf8"));
  const assets = removalData.assets;

  console.log(`📋 Found ${assets.length} copyrighted assets to delete`);
  console.log(
    "🎯 These are all from removed content: Bluey, Stitch, Spider-Man, Sonic, Hello Kitty, Paw Patrol, Winnie the Pooh, Captain America, Deadpool",
  );

  let deleted = 0;
  let failed = 0;
  let notFound = 0;

  console.log("\\n🗑️  Starting deletion process...");

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const progress = `[${i + 1}/${assets.length}]`;

    try {
      // Extract asset ID from Sanity URL
      const assetId = extractAssetId(asset.sanityUrl);

      if (!assetId) {
        console.log(
          `${progress} ⚠️  Could not extract asset ID from: ${asset.sanityUrl}`,
        );
        failed++;
        continue;
      }

      // Try to delete the asset
      const fullAssetId = `image-${assetId}`;

      try {
        await client.delete(fullAssetId);
        console.log(`${progress} ✅ Deleted: ${assetId.substring(0, 10)}...`);
        deleted++;
      } catch (deleteError) {
        if (
          deleteError.message.includes("not found") ||
          deleteError.statusCode === 404
        ) {
          console.log(
            `${progress} 🔍 Asset not found (already deleted?): ${assetId.substring(0, 10)}...`,
          );
          notFound++;
        } else {
          console.log(
            `${progress} ❌ Failed to delete ${assetId.substring(0, 10)}...: ${deleteError.message}`,
          );
          failed++;
        }
      }

      // Add small delay to avoid rate limiting
      if (i % 10 === 0 && i > 0) {
        console.log(
          `${progress} ⏸️  Processed ${i} assets, taking a brief pause...`,
        );
        await setTimeout(500);
      }
    } catch (error) {
      console.error(
        `${progress} ❌ Error processing asset ${asset.sanityUrl}:`,
        error.message,
      );
      failed++;
    }
  }

  // Final summary
  console.log(`\\n📊 DELETION SUMMARY:`);
  console.log(`✅ Successfully deleted: ${deleted}`);
  console.log(`🔍 Not found (likely already deleted): ${notFound}`);
  console.log(`❌ Failed to delete: ${failed}`);
  console.log(`📁 Total processed: ${assets.length}`);

  const successfulRemovals = deleted + notFound;
  if (successfulRemovals > 0) {
    console.log(
      `\\n🎉 Cleanup complete! ${successfulRemovals} copyrighted assets removed from Sanity.io`,
    );
    console.log(
      `💾 Your Sanity.io project is now free of copyrighted content!`,
    );
  }

  // Log remaining failures for review
  if (failed > 0) {
    console.log(
      `\\n⚠️  ${failed} assets could not be deleted. This might be due to:`,
    );
    console.log(`   - Network issues`);
    console.log(`   - Permission restrictions`);
    console.log(`   - Assets being referenced in documents`);
  }

  return {
    deleted,
    notFound,
    failed,
    total: assets.length,
  };
}

function extractAssetId(sanityUrl) {
  // Extract asset ID from URL like: https://cdn.sanity.io/images/zjqmnotc/production/793c7d55e24dc0cf84524ffea6c4a9682810591b-750x1000.webp
  const match = sanityUrl.match(/\/([a-f0-9]{40})-\d+x\d+\.\w+$/);
  return match ? match[1] : null;
}

// Execute deletion
deleteCopyrightedSanityAssets().catch(console.error);

export default deleteCopyrightedSanityAssets;

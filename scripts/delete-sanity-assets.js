import fs from "fs";
import fetch from "node-fetch"; // You may need to install: npm install node-fetch
import { setTimeout } from "timers/promises";

// CONFIGURATION - Replace with your actual values
const SANITY_PROJECT_ID = "zjqmnotc"; // From your URLs
const SANITY_DATASET = "production"; // From your URLs
const SANITY_TOKEN = "YOUR_SANITY_TOKEN_HERE"; // You need to provide this

async function deleteSanityAssets() {
  console.log("🚀 Starting Sanity.io asset deletion...");

  // Read the list of assets to delete
  const removedAssetsPath = "./data/removed-sanity-assets.json";

  if (!fs.existsSync(removedAssetsPath)) {
    console.error("❌ File not found:", removedAssetsPath);
    return;
  }

  const removalData = JSON.parse(fs.readFileSync(removedAssetsPath, "utf8"));
  const assets = removalData.assets;

  console.log(`📋 Found ${assets.length} assets to delete`);

  if (!SANITY_TOKEN || SANITY_TOKEN === "YOUR_SANITY_TOKEN_HERE") {
    console.error("❌ Please set your SANITY_TOKEN in the script");
    console.log("   Get your token from: https://manage.sanity.io/");
    console.log("   Go to: Settings > API > Tokens > Create new token");
    console.log('   Give it "Editor" permissions');
    return;
  }

  let deleted = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      // Extract asset ID from Sanity URL
      const assetId = extractAssetId(asset.sanityUrl);

      if (!assetId) {
        console.log(`⚠️  Could not extract asset ID from: ${asset.sanityUrl}`);
        failed++;
        continue;
      }

      console.log(`🗑️  Deleting asset: ${assetId}`);

      const response = await fetch(
        `https://${SANITY_PROJECT_ID}.api.sanity.io/v1/assets/images/${SANITY_DATASET}/${assetId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${SANITY_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log(`✅ Deleted: ${assetId}`);
        deleted++;
      } else {
        const errorText = await response.text();
        console.log(
          `❌ Failed to delete ${assetId}: ${response.status} ${errorText}`,
        );
        failed++;
      }

      // Add small delay to avoid rate limiting
      await setTimeout(100);
    } catch (error) {
      console.error(
        `❌ Error deleting asset ${asset.sanityUrl}:`,
        error.message,
      );
      failed++;
    }
  }

  console.log(`\n📊 DELETION SUMMARY:`);
  console.log(`✅ Successfully deleted: ${deleted}`);
  console.log(`❌ Failed to delete: ${failed}`);
  console.log(`📁 Total processed: ${assets.length}`);

  if (deleted > 0) {
    console.log(
      `\n🎉 Cleanup complete! ${deleted} copyrighted assets removed from Sanity.io`,
    );
  }
}

function extractAssetId(sanityUrl) {
  // Extract asset ID from URL like: https://cdn.sanity.io/images/zjqmnotc/production/793c7d55e24dc0cf84524ffea6c4a9682810591b-750x1000.webp
  const match = sanityUrl.match(/\/([a-f0-9]{40})-\d+x\d+\.\w+$/);
  return match ? match[1] : null;
}

// Execute if run directly
deleteSanityAssets().catch(console.error);

export default deleteSanityAssets;

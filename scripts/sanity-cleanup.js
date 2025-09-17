import fs from "fs";

function cleanSanityAssets() {
  const manifestPath = "./static/images/.download-manifest.json";
  const removedAssetsPath = "./data/removed-sanity-assets.json";

  console.log("Starting Sanity.io asset cleanup...");

  if (!fs.existsSync(manifestPath)) {
    console.log("No manifest file found at:", manifestPath);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const toRemove = [];
  const copyrightedKeywords = [
    "bluey",
    "stitch",
    "spider-man",
    "sonic",
    "hello-kitty",
    "paw-patrol",
    "winnie-the-pooh",
    "captain-america",
    "deadpool",
  ];

  Object.entries(manifest.images).forEach(([localPath, data]) => {
    const shouldRemove = copyrightedKeywords.some((keyword) =>
      localPath.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (shouldRemove) {
      toRemove.push({
        localPath,
        sanityUrl: data.sanityUrl,
        fileSize: data.fileSize,
        removedAt: new Date().toISOString(),
      });

      // Remove from manifest
      delete manifest.images[localPath];

      // Remove local file if it exists
      const fullLocalPath = `./static${localPath}`;
      if (fs.existsSync(fullLocalPath)) {
        try {
          fs.unlinkSync(fullLocalPath);
          console.log(`Removed local file: ${fullLocalPath}`);
        } catch (error) {
          console.error(`Error removing ${fullLocalPath}:`, error.message);
        }
      }
    }
  });

  // Update manifest
  manifest.lastUpdate = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Save removal log
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }

  const removalLog = {
    removedAt: new Date().toISOString(),
    totalRemoved: toRemove.length,
    assets: toRemove,
  };

  fs.writeFileSync(removedAssetsPath, JSON.stringify(removalLog, null, 2));

  console.log(`✅ Cleaned ${toRemove.length} copyrighted assets from manifest`);
  console.log(`📝 Removal log saved to: ${removedAssetsPath}`);
  console.log(`📋 Updated manifest saved to: ${manifestPath}`);

  if (toRemove.length > 0) {
    console.log("\n🔗 Sanity.io URLs that should be manually deleted:");
    toRemove.forEach((asset) => {
      console.log(`- ${asset.sanityUrl}`);
    });

    console.log(
      "\n⚠️  IMPORTANT: These URLs are still hosted on Sanity.io CDN.",
    );
    console.log(
      "   You should manually delete them from your Sanity.io project.",
    );
  }

  return toRemove;
}

// Execute if run directly
cleanSanityAssets();

export default cleanSanityAssets;

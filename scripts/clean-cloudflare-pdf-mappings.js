import fs from "fs";
import path from "path";

const COPYRIGHTED_KEYWORDS = [
  "bluey",
  "stitch",
  "spider-man",
  "sonic",
  "hello-kitty",
  "paw-patrol",
  "winnie",
  "pooh",
  "captain-america",
  "deadpool",
  "labubu",
];

function cleanPDFMappings() {
  console.log(
    "🚀 Cleaning copyrighted PDF mappings from Cloudflare Workers...",
  );

  const cloudflareDir = "./cloudflare-workers/pdf-proxy";
  const mappingFiles = [
    "temp-test-mappings.json",
    "temp-small-mappings.json",
    "bulk-test-mappings.json",
  ];

  const cleanupResults = {
    totalRemoved: 0,
    fileResults: {},
    removedMappings: [],
  };

  mappingFiles.forEach((fileName) => {
    const filePath = path.join(cloudflareDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fileName}`);
      return;
    }

    console.log(`\\n📄 Processing: ${fileName}`);

    try {
      const content = fs.readFileSync(filePath, "utf8");
      let data;

      try {
        data = JSON.parse(content);
      } catch (parseError) {
        console.log(`❌ Invalid JSON in ${fileName}: ${parseError.message}`);
        return;
      }

      let originalCount = 0;
      let removedCount = 0;
      const cleanedData = {};
      const removedEntries = [];

      // Handle both object and array formats
      if (Array.isArray(data)) {
        // Array format like bulk-test-mappings.json
        originalCount = data.length;

        const cleanedArray = data.filter((item) => {
          const key = item.key || "";
          const shouldRemove = COPYRIGHTED_KEYWORDS.some((keyword) =>
            key.toLowerCase().includes(keyword.toLowerCase()),
          );

          if (shouldRemove) {
            removedEntries.push({
              key: item.key,
              value: item.value,
              file: fileName,
            });
            removedCount++;
            return false;
          }
          return true;
        });

        fs.writeFileSync(filePath, JSON.stringify(cleanedArray, null, 2));
      } else {
        // Object format like temp-small-mappings.json
        originalCount = Object.keys(data).length;

        Object.entries(data).forEach(([key, value]) => {
          const shouldRemove = COPYRIGHTED_KEYWORDS.some((keyword) =>
            key.toLowerCase().includes(keyword.toLowerCase()),
          );

          if (shouldRemove) {
            removedEntries.push({
              key,
              value,
              file: fileName,
            });
            removedCount++;
          } else {
            cleanedData[key] = value;
          }
        });

        fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
      }

      cleanupResults.fileResults[fileName] = {
        originalCount,
        removedCount,
        cleanCount: originalCount - removedCount,
      };

      cleanupResults.totalRemoved += removedCount;
      cleanupResults.removedMappings.push(...removedEntries);

      console.log(`   📊 Original entries: ${originalCount}`);
      console.log(`   🗑️  Removed: ${removedCount} copyrighted mappings`);
      console.log(
        `   ✅ Clean entries remaining: ${originalCount - removedCount}`,
      );
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
    }
  });

  // Save cleanup log
  const logPath = "./data/cloudflare-pdf-cleanup.json";
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }

  const logData = {
    cleanupDate: new Date().toISOString(),
    ...cleanupResults,
  };

  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

  // Final summary
  console.log(`\\n📊 CLOUDFLARE PDF CLEANUP SUMMARY:`);
  console.log(
    `🗑️  Total copyrighted mappings removed: ${cleanupResults.totalRemoved}`,
  );
  console.log(`📋 Files processed: ${mappingFiles.length}`);
  console.log(`📄 Cleanup log saved to: ${logPath}`);

  if (cleanupResults.totalRemoved > 0) {
    console.log(
      `\\n🎉 Cloudflare Workers PDF proxy cleaned of copyrighted content!`,
    );
    console.log(`💾 All copyrighted PDF mappings have been removed.`);

    console.log(
      `\\n🔗 Note: The actual PDF files on Sanity.io CDN should also be cleaned`,
    );
    console.log(`   (This was likely done in the previous Sanity cleanup)`);
  } else {
    console.log(`\\n✅ No copyrighted PDF mappings found.`);
  }

  return cleanupResults;
}

// Execute cleanup
cleanPDFMappings();

export default cleanPDFMappings;

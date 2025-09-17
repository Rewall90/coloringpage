import fs from "fs";
import path from "path";

const COPYRIGHTED_KEYWORDS = [
  // Disney/Animation
  "bluey",
  "bingo",
  "bandit",
  "chilli",
  "heeler",
  "stitch",
  "lilo",
  "angel",
  "experiment",
  "winnie",
  "pooh",
  "piglet",
  "eeyore",
  "tigger",
  "christopher robin",
  "mickey",
  "minnie",
  "donald",
  "goofy",
  "pluto",
  "elsa",
  "anna",
  "frozen",
  "olaf",
  "kristoff",
  "moana",
  "maui",
  "rapunzel",
  "tangled",
  "belle",
  "beast",
  "beauty and the beast",
  "ariel",
  "little mermaid",
  "sebastian",
  "simba",
  "lion king",
  "mufasa",
  "timon",
  "pumbaa",

  // Marvel/Superheroes
  "spider-man",
  "spiderman",
  "peter parker",
  "spider man",
  "captain america",
  "steve rogers",
  "iron man",
  "tony stark",
  "thor",
  "hulk",
  "bruce banner",
  "deadpool",
  "wade wilson",
  "wolverine",
  "x-men",
  "batman",
  "superman",
  "wonder woman",
  "flash",
  "green lantern",
  "aquaman",

  // Video Game Characters
  "sonic",
  "hedgehog",
  "tails",
  "knuckles",
  "shadow",
  "amy rose",
  "mario",
  "luigi",
  "bowser",
  "princess peach",
  "zelda",
  "link",
  "ganondorf",
  "pikachu",
  "pokemon",
  "pokémon",
  "charizard",
  "squirtle",
  "pac-man",
  "pacman",

  // Other Licensed Characters
  "hello kitty",
  "my melody",
  "badtz-maru",
  "keroppi",
  "paw patrol",
  "chase",
  "marshall",
  "skye",
  "rubble",
  "transformers",
  "optimus prime",
  "bumblebee",
  "teenage mutant ninja turtles",
  "tmnt",

  // Companies/Brands
  "disney",
  "marvel",
  "dc comics",
  "sanrio",
  "sega",
  "nintendo",
  "sony",
  "paramount",
  "universal",
  "warner",
];

function auditContent() {
  const contentDir = "./content";
  const violations = [];

  console.log("Starting comprehensive content audit...");
  console.log(
    `Scanning for ${COPYRIGHTED_KEYWORDS.length} copyrighted keywords`,
  );

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} does not exist`);
      return;
    }

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith(".md")) {
        const content = fs.readFileSync(filePath, "utf8");
        const foundViolations = findViolations(content);

        if (foundViolations.length > 0) {
          violations.push({
            file: filePath,
            url: generateURL(filePath),
            violations: foundViolations,
            riskLevel: assessRiskLevel(foundViolations),
          });
        }
      }
    });
  }

  function findViolations(content) {
    const found = [];
    const lowerContent = content.toLowerCase();

    COPYRIGHTED_KEYWORDS.forEach((keyword) => {
      if (lowerContent.includes(keyword.toLowerCase())) {
        found.push({
          keyword,
          context: extractContext(content, keyword),
          locations: findAllOccurrences(lowerContent, keyword.toLowerCase()),
        });
      }
    });

    return found;
  }

  function extractContext(content, keyword) {
    const lines = content.split("\n");
    const contexts = [];

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        contexts.push({
          line: index + 1,
          text: line.trim(),
        });
      }
    });

    return contexts;
  }

  function findAllOccurrences(content, keyword) {
    const occurrences = [];
    let index = content.indexOf(keyword);

    while (index !== -1) {
      occurrences.push(index);
      index = content.indexOf(keyword, index + 1);
    }

    return occurrences;
  }

  function generateURL(filePath) {
    return filePath
      .replace("./content/", "/")
      .replace(".md", "/")
      .replace(/\\/g, "/");
  }

  function assessRiskLevel(violations) {
    const highRiskKeywords = [
      "disney",
      "marvel",
      "pokemon",
      "hello kitty",
      "sonic",
      "spider-man",
      "bluey",
      "stitch",
      "paw patrol",
    ];

    const hasHighRisk = violations.some((v) =>
      highRiskKeywords.includes(v.keyword.toLowerCase()),
    );

    if (hasHighRisk) return "HIGH";
    if (violations.length > 3) return "MEDIUM";
    return "LOW";
  }

  // Start scanning
  scanDirectory(contentDir);

  // Generate reports
  const auditResults = {
    timestamp: new Date().toISOString(),
    totalFiles: violations.length,
    riskBreakdown: {
      high: violations.filter((v) => v.riskLevel === "HIGH").length,
      medium: violations.filter((v) => v.riskLevel === "MEDIUM").length,
      low: violations.filter((v) => v.riskLevel === "LOW").length,
    },
    violations: violations,
  };

  // Ensure data directory exists
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }

  // Save detailed audit
  fs.writeFileSync(
    "./data/copyright-audit.json",
    JSON.stringify(auditResults, null, 2),
  );

  // Save simple removal list
  const removalList = violations.map((v) => ({
    file: v.file,
    url: v.url,
    riskLevel: v.riskLevel,
  }));

  fs.writeFileSync(
    "./data/content-removal-list.json",
    JSON.stringify(removalList, null, 2),
  );

  // Console summary
  console.log(`\n📊 AUDIT COMPLETE`);
  console.log(`📁 Files scanned: ${violations.length}`);
  console.log(`🔴 High risk: ${auditResults.riskBreakdown.high}`);
  console.log(`🟡 Medium risk: ${auditResults.riskBreakdown.medium}`);
  console.log(`🟢 Low risk: ${auditResults.riskBreakdown.low}`);
  console.log(`📄 Detailed report: ./data/copyright-audit.json`);
  console.log(`📋 Removal list: ./data/content-removal-list.json`);

  if (violations.length > 0) {
    console.log(`\n⚠️  VIOLATIONS FOUND:`);
    violations.forEach((v) => {
      console.log(
        `${v.riskLevel === "HIGH" ? "🔴" : v.riskLevel === "MEDIUM" ? "🟡" : "🟢"} ${v.file} (${v.violations.length} violations)`,
      );
    });
  } else {
    console.log(`\n✅ No copyright violations found!`);
  }

  return auditResults;
}

// Execute audit
auditContent();

export default auditContent;

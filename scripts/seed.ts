import { db } from "../server/db";
import { storage } from "../server/storage";

async function runSeed() {
  console.log("Seeding database...");
  
  const existingJobs = await storage.getJobs();
  if (existingJobs.length === 0) {
    console.log("Creating sample job...");
    await storage.createJob({
      name: "Master Bedroom Renovation",
      clientName: "Alice Johnson",
      location: "Providence, RI",
      notes: "Baseboards, new closet doors, and window trim.",
      status: "draft",
      items: [
        { category: "Baseboard", quantity: 120, unitPrice: "2.50" },
        { category: "Door install", quantity: 3, unitPrice: "150.00" },
        { category: "Trim", quantity: 1, unitPrice: "450.00" }
      ]
    });
  }

  const existingSettings = await storage.getSettings();
  // Ensure we have some reasonable defaults if they match the empty/default schema
  if (existingSettings.defaultTaxRate === "0") {
     console.log("Updating settings defaults...");
     await storage.updateSettings({
       defaultTaxRate: "6.25",
       serviceArea: "Massachusetts & Rhode Island",
       pdfLanguage: "en"
     });
  }

  console.log("Seeding complete.");
}

runSeed().catch(console.error).finally(() => process.exit(0));

import { pgTable, text, serial, integer, numeric, timestamp, boolean, uniqueIndex, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("USER"),
  globalRole: text("global_role").notNull().default("user"),
  isGlobalAdmin: boolean("is_global_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tradeId: integer("trade_id").notNull(),
  ownerUserId: integer("owner_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companyUsers = pgTable("company_users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("USER"),
  isActive: boolean("is_active").notNull().default(true),
  permissions: text("permissions").notNull().default(JSON.stringify({
    canManageUsers: false,
    canViewAllSpecialties: false,
    canViewPrices: true,
    canEditPrices: false,
    canAudit: false,
  })),
}, (table) => [
  uniqueIndex("company_users_unique").on(table.companyId, table.userId),
]);

export const userSpecialties = pgTable("user_specialties", {
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  specialtyId: integer("specialty_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.companyId, table.userId, table.specialtyId] }),
]);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  specialtyId: integer("specialty_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  pricingUnit: text("pricing_unit").notNull().default("EA"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
  description: text("description"),
  active: boolean("active").notNull().default(true),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  tradeId: integer("trade_id").notNull(),
  specialtyId: integer("specialty_id"),
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("DRAFT"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  address: text("address"),
  addressLocked: boolean("address_locked").notNull().default(true),
  addressReleasedAt: text("address_released_at"),
  scheduledAt: text("scheduled_at"),
  doorCode: text("door_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobItems = pgTable("job_items", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  serviceId: integer("service_id").notNull(),
  qty: numeric("qty").notNull().default("0"),
  unitPrice: numeric("unit_price").notNull().default("0"),
  lineTotal: numeric("line_total").notNull().default("0"),
  pricingUnit: text("pricing_unit").notNull().default("EA"),
});

export const jobAssignments = pgTable("job_assignments", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  userId: integer("user_id").notNull(),
  permissions: text("permissions").notNull().default(JSON.stringify({
    canManageUsers: false,
    canViewAllSpecialties: false,
    canViewPrices: true,
    canEditPrices: false,
    canAudit: false,
  })),
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => [
  uniqueIndex("job_assignments_unique").on(table.jobId, table.userId),
]);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  actorUserId: integer("actor_user_id").notNull(),
  action: text("action").notNull(),
  jobId: integer("job_id"),
  meta: text("meta"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companySettings = pgTable("company_settings", {
  companyId: integer("company_id").primaryKey(),
  defaultLanguage: text("default_language").default("en"),
  theme: text("theme").default("premium_dark"),
  taxRate: numeric("tax_rate").default("0"),
  overheadRate: numeric("overhead_rate").default("0"),
  profitRate: numeric("profit_rate").default("0"),
  regionId: integer("region_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  regionId: integer("region_id").notNull(),
  tradeId: integer("trade_id").notNull(),
  specialtyId: integer("specialty_id"),
  unit: text("unit").notNull(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  anchorMultiplier: numeric("anchor_multiplier", { precision: 5, scale: 2 }).notNull().default("1.15"),
  materialMultiplier: jsonb("material_multiplier").notNull().default({ basic: 1.0, standard: 1.15, premium: 1.35 }),
  complexityMultiplier: jsonb("complexity_multiplier").notNull().default({ normal: 1.0, hard: 1.2 }),
  enabled: boolean("enabled").notNull().default(true),
}, (table) => [
  uniqueIndex("pricing_rules_unique").on(table.regionId, table.tradeId, table.specialtyId, table.unit),
]);

export const estimatePhotos = pgTable("estimate_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  companyId: integer("company_id").notNull(),
  url: text("url").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inviteTokens = pgTable("invite_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  companyId: integer("company_id").notNull(),
  createdBy: integer("created_by").notNull(),
  role: text("role").notNull().default("USER"),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: integer("used_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerUserId], references: [users.id] }),
  trade: one(trades, { fields: [companies.tradeId], references: [trades.id] }),
  members: many(companyUsers),
  jobs: many(jobs),
  settings: one(companySettings, { fields: [companies.id], references: [companySettings.companyId] }),
}));

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, { fields: [companyUsers.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyUsers.userId], references: [users.id] }),
}));

export const tradesRelations = relations(trades, ({ many }) => ({
  specialties: many(specialties),
}));

export const specialtiesRelations = relations(specialties, ({ one, many }) => ({
  trade: one(trades, { fields: [specialties.tradeId], references: [trades.id] }),
  services: many(services),
  userSpecialties: many(userSpecialties),
}));

export const userSpecialtiesRelations = relations(userSpecialties, ({ one }) => ({
  company: one(companies, { fields: [userSpecialties.companyId], references: [companies.id] }),
  user: one(users, { fields: [userSpecialties.userId], references: [users.id] }),
  specialty: one(specialties, { fields: [userSpecialties.specialtyId], references: [specialties.id] }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  company: one(companies, { fields: [services.companyId], references: [companies.id] }),
  specialty: one(specialties, { fields: [services.specialtyId], references: [specialties.id] }),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  pricingRules: many(pricingRules),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  region: one(regions, { fields: [pricingRules.regionId], references: [regions.id] }),
  trade: one(trades, { fields: [pricingRules.tradeId], references: [trades.id] }),
  specialty: one(specialties, { fields: [pricingRules.specialtyId], references: [specialties.id] }),
}));

export const estimatePhotosRelations = relations(estimatePhotos, ({ one }) => ({
  job: one(jobs, { fields: [estimatePhotos.jobId], references: [jobs.id] }),
  company: one(companies, { fields: [estimatePhotos.companyId], references: [companies.id] }),
}));

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  company: one(companies, { fields: [inviteTokens.companyId], references: [companies.id] }),
  creator: one(users, { fields: [inviteTokens.createdBy], references: [users.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  trade: one(trades, { fields: [jobs.tradeId], references: [trades.id] }),
  specialty: one(specialties, { fields: [jobs.specialtyId], references: [specialties.id] }),
  creator: one(users, { fields: [jobs.createdBy], references: [users.id] }),
  items: many(jobItems),
  assignments: many(jobAssignments),
  photos: many(estimatePhotos),
}));

export const jobItemsRelations = relations(jobItems, ({ one }) => ({
  job: one(jobs, { fields: [jobItems.jobId], references: [jobs.id] }),
  service: one(services, { fields: [jobItems.serviceId], references: [services.id] }),
}));

export const jobAssignmentsRelations = relations(jobAssignments, ({ one }) => ({
  job: one(jobs, { fields: [jobAssignments.jobId], references: [jobs.id] }),
  user: one(users, { fields: [jobAssignments.userId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(4),
});
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SafeUser = Omit<User, "passwordHash">;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export const insertCompanyUserSchema = createInsertSchema(companyUsers).omit({ id: true });
export type CompanyUser = typeof companyUsers.$inferSelect;

export const insertTradeSchema = createInsertSchema(trades).omit({ id: true });
export type Trade = typeof trades.$inferSelect;

export const insertSpecialtySchema = createInsertSchema(specialties).omit({ id: true });
export type Specialty = typeof specialties.$inferSelect;

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export type Service = typeof services.$inferSelect;

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export const insertJobItemSchema = createInsertSchema(jobItems).omit({ id: true });
export type JobItem = typeof jobItems.$inferSelect;
export type InsertJobItem = z.infer<typeof insertJobItemSchema>;

export const insertJobAssignmentSchema = createInsertSchema(jobAssignments).omit({ id: true, assignedAt: true });
export type JobAssignment = typeof jobAssignments.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({ id: true, createdAt: true });
export type AuditLogEntry = typeof auditLog.$inferSelect;

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({ updatedAt: true });
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

export const insertRegionSchema = createInsertSchema(regions).omit({ id: true });
export type Region = typeof regions.$inferSelect;

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ id: true });
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;

export const insertEstimatePhotoSchema = createInsertSchema(estimatePhotos).omit({ id: true, createdAt: true });
export type EstimatePhoto = typeof estimatePhotos.$inferSelect;

export const insertInviteTokenSchema = createInsertSchema(inviteTokens).omit({ id: true, createdAt: true, usedAt: true, usedBy: true });
export type InviteToken = typeof inviteTokens.$inferSelect;
export type InsertInviteToken = z.infer<typeof insertInviteTokenSchema>;

export type JobWithItems = Job & { items: JobItem[] };

export const TRADE_SLUGS = ["carpentry", "painting", "tile", "house_cleaning"] as const;
export type TradeSlug = typeof TRADE_SLUGS[number];

export const CARPENTRY_SPECIALTY_SLUGS = ["finish", "deck", "stairs", "doors", "windows", "baseboard", "flooring", "framing", "roofing"] as const;
export type CarpentrySpecialtySlug = typeof CARPENTRY_SPECIALTY_SLUGS[number];

export const JOB_STATUSES = ["DRAFT", "SENT", "APPROVED", "IN_PROGRESS", "DONE"] as const;
export type JobStatus = typeof JOB_STATUSES[number];

export const ROLES = ["OWNER", "ADMIN", "USER", "SUPPORT"] as const;
export type Role = typeof ROLES[number];

export const PRICING_UNITS = ["EA", "LF", "SF", "HR", "JOB"] as const;
export type PricingUnit = typeof PRICING_UNITS[number];

export const MATERIAL_TIERS = ["basic", "standard", "premium"] as const;
export type MaterialTier = typeof MATERIAL_TIERS[number];

export const COMPLEXITY_LEVELS = ["normal", "hard"] as const;
export type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];

export const permissionsSchema = z.object({
  canManageUsers: z.boolean(),
  canViewAllSpecialties: z.boolean(),
  canViewPrices: z.boolean(),
  canEditPrices: z.boolean(),
  canAudit: z.boolean(),
});

export type Permissions = z.infer<typeof permissionsSchema>;

export const DEFAULT_EMPLOYEE_PERMISSIONS: Permissions = {
  canManageUsers: false,
  canViewAllSpecialties: false,
  canViewPrices: true,
  canEditPrices: false,
  canAudit: false,
};

export const OWNER_PERMISSIONS: Permissions = {
  canManageUsers: true,
  canViewAllSpecialties: true,
  canViewPrices: true,
  canEditPrices: true,
  canAudit: true,
};

export const ADMIN_PERMISSIONS: Permissions = {
  canManageUsers: true,
  canViewAllSpecialties: true,
  canViewPrices: true,
  canEditPrices: true,
  canAudit: true,
};

export const SUPPORT_PERMISSIONS: Permissions = {
  canManageUsers: true,
  canViewAllSpecialties: false,
  canViewPrices: false,
  canEditPrices: false,
  canAudit: true,
};

export function capPermissions(jobPerms: Permissions, companyPerms: Permissions): Permissions {
  return {
    canManageUsers: jobPerms.canManageUsers && companyPerms.canManageUsers,
    canViewAllSpecialties: jobPerms.canViewAllSpecialties && companyPerms.canViewAllSpecialties,
    canViewPrices: jobPerms.canViewPrices && companyPerms.canViewPrices,
    canEditPrices: jobPerms.canEditPrices && companyPerms.canEditPrices,
    canAudit: jobPerms.canAudit && companyPerms.canAudit,
  };
}

export const SUPPORT_ADMIN_USERNAMES = ["mateus", "admin", "admin_test"] as const;

export function isSupportAdmin(username: string, globalRole?: string): boolean {
  if (globalRole === "support_admin" || globalRole === "super_admin") return true;
  return SUPPORT_ADMIN_USERNAMES.includes(username.toLowerCase() as any);
}

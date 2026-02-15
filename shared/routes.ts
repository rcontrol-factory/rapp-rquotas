import { z } from 'zod';
import { insertJobSchema, insertJobItemSchema, insertCompanySettingsSchema, insertPricingRuleSchema, jobs, jobItems, companySettings, services, trades, specialties, regions, pricingRules, estimatePhotos } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs',
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof jobs.$inferSelect>()),
          stats: z.object({
            total: z.number(),
            drafts: z.number(),
            sent: z.number(),
            approved: z.number(),
            inProgress: z.number(),
            done: z.number(),
          }),
        }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id',
      responses: {
        200: z.custom<typeof jobs.$inferSelect & { items: typeof jobItems.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs',
      input: insertJobSchema.omit({ companyId: true, createdBy: true }).extend({
        items: z.array(insertJobItemSchema.omit({ jobId: true })).optional(),
      }),
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/jobs/:id',
      input: insertJobSchema.omit({ companyId: true, createdBy: true }).partial().extend({
        items: z.array(insertJobItemSchema.omit({ jobId: true }).extend({ id: z.number().optional() })).optional(),
      }),
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/jobs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  trades: {
    list: {
      method: 'GET' as const,
      path: '/api/trades',
      responses: {
        200: z.array(z.custom<typeof trades.$inferSelect>()),
      },
    },
  },
  specialties: {
    list: {
      method: 'GET' as const,
      path: '/api/specialties',
      responses: {
        200: z.array(z.custom<typeof specialties.$inferSelect>()),
      },
    },
    byTrade: {
      method: 'GET' as const,
      path: '/api/trades/:tradeId/specialties',
      responses: {
        200: z.array(z.custom<typeof specialties.$inferSelect>()),
      },
    },
  },
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services',
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
    byTrade: {
      method: 'GET' as const,
      path: '/api/trades/:tradeId/services',
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
    bySpecialty: {
      method: 'GET' as const,
      path: '/api/specialties/:specialtyId/services',
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof companySettings.$inferSelect>(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertCompanySettingsSchema,
      responses: {
        200: z.custom<typeof companySettings.$inferSelect>(),
      },
    },
  },
  regions: {
    list: { method: 'GET' as const, path: '/api/regions', responses: { 200: z.array(z.custom<typeof regions.$inferSelect>()) } },
  },
  pricingRules: {
    list: { method: 'GET' as const, path: '/api/pricing-rules', responses: { 200: z.array(z.custom<typeof pricingRules.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/pricing-rules', input: insertPricingRuleSchema, responses: { 201: z.custom<typeof pricingRules.$inferSelect>() } },
    update: { method: 'PUT' as const, path: '/api/pricing-rules/:id', input: insertPricingRuleSchema.partial(), responses: { 200: z.custom<typeof pricingRules.$inferSelect>() } },
  },
  estimatePhotos: {
    create: { method: 'POST' as const, path: '/api/estimate-photos', responses: { 201: z.custom<typeof estimatePhotos.$inferSelect>() } },
    byJob: { method: 'GET' as const, path: '/api/jobs/:id/photos', responses: { 200: z.array(z.custom<typeof estimatePhotos.$inferSelect>()) } },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

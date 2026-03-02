import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertAppointmentSchema, 
  insertLabResultSchema, 
  insertPrescriptionSchema, 
  insertPatientRequestSchema,
  insertMessageSchema,
  profiles,
  appointments,
  labResults,
  prescriptions,
  patientRequests,
  messages
} from './schema';
import { users } from './models/auth';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Response models combined with user data for display
const profileWithUserSchema = z.custom<typeof profiles.$inferSelect & { user: typeof users.$inferSelect }>();
const appointmentWithDetailsSchema = z.custom<typeof appointments.$inferSelect & { patient: typeof users.$inferSelect, doctor: typeof users.$inferSelect }>();
const labResultWithDetailsSchema = z.custom<typeof labResults.$inferSelect & { patient: typeof users.$inferSelect, doctor?: typeof users.$inferSelect | null }>();
const prescriptionWithDetailsSchema = z.custom<typeof prescriptions.$inferSelect & { patient: typeof users.$inferSelect, doctor: typeof users.$inferSelect }>();
const requestWithPatientSchema = z.custom<typeof patientRequests.$inferSelect & { patient: typeof users.$inferSelect }>();
const messageWithDetailsSchema = z.custom<typeof messages.$inferSelect & { sender: typeof users.$inferSelect, receiver: typeof users.$inferSelect }>();

export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me' as const,
      responses: {
        200: profileWithUserSchema,
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles' as const,
      input: insertProfileSchema,
      responses: {
        201: profileWithUserSchema,
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me' as const,
      input: insertProfileSchema.partial(),
      responses: {
        200: profileWithUserSchema,
        400: errorSchemas.validation,
      }
    },
    doctors: {
      method: 'GET' as const,
      path: '/api/doctors' as const,
      responses: {
        200: z.array(profileWithUserSchema),
      }
    },
    patients: {
      method: 'GET' as const,
      path: '/api/patients' as const,
      responses: {
        200: z.array(profileWithUserSchema),
      }
    }
  },
  appointments: {
    list: {
      method: 'GET' as const,
      path: '/api/appointments' as const,
      responses: {
        200: z.array(appointmentWithDetailsSchema),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/appointments' as const,
      input: insertAppointmentSchema,
      responses: {
        201: appointmentWithDetailsSchema,
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/appointments/:id' as const,
      input: insertAppointmentSchema.partial().extend({ status: z.string().optional() }),
      responses: {
        200: appointmentWithDetailsSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    }
  },
  labResults: {
    list: {
      method: 'GET' as const,
      path: '/api/lab-results' as const,
      responses: {
        200: z.array(labResultWithDetailsSchema),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/lab-results' as const,
      input: insertLabResultSchema,
      responses: {
        201: labResultWithDetailsSchema,
        400: errorSchemas.validation,
      }
    }
  },
  prescriptions: {
    list: {
      method: 'GET' as const,
      path: '/api/prescriptions' as const,
      responses: {
        200: z.array(prescriptionWithDetailsSchema),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/prescriptions' as const,
      input: insertPrescriptionSchema,
      responses: {
        201: prescriptionWithDetailsSchema,
        400: errorSchemas.validation,
      }
    }
  },
  patientRequests: {
    list: {
      method: 'GET' as const,
      path: '/api/requests' as const,
      responses: {
        200: z.array(requestWithPatientSchema),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/requests' as const,
      input: insertPatientRequestSchema,
      responses: {
        201: requestWithPatientSchema,
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/requests/:id' as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: requestWithPatientSchema,
        404: errorSchemas.notFound,
      }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages/:otherUserId' as const,
      responses: {
        200: z.array(messageWithDetailsSchema),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: insertMessageSchema,
      responses: {
        201: messageWithDetailsSchema,
        400: errorSchemas.validation,
      }
    }
  }
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

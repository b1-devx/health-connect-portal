import { pgTable, text, serial, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// re-export auth models
export * from "./models/auth";
import { users } from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'doctor' or 'patient'

  // Basic info (both roles)
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  address: text("address"),
  profilePhotoUrl: text("profile_photo_url"),

  // Doctor fields
  specialty: text("specialty"),
  licenseNumber: text("license_number"),

  // Patient fields
  dateOfBirth: timestamp("date_of_birth"),
  medicalHistory: text("medical_history"),

  // Emergency contact (patient only)
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  emergencyContactPhone: text("emergency_contact_phone"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  datetime: timestamp("datetime").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  meetLink: text("meet_link"),
  notes: text("notes"),
  labFileUrl: text("lab_file_url"),
  labResultText: text("lab_result_text"),
  aiAnalysis: text("ai_analysis"),
});

export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  doctorId: varchar("doctor_id").references(() => users.id),
  title: text("title").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  resultData: text("result_data"),
  fileUrl: text("file_url"),
  fileData: text("file_data"),   // base64 encoded uploaded file
  fileName: text("file_name"),   // original filename
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  instructions: text("instructions").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const patientRequests = pgTable("patient_requests", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'checkup' or 'prescription'
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, fulfilled, rejected
  labFileUrl: text("lab_file_url"),
  labResultText: text("lab_result_text"),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull().default(""),
  attachmentData: text("attachment_data"), // base64 encoded file
  attachmentName: text("attachment_name"), // original filename
  attachmentType: text("attachment_type"), // mime type
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas
export const insertProfileSchema = createInsertSchema(profiles, {
  dateOfBirth: z.string().optional().transform(v => v ? new Date(v) : undefined),
}).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, status: true, aiAnalysis: true });
export const insertLabResultSchema = createInsertSchema(labResults).omit({ id: true, date: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, issuedAt: true });
export const insertPatientRequestSchema = createInsertSchema(patientRequests).omit({ id: true, status: true, createdAt: true, aiAnalysis: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// Explicit Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type PatientRequest = typeof patientRequests.$inferSelect;
export type InsertPatientRequest = z.infer<typeof insertPatientRequestSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Request Types for API
export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;

export type CreateAppointmentRequest = InsertAppointment;
export type UpdateAppointmentRequest = Partial<InsertAppointment>;

export type CreateLabResultRequest = InsertLabResult;
export type CreatePrescriptionRequest = InsertPrescription;
export type CreatePatientRequestDto = InsertPatientRequest;
export type UpdatePatientRequestDto = Partial<InsertPatientRequest>;

import { db } from "./db";
import { eq, or, and } from "drizzle-orm";
import { 
  profiles, 
  appointments, 
  labResults, 
  prescriptions, 
  patientRequests,
  messages,
  users,
  type Profile,
  type InsertProfile,
  type Appointment,
  type InsertAppointment,
  type LabResult,
  type InsertLabResult,
  type Prescription,
  type InsertPrescription,
  type PatientRequest,
  type InsertPatientRequest,
  type Message,
  type InsertMessage,
  type User
} from "@shared/schema";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<(Profile & { user: User }) | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile & { user: User }>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile & { user: User }>;
  getDoctors(): Promise<(Profile & { user: User })[]>;
  getPatientsForDoctor(doctorId: string): Promise<(Profile & { user: User })[]>;
  getAllPatients(): Promise<(Profile & { user: User })[]>;

  // Appointments
  getAppointmentsForUser(userId: string, role: string): Promise<(Appointment & { patient: User, doctor: User })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment & { patient: User, doctor: User }>;
  updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment & { patient: User, doctor: User }>;

  // Lab Results
  getLabResultsForPatient(patientId: string): Promise<(LabResult & { patient: User, doctor: User | null })[]>;
  createLabResult(result: InsertLabResult): Promise<LabResult & { patient: User, doctor: User | null }>;

  // Prescriptions
  getPrescriptionsForPatient(patientId: string): Promise<(Prescription & { patient: User, doctor: User })[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription & { patient: User, doctor: User }>;

  // Patient Requests
  getRequestsForDoctor(doctorId: string): Promise<(PatientRequest & { patient: User })[]>;
  getRequestsForPatient(patientId: string): Promise<(PatientRequest & { patient: User })[]>;
  createPatientRequest(request: InsertPatientRequest): Promise<PatientRequest & { patient: User }>;
  updatePatientRequestStatus(id: number, status: string): Promise<PatientRequest & { patient: User }>;
  updatePatientRequestAiAnalysis(id: number, aiAnalysis: string): Promise<PatientRequest & { patient: User }>;

  // Messages
  getMessages(user1Id: string, user2Id: string): Promise<(Message & { sender: User, receiver: User })[]>;
  createMessage(message: InsertMessage): Promise<Message & { sender: User, receiver: User }>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<(Profile & { user: User }) | undefined> {
    const results = await db.select()
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.userId, userId));
      
    if (!results.length) return undefined;
    return { ...results[0].profiles, user: results[0].users };
  }

  async createProfile(profile: InsertProfile): Promise<Profile & { user: User }> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    const [user] = await db.select().from(users).where(eq(users.id, newProfile.userId));
    return { ...newProfile, user };
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile & { user: User }> {
    const [updatedProfile] = await db.update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId))
      .returning();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return { ...updatedProfile, user };
  }

  async getDoctors(): Promise<(Profile & { user: User })[]> {
    const results = await db.select()
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.role, 'doctor'));
      
    return results.map(r => ({ ...r.profiles, user: r.users }));
  }

  async getPatientsForDoctor(doctorId: string): Promise<(Profile & { user: User })[]> {
    const patientIds = await db.select({ id: appointments.patientId })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));
      
    const ids = Array.from(new Set(patientIds.map(p => p.id)));
    
    if (ids.length === 0) return [];
    
    const results = await db.select()
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.role, 'patient'));
      
    return results.map(r => ({ ...r.profiles, user: r.users }));
  }

  async getAllPatients(): Promise<(Profile & { user: User })[]> {
    const results = await db.select()
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.role, 'patient'));
      
    return results.map(r => ({ ...r.profiles, user: r.users }));
  }

  async getAppointmentsForUser(userId: string, role: string): Promise<(Appointment & { patient: User, doctor: User })[]> {
    const condition = role === 'doctor' 
      ? eq(appointments.doctorId, userId) 
      : eq(appointments.patientId, userId);
      
    const results = await db.select()
      .from(appointments)
      .where(condition);
      
    const fullAppointments = await Promise.all(results.map(async (apt) => {
      const [patient] = await db.select().from(users).where(eq(users.id, apt.patientId));
      const [doctor] = await db.select().from(users).where(eq(users.id, apt.doctorId));
      return { ...apt, patient, doctor };
    }));
    
    return fullAppointments;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment & { patient: User, doctor: User }> {
    const [newApt] = await db.insert(appointments).values(appointment).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, newApt.patientId));
    const [doctor] = await db.select().from(users).where(eq(users.id, newApt.doctorId));
    return { ...newApt, patient, doctor };
  }

  async updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment & { patient: User, doctor: User }> {
    const [updatedApt] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, updatedApt.patientId));
    const [doctor] = await db.select().from(users).where(eq(users.id, updatedApt.doctorId));
    return { ...updatedApt, patient, doctor };
  }

  async getLabResultsForPatient(patientId: string): Promise<(LabResult & { patient: User, doctor: User | null })[]> {
    const results = await db.select().from(labResults).where(eq(labResults.patientId, patientId));
    
    return Promise.all(results.map(async (result) => {
      const [patient] = await db.select().from(users).where(eq(users.id, result.patientId));
      let doctor = null;
      if (result.doctorId) {
        [doctor] = await db.select().from(users).where(eq(users.id, result.doctorId));
      }
      return { ...result, patient, doctor };
    }));
  }

  async createLabResult(result: InsertLabResult): Promise<LabResult & { patient: User, doctor: User | null }> {
    const [newResult] = await db.insert(labResults).values(result).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, newResult.patientId));
    let doctor = null;
    if (newResult.doctorId) {
      [doctor] = await db.select().from(users).where(eq(users.id, newResult.doctorId));
    }
    return { ...newResult, patient, doctor };
  }

  async getPrescriptionsForPatient(patientId: string): Promise<(Prescription & { patient: User, doctor: User })[]> {
    const results = await db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId));
    
    return Promise.all(results.map(async (rx) => {
      const [patient] = await db.select().from(users).where(eq(users.id, rx.patientId));
      const [doctor] = await db.select().from(users).where(eq(users.id, rx.doctorId));
      return { ...rx, patient, doctor };
    }));
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription & { patient: User, doctor: User }> {
    const [newRx] = await db.insert(prescriptions).values(prescription).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, newRx.patientId));
    const [doctor] = await db.select().from(users).where(eq(users.id, newRx.doctorId));
    return { ...newRx, patient, doctor };
  }

  async getRequestsForDoctor(doctorId: string): Promise<(PatientRequest & { patient: User })[]> {
    const results = await db.select().from(patientRequests);
    
    return Promise.all(results.map(async (req) => {
      const [patient] = await db.select().from(users).where(eq(users.id, req.patientId));
      return { ...req, patient };
    }));
  }

  async getRequestsForPatient(patientId: string): Promise<(PatientRequest & { patient: User })[]> {
    const results = await db.select().from(patientRequests).where(eq(patientRequests.patientId, patientId));
    
    return Promise.all(results.map(async (req) => {
      const [patient] = await db.select().from(users).where(eq(users.id, req.patientId));
      return { ...req, patient };
    }));
  }

  async createPatientRequest(request: InsertPatientRequest): Promise<PatientRequest & { patient: User }> {
    const [newReq] = await db.insert(patientRequests).values(request).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, newReq.patientId));
    return { ...newReq, patient };
  }

  async updatePatientRequestStatus(id: number, status: string): Promise<PatientRequest & { patient: User }> {
    const [updatedReq] = await db.update(patientRequests).set({ status }).where(eq(patientRequests.id, id)).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, updatedReq.patientId));
    return { ...updatedReq, patient };
  }

  async updatePatientRequestAiAnalysis(id: number, aiAnalysis: string): Promise<PatientRequest & { patient: User }> {
    const [updatedReq] = await db.update(patientRequests).set({ aiAnalysis }).where(eq(patientRequests.id, id)).returning();
    const [patient] = await db.select().from(users).where(eq(users.id, updatedReq.patientId));
    return { ...updatedReq, patient };
  }

  async getMessages(user1Id: string, user2Id: string): Promise<(Message & { sender: User, receiver: User })[]> {
    const results = await db.select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )
      )
      .orderBy(messages.createdAt);
    
    return Promise.all(results.map(async (msg) => {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      const [receiver] = await db.select().from(users).where(eq(users.id, msg.receiverId));
      return { ...msg, sender, receiver };
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message & { sender: User, receiver: User }> {
    const [newMsg] = await db.insert(messages).values(message).returning();
    const [sender] = await db.select().from(users).where(eq(users.id, newMsg.senderId));
    const [receiver] = await db.select().from(users).where(eq(users.id, newMsg.receiverId));
    return { ...newMsg, sender, receiver };
  }
}

export const storage = new DatabaseStorage();

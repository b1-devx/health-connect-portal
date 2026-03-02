import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  registerAuthRoutes(app);

  // Profile Routes
  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.profiles.create.input.parse({ ...req.body, userId });
      const profile = await storage.createProfile(input);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.profiles.doctors.path, isAuthenticated, async (req, res) => {
    const doctors = await storage.getDoctors();
    res.json(doctors);
  });

  app.get(api.profiles.patients.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    // Assuming doctor viewing patients
    const patients = await storage.getAllPatients();
    res.json(patients);
  });

  // Appointments
  app.get(api.appointments.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    
    const appointments = await storage.getAppointmentsForUser(userId, profile.role);
    res.json(appointments);
  });

  app.post(api.appointments.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.appointments.create.input.extend({ datetime: z.coerce.date() }).parse(req.body);
      const appointment = await storage.createAppointment(input);
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.appointments.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateSchema = z.object({
        status: z.string().optional(),
        meetLink: z.string().optional(),
        notes: z.string().optional(),
        datetime: z.coerce.date().optional()
      });
      const input = updateSchema.parse(req.body);
      // Auto-generate Google Meet link when confirming an appointment
      if (input.status === 'confirmed' && !input.meetLink) {
        input.meetLink = generateMeetLink();
      }
      const appointment = await storage.updateAppointment(id, input);
      res.json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Lab Results
  app.get(api.labResults.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    let targetPatientId = userId;
    // If doctor, they might want a specific patient, but for now we list based on query param
    if (profile?.role === 'doctor' && req.query.patientId) {
      targetPatientId = req.query.patientId as string;
    }
    
    const results = await storage.getLabResultsForPatient(targetPatientId);
    res.json(results);
  });

  app.post(api.labResults.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.labResults.create.input.parse(req.body);
      const result = await storage.createLabResult(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescriptions
  app.get(api.prescriptions.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    let targetPatientId = userId;
    if (profile?.role === 'doctor' && req.query.patientId) {
      targetPatientId = req.query.patientId as string;
    }
    
    const results = await storage.getPrescriptionsForPatient(targetPatientId);
    res.json(results);
  });

  app.post(api.prescriptions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.prescriptions.create.input.parse(req.body);
      const prescription = await storage.createPrescription(input);
      res.status(201).json(prescription);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient Requests
  app.get(api.patientRequests.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role === 'doctor') {
      const requests = await storage.getRequestsForDoctor(userId);
      return res.json(requests);
    } else {
      const requests = await storage.getRequestsForPatient(userId);
      return res.json(requests);
    }
  });

  app.post(api.patientRequests.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.patientRequests.create.input.parse(req.body);
      const request = await storage.createPatientRequest(input);
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.patientRequests.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = api.patientRequests.update.input.parse(req.body);
      const request = await storage.updatePatientRequestStatus(id, status);
      res.json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Analysis for patient requests
  app.post('/api/requests/:id/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // Get all requests (doctor) or patient's requests to find this one
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (profile?.role !== 'doctor') {
        return res.status(403).json({ message: 'Only doctors can run AI analysis' });
      }

      const allRequests = await storage.getRequestsForDoctor(userId);
      const request = allRequests.find(r => r.id === id);
      if (!request) return res.status(404).json({ message: 'Request not found' });

      const patientName = `${request.patient.firstName || ''} ${request.patient.lastName || ''}`.trim() || 'Unknown Patient';
      
      const contextParts = [
        `You are a medical AI assistant helping a doctor review a patient request.`,
        `Patient: ${patientName}`,
        `Request Type: ${request.type}`,
        `Patient's Description: ${request.description}`,
      ];
      
      if (request.labResultText) {
        contextParts.push(`Lab Result Notes Provided by Patient:\n${request.labResultText}`);
      }
      if (request.labFileUrl) {
        contextParts.push(`Lab File URL: ${request.labFileUrl}`);
      }

      contextParts.push(`\nBased on the above context, provide a concise medical analysis including:\n1. Summary of patient's condition/concern\n2. Key observations from any lab data provided\n3. Suggested considerations or follow-up questions for the doctor\n\nKeep the response clear and professional for a medical setting.`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contextParts.join('\n\n'),
      });

      const analysis = response.text || 'Unable to generate analysis.';
      const updatedRequest = await storage.updatePatientRequestAiAnalysis(id, analysis);
      res.json(updatedRequest);
    } catch (err) {
      console.error('AI analysis error:', err);
      res.status(500).json({ message: 'Failed to run AI analysis' });
    }
  });

  // Messages
  app.get(api.messages.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const otherUserId = req.params.otherUserId;
    const results = await storage.getMessages(userId, otherUserId);
    res.json(results);
  });

  app.post(api.messages.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.messages.create.input.parse({ ...req.body, senderId: userId });
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

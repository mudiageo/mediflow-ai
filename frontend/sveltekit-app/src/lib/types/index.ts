/**
 * Type definitions for MediFlow AI agents and data structures
 */

// Patient-related types
export interface Patient {
	id: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	email?: string;
	phone?: string;
	medicalHistory: MedicalRecord[];
	currentMedications: Medication[];
	allergies: string[];
	createdAt: string;
	updatedAt: string;
}

export interface MedicalRecord {
	id: string;
	patientId: string;
	date: string;
	diagnosis: string;
	symptoms: string[];
	treatment: string;
	notes?: string;
	doctorId: string;
}

export interface Symptom {
	description: string;
	severity: 'mild' | 'moderate' | 'severe';
	duration: string;
	onset: string;
}

export interface SymptomAssessment {
	patientId: string;
	symptoms: Symptom[];
	urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
	recommendations: string[];
	generatedQuestions: string[];
	timestamp: string;
}

// Medication-related types
export interface Medication {
	id: string;
	name: string;
	dosage: string;
	frequency: string;
	startDate: string;
	endDate?: string;
	prescribingDoctor: string;
	instructions?: string;
}

export interface DrugInteraction {
	severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
	description: string;
	affectedDrugs: string[];
	recommendations: string[];
}

export interface MedicationCheck {
	medication: Medication;
	interactions: DrugInteraction[];
	isApproved: boolean;
	alternatives?: Medication[];
	warnings: string[];
	timestamp: string;
}

export interface Prescription {
	id: string;
	patientId: string;
	medication: Medication;
	status: 'pending' | 'approved' | 'rejected' | 'dispensed';
	prescribedBy: string;
	pharmacyId?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

// Hospital Operations types
export interface BedAssignment {
	bedId: string;
	patientId: string;
	ward: string;
	roomNumber: string;
	assignedAt: string;
	expectedDischarge?: string;
	priority: 'routine' | 'urgent' | 'emergency';
}

export interface StaffSchedule {
	staffId: string;
	name: string;
	role: 'nurse' | 'doctor' | 'specialist' | 'technician';
	shift: 'morning' | 'afternoon' | 'night';
	assignedPatients: string[];
	availability: 'available' | 'busy' | 'off-duty';
	specializations?: string[];
}

export interface SupplyItem {
	id: string;
	name: string;
	category: string;
	quantity: number;
	minThreshold: number;
	unit: string;
	location: string;
	lastRestocked: string;
}

export interface AdmissionRequest {
	patientId: string;
	reason: string;
	priority: 'routine' | 'urgent' | 'emergency';
	requiredSpecialty?: string;
	estimatedStay: number; // days
	requestedBy: string;
	timestamp: string;
}

export interface AdmissionCoordination {
	request: AdmissionRequest;
	bedAssignment: BedAssignment;
	careTeam: StaffSchedule[];
	supplies: SupplyItem[];
	coordinationTime: number; // milliseconds
	status: 'pending' | 'coordinated' | 'admitted' | 'cancelled';
}

// Agent-related types
export interface AgentMessage {
	id: string;
	agentType: 'patient_care' | 'medication_management' | 'hospital_operations';
	content: string;
	metadata?: Record<string, unknown>;
	timestamp: string;
}

export interface AgentResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	agentId: string;
	processingTime: number; // milliseconds
}

export interface BedrockInvokeParams {
	modelId: string;
	prompt: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	stopSequences?: string[];
}

// AWS-specific types
export interface DynamoDBQueryParams {
	tableName: string;
	keyConditionExpression?: string;
	filterExpression?: string;
	expressionAttributeValues?: Record<string, unknown>;
	expressionAttributeNames?: Record<string, string>;
	limit?: number;
}

export interface S3UploadParams {
	bucket: string;
	key: string;
	body: Uint8Array | string;
	contentType?: string;
	metadata?: Record<string, string>;
}

// Configuration types
export interface AgentConfig {
	id: string;
	name: string;
	type: 'patient_care' | 'medication_management' | 'hospital_operations';
	modelId: string;
	maxRetries: number;
	timeout: number; // milliseconds
	enabled: boolean;
}

export interface AuditLog {
	id: string;
	action: string;
	agentType: string;
	userId?: string;
	data: Record<string, unknown>;
	timestamp: string;
	status: 'success' | 'failure';
}

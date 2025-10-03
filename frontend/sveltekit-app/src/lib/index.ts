/**
 * MediFlow AI - SvelteKit Library
 * 
 * A comprehensive healthcare operations platform leveraging Amazon Bedrock AgentCore
 * to coordinate multiple autonomous agents for patient care, medication management,
 * and hospital operations.
 */

// AWS Configuration
export {
	AWS_CONFIG,
	BEDROCK_CONFIG,
	DYNAMODB_CONFIG,
	S3_CONFIG,
	API_CONFIG,
	createBedrockRuntimeClient,
	createBedrockAgentRuntimeClient,
	createDynamoDBClient,
	createDynamoDBDocumentClient,
	createS3Client
} from './aws/config.js';

// Type Definitions
export type {
	Patient,
	MedicalRecord,
	Symptom,
	SymptomAssessment,
	Medication,
	DrugInteraction,
	MedicationCheck,
	Prescription,
	BedAssignment,
	StaffSchedule,
	SupplyItem,
	AdmissionRequest,
	AdmissionCoordination,
	AgentMessage,
	AgentResponse,
	BedrockInvokeParams,
	DynamoDBQueryParams,
	S3UploadParams,
	AgentConfig,
	AuditLog
} from './types/index.js';

// Utility Functions
export {
	generateId,
	formatDate,
	sleep,
	retryWithBackoff,
	createAuditLog,
	validateEnv,
	timeDiff,
	formatError,
	sanitizePatientData,
	safeJsonParse,
	validateRequiredFields
} from './utils/helpers.js';

// Patient Care Agent
export { PatientCareAgent } from './agents/patient_care/agent.js';

// Medication Management Agent
export { MedicationManagementAgent } from './agents/medication_management/agent.js';

// Hospital Operations Agents
export { HospitalOperationsCoordinator } from './agents/hospital_operations/coordinator.js';
export { PatientFlowAgent } from './agents/hospital_operations/sub_agents/patient_flow.js';
export { StaffingAgent } from './agents/hospital_operations/sub_agents/staffing.js';
export { SupplyChainAgent } from './agents/hospital_operations/sub_agents/supply_chain.js';

/**
 * Patient Care Agent
 * 
 * Handles pre-appointment symptom gathering, medical history review,
 * personalized question generation, and appointment summary creation.
 */

import {
	InvokeModelCommand,
	type InvokeModelCommandInput
} from '@aws-sdk/client-bedrock-runtime';
import { createBedrockRuntimeClient, BEDROCK_CONFIG } from '../../aws/config.js';
import type {
	Patient,
	SymptomAssessment,
	Symptom,
	AgentResponse,
	MedicalRecord,
	Medication
} from '../../types/index.js';
import { generateId, formatDate, retryWithBackoff, createAuditLog } from '../../utils/helpers.js';

export class PatientCareAgent {
	private client = createBedrockRuntimeClient();
	private modelId = BEDROCK_CONFIG.modelId;
	private agentType = 'patient_care' as const;

	/**
	 * Gather and assess patient symptoms
	 */
	async assessSymptoms(
		patientId: string,
		symptoms: Symptom[]
	): Promise<AgentResponse<SymptomAssessment>> {
		const startTime = new Date();

		try {
			const prompt = this.buildSymptomPrompt(symptoms);
			const response = await this.invokeModel(prompt);

			const assessment: SymptomAssessment = {
				patientId,
				symptoms,
				urgencyLevel: this.determineUrgency(symptoms),
				recommendations: this.parseRecommendations(response),
				generatedQuestions: this.parseQuestions(response),
				timestamp: formatDate()
			};

			// Log the action
			createAuditLog('assess_symptoms', this.agentType, { patientId, symptomCount: symptoms.length });

			return {
				success: true,
				data: assessment,
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Review patient medical history and generate insights
	 */
	async reviewMedicalHistory(
		patient: Patient
	): Promise<AgentResponse<{ insights: string[]; riskFactors: string[] }>> {
		const startTime = new Date();

		try {
			const prompt = this.buildHistoryPrompt(patient);
			const response = await this.invokeModel(prompt);

			const analysis = {
				insights: this.parseInsights(response),
				riskFactors: this.parseRiskFactors(response)
			};

			createAuditLog('review_medical_history', this.agentType, { patientId: patient.id });

			return {
				success: true,
				data: analysis,
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Generate personalized questions for doctors
	 */
	async generateDoctorQuestions(
		patient: Patient,
		symptoms: Symptom[]
	): Promise<AgentResponse<string[]>> {
		const startTime = new Date();

		try {
			const prompt = `Based on the patient's medical history and current symptoms, generate 5-7 targeted questions a doctor should ask during the appointment.

Patient Information:
- Age: ${this.calculateAge(patient.dateOfBirth)} years
- Known Allergies: ${patient.allergies.join(', ') || 'None'}
- Current Medications: ${patient.currentMedications.map((m: Medication) => m.name).join(', ') || 'None'}
- Recent Medical History: ${patient.medicalHistory.slice(0, 3).map((r: MedicalRecord) => r.diagnosis).join(', ')}

Current Symptoms:
${symptoms.map((s) => `- ${s.description} (${s.severity}, duration: ${s.duration})`).join('\n')}

Generate specific, relevant questions that would help with diagnosis and treatment planning. Format as a numbered list.`;

			const response = await this.invokeModel(prompt);
			const questions = this.parseQuestions(response);

			createAuditLog('generate_doctor_questions', this.agentType, {
				patientId: patient.id,
				questionCount: questions.length
			});

			return {
				success: true,
				data: questions,
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Create appointment summary document
	 */
	async createAppointmentSummary(
		patient: Patient,
		symptoms: Symptom[],
		assessment: SymptomAssessment
	): Promise<AgentResponse<string>> {
		const startTime = new Date();

		try {
			const summary = `
PATIENT APPOINTMENT SUMMARY
Generated: ${formatDate()}

PATIENT INFORMATION:
- Name: ${patient.firstName} ${patient.lastName}
- DOB: ${patient.dateOfBirth}
- Patient ID: ${patient.id}

CURRENT SYMPTOMS:
${symptoms.map((s) => `- ${s.description}\n  Severity: ${s.severity}\n  Duration: ${s.duration}\n  Onset: ${s.onset}`).join('\n\n')}

URGENCY ASSESSMENT: ${assessment.urgencyLevel.toUpperCase()}

RECOMMENDATIONS:
${assessment.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

SUGGESTED QUESTIONS FOR DOCTOR:
${assessment.generatedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

RELEVANT MEDICAL HISTORY:
${patient.medicalHistory.slice(0, 3).map((r: MedicalRecord) => `- ${r.date}: ${r.diagnosis}`).join('\n')}

CURRENT MEDICATIONS:
${patient.currentMedications.map((m: Medication) => `- ${m.name} (${m.dosage}, ${m.frequency})`).join('\n')}

KNOWN ALLERGIES:
${patient.allergies.join(', ') || 'None reported'}
`;

			createAuditLog('create_appointment_summary', this.agentType, { patientId: patient.id });

			return {
				success: true,
				data: summary,
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'patient-care-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	// Private helper methods

	private async invokeModel(prompt: string): Promise<string> {
		const input: InvokeModelCommandInput = {
			modelId: this.modelId,
			contentType: 'application/json',
			accept: 'application/json',
			body: JSON.stringify({
				anthropic_version: 'bedrock-2023-05-31',
				max_tokens: 1000,
				messages: [
					{
						role: 'user',
						content: prompt
					}
				]
			})
		};

		const command = new InvokeModelCommand(input);
		const response = await retryWithBackoff(() => this.client.send(command));

		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		return responseBody.content[0].text;
	}

	private buildSymptomPrompt(symptoms: Symptom[]): string {
		return `Analyze the following patient symptoms and provide:
1. Potential medical concerns
2. Recommended actions
3. Questions to ask the patient for more information

Symptoms:
${symptoms.map((s) => `- ${s.description} (${s.severity}, ${s.duration})`).join('\n')}

Format your response with clear sections for each category.`;
	}

	private buildHistoryPrompt(patient: Patient): string {
		return `Review the patient's medical history and identify:
1. Key health insights
2. Potential risk factors
3. Patterns or trends

Medical History:
${patient.medicalHistory.map((r: MedicalRecord) => `- ${r.date}: ${r.diagnosis} (${r.treatment})`).join('\n')}

Current Medications: ${patient.currentMedications.map((m: Medication) => m.name).join(', ')}
Allergies: ${patient.allergies.join(', ')}`;
	}

	private determineUrgency(symptoms: Symptom[]): 'low' | 'medium' | 'high' | 'critical' {
		const hasSevere = symptoms.some((s) => s.severity === 'severe');
		const hasMultipleSevere = symptoms.filter((s) => s.severity === 'severe').length > 1;

		if (hasMultipleSevere) return 'critical';
		if (hasSevere) return 'high';
		if (symptoms.some((s) => s.severity === 'moderate')) return 'medium';
		return 'low';
	}

	private parseRecommendations(response: string): string[] {
		// Extract recommendations from the AI response
		const lines = response.split('\n').filter((line) => line.trim());
		const recommendations: string[] = [];

		for (const line of lines) {
			if (line.match(/^\d+\.|^-|^•/) && line.toLowerCase().includes('recommend')) {
				recommendations.push(line.replace(/^\d+\.|^-|^•/, '').trim());
			}
		}

		return recommendations.length > 0
			? recommendations
			: ['Consult with healthcare provider', 'Monitor symptoms', 'Follow up as needed'];
	}

	private parseQuestions(response: string): string[] {
		const lines = response.split('\n').filter((line) => line.trim());
		const questions: string[] = [];

		for (const line of lines) {
			if (line.match(/^\d+\.|^-|^•/) && line.includes('?')) {
				questions.push(line.replace(/^\d+\.|^-|^•/, '').trim());
			}
		}

		return questions;
	}

	private parseInsights(response: string): string[] {
		const lines = response.split('\n').filter((line) => line.trim());
		const insights: string[] = [];

		for (const line of lines) {
			if (line.match(/^\d+\.|^-|^•/) && !line.includes('?')) {
				insights.push(line.replace(/^\d+\.|^-|^•/, '').trim());
			}
		}

		return insights.slice(0, 5); // Limit to top 5 insights
	}

	private parseRiskFactors(response: string): string[] {
		const lines = response.split('\n').filter((line) => line.trim());
		const riskFactors: string[] = [];

		for (const line of lines) {
			if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('concern')) {
				riskFactors.push(line.replace(/^\d+\.|^-|^•/, '').trim());
			}
		}

		return riskFactors.slice(0, 5);
	}

	private calculateAge(dateOfBirth: string): number {
		const dob = new Date(dateOfBirth);
		const today = new Date();
		let age = today.getFullYear() - dob.getFullYear();
		const monthDiff = today.getMonth() - dob.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
			age--;
		}

		return age;
	}
}

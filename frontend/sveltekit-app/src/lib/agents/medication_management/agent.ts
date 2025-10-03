/**
 * Medication Management Agent
 * 
 * Handles prescription tracking, drug-drug interaction checking,
 * refill monitoring, pharmacy coordination, and adverse reaction flagging.
 */

import {
	InvokeModelCommand,
	type InvokeModelCommandInput
} from '@aws-sdk/client-bedrock-runtime';
import { createBedrockRuntimeClient, BEDROCK_CONFIG, API_CONFIG } from '../../aws/config.js';
import type {
	Medication,
	MedicationCheck,
	DrugInteraction,
	Prescription,
	AgentResponse
} from '../../types/index.js';
import { generateId, formatDate, retryWithBackoff, createAuditLog } from '../../utils/helpers.js';

export class MedicationManagementAgent {
	private client = createBedrockRuntimeClient();
	private modelId = BEDROCK_CONFIG.modelId;
	private agentType = 'medication_management' as const;

	/**
	 * Check for drug-drug interactions
	 */
	async checkDrugInteractions(
		newMedication: Medication,
		currentMedications: Medication[]
	): Promise<AgentResponse<MedicationCheck>> {
		const startTime = new Date();

		try {
			const interactions = await this.analyzeInteractions(newMedication, currentMedications);
			const alternatives = interactions.some((i) => i.severity === 'major' || i.severity === 'contraindicated')
				? await this.findAlternatives(newMedication)
				: undefined;

			const medicationCheck: MedicationCheck = {
				medication: newMedication,
				interactions,
				isApproved: !interactions.some((i) => i.severity === 'contraindicated'),
				alternatives,
				warnings: this.generateWarnings(interactions),
				timestamp: formatDate()
			};

			createAuditLog('check_drug_interactions', this.agentType, {
				medicationId: newMedication.id,
				interactionCount: interactions.length
			});

			return {
				success: true,
				data: medicationCheck,
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Track prescription status and schedule
	 */
	async trackPrescription(prescriptionId: string): Promise<AgentResponse<Prescription>> {
		const startTime = new Date();

		try {
			// In a real implementation, this would query DynamoDB
			// For now, return a mock response structure
			const prescription: Prescription = {
				id: prescriptionId,
				patientId: 'mock-patient-id',
				medication: {
					id: generateId(),
					name: 'Sample Medication',
					dosage: '10mg',
					frequency: 'twice daily',
					startDate: formatDate(),
					prescribingDoctor: 'Dr. Smith',
					instructions: 'Take with food'
				},
				status: 'approved',
				prescribedBy: 'Dr. Smith',
				createdAt: formatDate(),
				updatedAt: formatDate()
			};

			createAuditLog('track_prescription', this.agentType, { prescriptionId });

			return {
				success: true,
				data: prescription,
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Monitor medication refills and send alerts
	 */
	async monitorRefills(
		patientId: string,
		medications: Medication[]
	): Promise<AgentResponse<{ alerts: string[]; dueForRefill: Medication[] }>> {
		const startTime = new Date();

		try {
			const dueForRefill: Medication[] = [];
			const alerts: string[] = [];
			const today = new Date();

			for (const med of medications) {
				if (med.endDate) {
					const endDate = new Date(med.endDate);
					const daysUntilEnd = Math.floor(
						(endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
					);

					if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
						dueForRefill.push(med);
						alerts.push(`${med.name} refill needed in ${daysUntilEnd} days`);
					} else if (daysUntilEnd <= 0) {
						alerts.push(`${med.name} prescription has expired - immediate refill required`);
					}
				}
			}

			createAuditLog('monitor_refills', this.agentType, {
				patientId,
				alertCount: alerts.length
			});

			return {
				success: true,
				data: { alerts, dueForRefill },
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Coordinate with pharmacy API
	 */
	async coordinateWithPharmacy(
		prescription: Prescription,
		pharmacyId: string
	): Promise<AgentResponse<{ confirmed: boolean; estimatedReady: string }>> {
		const startTime = new Date();

		try {
			// In a real implementation, this would call the pharmacy API
			const estimatedReady = new Date();
			estimatedReady.setHours(estimatedReady.getHours() + 2);

			const result = {
				confirmed: true,
				estimatedReady: estimatedReady.toISOString()
			};

			createAuditLog('coordinate_pharmacy', this.agentType, {
				prescriptionId: prescription.id,
				pharmacyId
			});

			return {
				success: true,
				data: result,
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Flag potential adverse reactions
	 */
	async flagAdverseReactions(
		medication: Medication,
		patientAllergies: string[],
		patientSymptoms: string[]
	): Promise<AgentResponse<{ hasRisk: boolean; warnings: string[]; severity: string }>> {
		const startTime = new Date();

		try {
			const prompt = `Analyze potential adverse reactions for medication: ${medication.name}

Patient Allergies: ${patientAllergies.join(', ') || 'None'}
Current Symptoms: ${patientSymptoms.join(', ') || 'None'}

Identify:
1. Direct allergy conflicts
2. Potential adverse reactions based on symptoms
3. Severity level (minor, moderate, major, critical)
4. Recommended actions

Provide a structured response.`;

			const response = await this.invokeModel(prompt);
			const warnings = this.parseWarnings(response);
			const hasRisk = warnings.length > 0;
			const severity = this.determineSeverity(response);

			createAuditLog('flag_adverse_reactions', this.agentType, {
				medicationId: medication.id,
				hasRisk,
				warningCount: warnings.length
			});

			return {
				success: true,
				data: { hasRisk, warnings, severity },
				agentId: 'medication-management-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'medication-management-agent',
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

	private async analyzeInteractions(
		newMedication: Medication,
		currentMedications: Medication[]
	): Promise<DrugInteraction[]> {
		if (currentMedications.length === 0) return [];

		const prompt = `Analyze drug-drug interactions between:
New Medication: ${newMedication.name} (${newMedication.dosage})

Current Medications:
${currentMedications.map((m: Medication) => `- ${m.name} (${m.dosage})`).join('\n')}

For each interaction found, provide:
1. Severity (minor, moderate, major, contraindicated)
2. Description of the interaction
3. Affected drugs
4. Clinical recommendations

Format as structured data.`;

		const response = await this.invokeModel(prompt);
		return this.parseInteractions(response, [newMedication.name, ...currentMedications.map((m: Medication) => m.name)]);
	}

	private async findAlternatives(medication: Medication): Promise<Medication[]> {
		const prompt = `Suggest 2-3 alternative medications for: ${medication.name}

Requirements:
- Similar therapeutic effect
- Same dosage form if possible
- Consider common alternatives
- Brief justification for each

Format as a list.`;

		const response = await this.invokeModel(prompt);
		return this.parseAlternatives(response);
	}

	private parseInteractions(response: string, drugNames: string[]): DrugInteraction[] {
		const interactions: DrugInteraction[] = [];
		const lines = response.toLowerCase();

		// Simple heuristic-based parsing
		if (lines.includes('no interaction') || lines.includes('no significant')) {
			return [];
		}

		// Check for severity keywords
		const severities = ['contraindicated', 'major', 'moderate', 'minor'];
		for (const severity of severities) {
			if (lines.includes(severity)) {
				interactions.push({
					severity: severity as DrugInteraction['severity'],
					description: `Potential ${severity} interaction detected`,
					affectedDrugs: drugNames,
					recommendations: ['Consult prescribing physician', 'Monitor patient closely']
				});
				break;
			}
		}

		return interactions;
	}

	private parseAlternatives(response: string): Medication[] {
		// Extract medication names from response
		const alternatives: Medication[] = [];
		const lines = response.split('\n');

		for (const line of lines) {
			if (line.match(/^\d+\.|^-|^•/)) {
				const medName = line.replace(/^\d+\.|^-|^•/, '').trim().split(/[:(]/)[0].trim();
				if (medName && medName.length > 2) {
					alternatives.push({
						id: generateId(),
						name: medName,
						dosage: 'As prescribed',
						frequency: 'As directed',
						startDate: formatDate(),
						prescribingDoctor: 'TBD',
						instructions: 'Alternative medication option'
					});
				}
			}
		}

		return alternatives.slice(0, 3);
	}

	private generateWarnings(interactions: DrugInteraction[]): string[] {
		const warnings: string[] = [];

		for (const interaction of interactions) {
			warnings.push(`${interaction.severity.toUpperCase()}: ${interaction.description}`);
			warnings.push(...interaction.recommendations);
		}

		return warnings;
	}

	private parseWarnings(response: string): string[] {
		const warnings: string[] = [];
		const lines = response.split('\n');

		for (const line of lines) {
			if (
				line.toLowerCase().includes('warning') ||
				line.toLowerCase().includes('caution') ||
				line.toLowerCase().includes('risk')
			) {
				warnings.push(line.trim());
			}
		}

		return warnings;
	}

	private determineSeverity(response: string): string {
		const lower = response.toLowerCase();

		if (lower.includes('critical') || lower.includes('contraindicated')) return 'critical';
		if (lower.includes('major') || lower.includes('severe')) return 'major';
		if (lower.includes('moderate')) return 'moderate';
		return 'minor';
	}
}

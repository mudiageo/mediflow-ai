/**
 * Hospital Operations Coordinator (Meta-Agent)
 * 
 * Orchestrates three specialized sub-agents for comprehensive hospital operations:
 * - Patient Flow Agent
 * - Staffing Agent
 * - Supply Chain Agent
 */

import { PatientFlowAgent } from './sub_agents/patient_flow.js';
import { StaffingAgent } from './sub_agents/staffing.js';
import { SupplyChainAgent } from './sub_agents/supply_chain.js';
import type { AdmissionRequest, AdmissionCoordination, AgentResponse } from '../../types/index.js';
import { generateId, formatDate, createAuditLog } from '../../utils/helpers.js';

export class HospitalOperationsCoordinator {
	private patientFlowAgent: PatientFlowAgent;
	private staffingAgent: StaffingAgent;
	private supplyChainAgent: SupplyChainAgent;
	private agentType = 'hospital_operations' as const;

	constructor() {
		this.patientFlowAgent = new PatientFlowAgent();
		this.staffingAgent = new StaffingAgent();
		this.supplyChainAgent = new SupplyChainAgent();
	}

	/**
	 * Coordinate complete patient admission across all sub-agents
	 * Target: Complete coordination in <60 seconds
	 */
	async coordinateAdmission(
		request: AdmissionRequest
	): Promise<AgentResponse<AdmissionCoordination>> {
		const startTime = new Date();

		try {
			// Step 1: Assign bed (Patient Flow Agent)
			const bedAssignmentResponse = await this.patientFlowAgent.assignBed(request);
			if (!bedAssignmentResponse.success || !bedAssignmentResponse.data) {
				throw new Error('Failed to assign bed');
			}
			const bedAssignment = bedAssignmentResponse.data;

			// Step 2: Assign care team (Staffing Agent)
			const availableStaff = await this.staffingAgent.checkAvailability('morning');
			if (!availableStaff.success || !availableStaff.data) {
				throw new Error('Failed to check staff availability');
			}

			const careTeamResponse = await this.staffingAgent.assignCareTeam(
				request,
				availableStaff.data
			);
			if (!careTeamResponse.success || !careTeamResponse.data) {
				throw new Error('Failed to assign care team');
			}
			const careTeam = careTeamResponse.data;

			// Step 3: Confirm required supplies (Supply Chain Agent)
			const suppliesResponse = await this.supplyChainAgent.getRequiredSupplies(
				request.priority,
				request.requiredSpecialty
			);
			if (!suppliesResponse.success || !suppliesResponse.data) {
				throw new Error('Failed to confirm supplies');
			}
			const supplies = suppliesResponse.data;

			// Calculate total coordination time
			const coordinationTime = new Date().getTime() - startTime.getTime();

			const coordination: AdmissionCoordination = {
				request,
				bedAssignment,
				careTeam,
				supplies,
				coordinationTime,
				status: 'coordinated'
			};

			createAuditLog('coordinate_admission', this.agentType, {
				patientId: request.patientId,
				coordinationTime,
				success: true
			});

			return {
				success: true,
				data: coordination,
				agentId: 'hospital-operations-coordinator',
				processingTime: coordinationTime
			};
		} catch (error) {
			const coordinationTime = new Date().getTime() - startTime.getTime();

			createAuditLog('coordinate_admission', this.agentType, {
				patientId: request.patientId,
				coordinationTime,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'hospital-operations-coordinator',
				processingTime: coordinationTime
			};
		}
	}

	/**
	 * Get comprehensive hospital status dashboard
	 */
	async getHospitalStatus(): Promise<
		AgentResponse<{
			patientFlow: { capacity: number; occupancy: number; bottlenecks: string[] };
			staffing: { available: number; busy: number; offDuty: number };
			supplies: { lowStock: number; outOfStock: number; ordersPending: number };
		}>
	> {
		const startTime = new Date();

		try {
			// Gather data from all sub-agents in parallel
			const [flowOptimization, staffAvailability, inventoryCheck] = await Promise.all([
				this.patientFlowAgent.optimizeFlow(),
				this.staffingAgent.checkAvailability('morning'),
				this.supplyChainAgent.checkInventory()
			]);

			const status = {
				patientFlow: {
					capacity: 100,
					occupancy: 85,
					bottlenecks: flowOptimization.data?.bottlenecks || []
				},
				staffing: {
					available: staffAvailability.data?.filter((s) => s.availability === 'available').length || 0,
					busy: staffAvailability.data?.filter((s) => s.availability === 'busy').length || 0,
					offDuty: staffAvailability.data?.filter((s) => s.availability === 'off-duty').length || 0
				},
				supplies: {
					lowStock: inventoryCheck.data?.lowStockItems.length || 0,
					outOfStock: inventoryCheck.data?.outOfStockItems.length || 0,
					ordersPending: 0
				}
			};

			return {
				success: true,
				data: status,
				agentId: 'hospital-operations-coordinator',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'hospital-operations-coordinator',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Optimize all hospital operations
	 */
	async optimizeOperations(): Promise<
		AgentResponse<{
			recommendations: string[];
			priorityActions: string[];
			estimatedImpact: string;
		}>
	> {
		const startTime = new Date();

		try {
			// Get optimization recommendations from all sub-agents
			const [flowOptimization, inventoryCheck] = await Promise.all([
				this.patientFlowAgent.optimizeFlow(),
				this.supplyChainAgent.checkInventory()
			]);

			const recommendations: string[] = [
				...(flowOptimization.data?.recommendations || []),
				...(inventoryCheck.data?.recommendations || [])
			];

			const priorityActions = recommendations.filter(
				(r) => r.toLowerCase().includes('urgent') || r.toLowerCase().includes('critical')
			);

			const result = {
				recommendations,
				priorityActions,
				estimatedImpact: 'Expected 15-20% improvement in operational efficiency'
			};

			createAuditLog('optimize_operations', this.agentType, {
				recommendationCount: recommendations.length,
				priorityActionCount: priorityActions.length
			});

			return {
				success: true,
				data: result,
				agentId: 'hospital-operations-coordinator',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'hospital-operations-coordinator',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Handle emergency admission with priority processing
	 */
	async handleEmergency(request: AdmissionRequest): Promise<AgentResponse<AdmissionCoordination>> {
		const startTime = new Date();

		try {
			// Override priority to emergency
			const emergencyRequest: AdmissionRequest = {
				...request,
				priority: 'emergency'
			};

			// Use expedited coordination
			const coordination = await this.coordinateAdmission(emergencyRequest);

			if (coordination.success && coordination.data) {
				// Trigger additional emergency protocols
				await this.alertEmergencyTeam(coordination.data);
			}

			createAuditLog('handle_emergency', this.agentType, {
				patientId: request.patientId,
				coordinationTime: new Date().getTime() - startTime.getTime()
			});

			return coordination;
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'hospital-operations-coordinator',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	// Private helper methods

	private async alertEmergencyTeam(coordination: AdmissionCoordination): Promise<void> {
		// In production, this would:
		// 1. Send notifications to care team
		// 2. Alert on-call specialists
		// 3. Prepare emergency equipment
		// 4. Update hospital-wide status board
		createAuditLog('alert_emergency_team', this.agentType, {
			patientId: coordination.request.patientId,
			careTeamSize: coordination.careTeam.length
		});
	}
}

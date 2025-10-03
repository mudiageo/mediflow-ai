/**
 * Staffing Sub-Agent
 * 
 * Handles nurse/doctor schedule optimization and care team assignment
 */

import type { StaffSchedule, AdmissionRequest, AgentResponse } from '../../../types/index.js';
import { generateId, formatDate, createAuditLog } from '../../../utils/helpers.js';

export class StaffingAgent {
	private agentType = 'hospital_operations' as const;

	/**
	 * Optimize staff schedules based on patient load
	 */
	async optimizeSchedules(
		currentStaff: StaffSchedule[],
		patientCount: number
	): Promise<AgentResponse<{ optimizedSchedules: StaffSchedule[]; recommendations: string[] }>> {
		const startTime = new Date();

		try {
			// Calculate staff-to-patient ratio
			const requiredStaff = Math.ceil(patientCount / 5); // 1:5 ratio
			const availableStaff = currentStaff.filter((s) => s.availability === 'available').length;

			const recommendations: string[] = [];

			if (availableStaff < requiredStaff) {
				recommendations.push(`Need ${requiredStaff - availableStaff} additional staff members`);
				recommendations.push('Consider calling in on-call staff');
			}

			// Redistribute patient assignments
			const optimizedSchedules = this.redistributePatients(currentStaff, patientCount);

			createAuditLog('optimize_schedules', this.agentType, {
				patientCount,
				staffCount: currentStaff.length
			});

			return {
				success: true,
				data: { optimizedSchedules, recommendations },
				agentId: 'staffing-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'staffing-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Assign care team for new patient admission
	 */
	async assignCareTeam(
		request: AdmissionRequest,
		availableStaff: StaffSchedule[]
	): Promise<AgentResponse<StaffSchedule[]>> {
		const startTime = new Date();

		try {
			const careTeam: StaffSchedule[] = [];

			// Assign primary nurse
			const nurse = this.findAvailableStaff(availableStaff, 'nurse');
			if (nurse) {
				careTeam.push({
					...nurse,
					assignedPatients: [...nurse.assignedPatients, request.patientId]
				});
			}

			// Assign doctor
			const doctor = this.findAvailableStaff(availableStaff, 'doctor', request.requiredSpecialty);
			if (doctor) {
				careTeam.push({
					...doctor,
					assignedPatients: [...doctor.assignedPatients, request.patientId]
				});
			}

			// Assign specialist if needed
			if (request.requiredSpecialty) {
				const specialist = this.findAvailableStaff(
					availableStaff,
					'specialist',
					request.requiredSpecialty
				);
				if (specialist) {
					careTeam.push({
						...specialist,
						assignedPatients: [...specialist.assignedPatients, request.patientId]
					});
				}
			}

			createAuditLog('assign_care_team', this.agentType, {
				patientId: request.patientId,
				teamSize: careTeam.length
			});

			return {
				success: true,
				data: careTeam,
				agentId: 'staffing-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'staffing-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	/**
	 * Check staff availability for specific shift
	 */
	async checkAvailability(
		shift: 'morning' | 'afternoon' | 'night',
		role?: StaffSchedule['role']
	): Promise<AgentResponse<StaffSchedule[]>> {
		const startTime = new Date();

		try {
			// Mock implementation - would query DynamoDB in production
			const availableStaff: StaffSchedule[] = this.generateMockStaff(shift, role);

			return {
				success: true,
				data: availableStaff,
				agentId: 'staffing-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				agentId: 'staffing-agent',
				processingTime: new Date().getTime() - startTime.getTime()
			};
		}
	}

	// Private helper methods

	private redistributePatients(staff: StaffSchedule[], totalPatients: number): StaffSchedule[] {
		const availableStaff = staff.filter((s) => s.availability === 'available');
		const patientsPerStaff = Math.ceil(totalPatients / availableStaff.length);

		return staff.map((member) => {
			if (member.availability === 'available') {
				// Adjust patient assignments to balance load
				const currentLoad = member.assignedPatients.length;
				if (currentLoad > patientsPerStaff) {
					return {
						...member,
						assignedPatients: member.assignedPatients.slice(0, patientsPerStaff)
					};
				}
			}
			return member;
		});
	}

	private findAvailableStaff(
		staff: StaffSchedule[],
		role: StaffSchedule['role'],
		specialty?: string
	): StaffSchedule | undefined {
		return staff.find(
			(s) =>
				s.role === role &&
				s.availability === 'available' &&
				s.assignedPatients.length < 5 &&
				(!specialty || s.specializations?.includes(specialty))
		);
	}

	private generateMockStaff(
		shift: 'morning' | 'afternoon' | 'night',
		role?: StaffSchedule['role']
	): StaffSchedule[] {
		const roles: StaffSchedule['role'][] = role
			? [role]
			: ['nurse', 'doctor', 'specialist', 'technician'];
		const staff: StaffSchedule[] = [];

		for (const r of roles) {
			for (let i = 0; i < 3; i++) {
				staff.push({
					staffId: generateId(),
					name: `${r.charAt(0).toUpperCase() + r.slice(1)} ${i + 1}`,
					role: r,
					shift,
					assignedPatients: [],
					availability: Math.random() > 0.3 ? 'available' : 'busy',
					specializations: r === 'specialist' ? ['cardiology', 'neurology'] : undefined
				});
			}
		}

		return staff;
	}
}

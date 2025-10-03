/**
 * Utility functions for MediFlow AI
 */

import type { AuditLog } from '../types/index.js';

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a date to ISO string
 */
export function formatDate(date: Date = new Date()): string {
	return date.toISOString();
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000
): Promise<T> {
	let lastError: Error;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			if (attempt < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, attempt);
				await sleep(delay);
			}
		}
	}

	throw lastError!;
}

/**
 * Create an audit log entry
 */
export function createAuditLog(
	action: string,
	agentType: string,
	data: Record<string, unknown>,
	status: 'success' | 'failure' = 'success',
	userId?: string
): AuditLog {
	return {
		id: generateId(),
		action,
		agentType,
		userId,
		data,
		timestamp: formatDate(),
		status
	};
}

/**
 * Validate environment variables
 */
export function validateEnv(requiredVars: string[]): void {
	const missing = requiredVars.filter((varName) => !import.meta.env[varName]);

	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}
}

/**
 * Calculate time difference in milliseconds
 */
export function timeDiff(startTime: Date, endTime: Date = new Date()): number {
	return endTime.getTime() - startTime.getTime();
}

/**
 * Format error message
 */
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

/**
 * Sanitize patient data for logging (remove sensitive info)
 */
export function sanitizePatientData(data: Record<string, unknown>): Record<string, unknown> {
	const sanitized = { ...data };
	const sensitiveFields = ['ssn', 'creditCard', 'password', 'apiKey', 'token'];

	for (const field of sensitiveFields) {
		if (field in sanitized) {
			sanitized[field] = '***REDACTED***';
		}
	}

	return sanitized;
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
	try {
		return JSON.parse(json) as T;
	} catch {
		return defaultValue;
	}
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
	obj: T,
	requiredFields: (keyof T)[]
): void {
	const missing = requiredFields.filter((field) => !obj[field]);

	if (missing.length > 0) {
		throw new Error(`Missing required fields: ${missing.join(', ')}`);
	}
}

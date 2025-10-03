/**
 * AWS Configuration for MediFlow AI
 * 
 * This module provides centralized configuration for AWS services
 * including Bedrock, DynamoDB, S3, and API Gateway.
 */

import {
	BedrockRuntimeClient,
	type BedrockRuntimeClientConfig
} from '@aws-sdk/client-bedrock-runtime';
import {
	BedrockAgentRuntimeClient,
	type BedrockAgentRuntimeClientConfig
} from '@aws-sdk/client-bedrock-agent-runtime';
import { DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Environment variables with defaults
export const AWS_CONFIG = {
	region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
	credentials: {
		accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
		secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
	}
};

export const BEDROCK_CONFIG = {
	agentCoreArn: import.meta.env.VITE_BEDROCK_AGENT_CORE_ARN || '',
	modelId: import.meta.env.VITE_BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
	novaModelId:
		import.meta.env.VITE_BEDROCK_NOVA_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
};

export const DYNAMODB_CONFIG = {
	patientsTable: import.meta.env.VITE_DYNAMODB_PATIENTS_TABLE || 'mediflow-patients',
	medicationsTable: import.meta.env.VITE_DYNAMODB_MEDICATIONS_TABLE || 'mediflow-medications',
	operationsTable: import.meta.env.VITE_DYNAMODB_OPERATIONS_TABLE || 'mediflow-operations'
};

export const S3_CONFIG = {
	patientRecordsBucket:
		import.meta.env.VITE_S3_PATIENT_RECORDS_BUCKET || 'mediflow-patient-records',
	logsBucket: import.meta.env.VITE_S3_LOGS_BUCKET || 'mediflow-logs'
};

export const API_CONFIG = {
	gatewayUrl: import.meta.env.VITE_API_GATEWAY_URL || '',
	fdaApiUrl: import.meta.env.VITE_FDA_API_URL || 'https://api.fda.gov/drug/',
	pharmacyApiUrl: import.meta.env.VITE_PHARMACY_API_URL || ''
};

/**
 * Create a configured Bedrock Runtime client
 */
export function createBedrockRuntimeClient(
	config?: BedrockRuntimeClientConfig
): BedrockRuntimeClient {
	return new BedrockRuntimeClient({
		region: AWS_CONFIG.region,
		credentials: AWS_CONFIG.credentials,
		...config
	});
}

/**
 * Create a configured Bedrock Agent Runtime client
 */
export function createBedrockAgentRuntimeClient(
	config?: BedrockAgentRuntimeClientConfig
): BedrockAgentRuntimeClient {
	return new BedrockAgentRuntimeClient({
		region: AWS_CONFIG.region,
		credentials: AWS_CONFIG.credentials,
		...config
	});
}

/**
 * Create a configured DynamoDB client
 */
export function createDynamoDBClient(config?: DynamoDBClientConfig): DynamoDBClient {
	return new DynamoDBClient({
		region: AWS_CONFIG.region,
		credentials: AWS_CONFIG.credentials,
		...config
	});
}

/**
 * Create a configured DynamoDB Document client
 */
export function createDynamoDBDocumentClient(config?: DynamoDBClientConfig): DynamoDBDocumentClient {
	const client = createDynamoDBClient(config);
	return DynamoDBDocumentClient.from(client);
}

/**
 * Create a configured S3 client
 */
export function createS3Client(config?: S3ClientConfig): S3Client {
	return new S3Client({
		region: AWS_CONFIG.region,
		credentials: AWS_CONFIG.credentials,
		...config
	});
}

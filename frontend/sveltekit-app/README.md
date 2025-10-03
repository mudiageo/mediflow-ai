# MediFlow AI - SvelteKit Library

A comprehensive healthcare operations platform built with SvelteKit, leveraging Amazon Bedrock AgentCore to coordinate multiple autonomous agents for patient care, medication management, and hospital operations.

## 🎯 Overview

This SvelteKit library provides a complete implementation of intelligent healthcare agents that can be integrated into any web application. The library includes:

- **Patient Care Agent**: Pre-appointment symptom gathering, medical history review, and personalized question generation
- **Medication Management Agent**: Drug interaction checking, prescription tracking, and pharmacy coordination
- **Hospital Operations Coordinator**: Multi-agent orchestration for bed assignments, staff scheduling, and supply chain management

## 📦 Installation

```bash
npm install
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure your AWS credentials:

```bash
cp .env.example .env
```

Edit `.env` with your AWS credentials and service endpoints:

```env
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
VITE_BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

### 2. Development

Run the development server:

```bash
npm run dev
```

### 3. Build

Build the library for production:

```bash
npm run build
```

This will create the distributable package in the `dist` directory.

## 📚 Usage Examples

### Patient Care Agent

```typescript
import { PatientCareAgent } from '@mediflow-ai/sveltekit-app';
import type { Symptom, Patient } from '@mediflow-ai/sveltekit-app';

const agent = new PatientCareAgent();

// Assess patient symptoms
const symptoms: Symptom[] = [
  {
    description: 'Persistent headache',
    severity: 'moderate',
    duration: '3 days',
    onset: 'gradual'
  }
];

const assessment = await agent.assessSymptoms('patient-123', symptoms);

if (assessment.success) {
  console.log('Urgency Level:', assessment.data.urgencyLevel);
  console.log('Recommendations:', assessment.data.recommendations);
}
```

### Medication Management Agent

```typescript
import { MedicationManagementAgent } from '@mediflow-ai/sveltekit-app';
import type { Medication } from '@mediflow-ai/sveltekit-app';

const agent = new MedicationManagementAgent();

// Check for drug interactions
const newMedication: Medication = {
  id: 'med-123',
  name: 'Aspirin',
  dosage: '100mg',
  frequency: 'daily',
  startDate: new Date().toISOString(),
  prescribingDoctor: 'Dr. Smith'
};

const currentMedications: Medication[] = [
  // ... existing medications
];

const check = await agent.checkDrugInteractions(newMedication, currentMedications);

if (check.success) {
  console.log('Approved:', check.data.isApproved);
  console.log('Interactions:', check.data.interactions);
  console.log('Warnings:', check.data.warnings);
}
```

### Hospital Operations Coordinator

```typescript
import { HospitalOperationsCoordinator } from '@mediflow-ai/sveltekit-app';
import type { AdmissionRequest } from '@mediflow-ai/sveltekit-app';

const coordinator = new HospitalOperationsCoordinator();

// Coordinate patient admission
const admissionRequest: AdmissionRequest = {
  patientId: 'patient-456',
  reason: 'Emergency cardiac event',
  priority: 'emergency',
  requiredSpecialty: 'cardiology',
  estimatedStay: 3,
  requestedBy: 'Dr. Johnson',
  timestamp: new Date().toISOString()
};

const coordination = await coordinator.coordinateAdmission(admissionRequest);

if (coordination.success) {
  console.log('Bed Assignment:', coordination.data.bedAssignment);
  console.log('Care Team:', coordination.data.careTeam);
  console.log('Supplies:', coordination.data.supplies);
  console.log('Coordination Time:', coordination.data.coordinationTime, 'ms');
}
```

## 🏗️ Project Structure

```
src/lib/
├── agents/
│   ├── patient_care/
│   │   └── agent.ts              # Patient Care Agent implementation
│   ├── medication_management/
│   │   └── agent.ts              # Medication Management Agent
│   └── hospital_operations/
│       ├── coordinator.ts         # Main operations coordinator
│       └── sub_agents/
│           ├── patient_flow.ts   # Bed assignments & flow optimization
│           ├── staffing.ts       # Staff scheduling & care team assignment
│           └── supply_chain.ts   # Inventory & reordering automation
├── aws/
│   └── config.ts                 # AWS SDK configuration & client factories
├── types/
│   └── index.ts                  # TypeScript type definitions
├── utils/
│   └── helpers.ts                # Utility functions
└── index.ts                      # Main library exports
```

## 🛠️ Technology Stack

- **Framework**: SvelteKit (Library Template)
- **Language**: TypeScript
- **AWS Services**:
  - Amazon Bedrock Runtime (AI/ML)
  - Amazon Bedrock Agent Runtime (Multi-agent orchestration)
  - Amazon DynamoDB (Data storage)
  - Amazon S3 (File storage)
- **Build Tool**: Vite
- **Package Manager**: npm

## 🧪 Testing

Run type checking:

```bash
npm run check
```

Watch mode for continuous type checking:

```bash
npm run check:watch
```

## 📦 Publishing

Before publishing, ensure you:

1. Update version in `package.json`
2. Build the library: `npm run build`
3. Run pre-publish checks: `npm run prepack`
4. Publish to npm: `npm publish`

## 🔐 Security Considerations

- **Never commit credentials**: Use environment variables for all sensitive data
- **Client-side limitations**: AWS credentials should ideally be managed server-side
- **CORS Configuration**: Ensure proper CORS settings for AWS services
- **Data Encryption**: All patient data should be encrypted at rest and in transit
- **HIPAA Compliance**: Follow healthcare data regulations in production

## 🌟 Features

### Patient Care Agent
- ✅ Intelligent symptom assessment
- ✅ Medical history analysis
- ✅ AI-powered question generation for doctors
- ✅ Automated appointment summary creation

### Medication Management Agent
- ✅ Real-time drug interaction checking
- ✅ Prescription tracking and scheduling
- ✅ Automated refill monitoring
- ✅ Pharmacy API integration
- ✅ Adverse reaction detection

### Hospital Operations Coordinator
- ✅ Automated bed assignment
- ✅ Care team coordination
- ✅ Supply chain management
- ✅ Staff schedule optimization
- ✅ Emergency admission handling
- ✅ Real-time hospital status dashboard

## 📖 API Reference

For detailed API documentation, see the TypeScript definitions in `src/lib/types/index.ts`.

## 🤝 Contributing

This project was created for the AWS AI Agent Global Hackathon. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file

## 🙏 Acknowledgments

- AWS for providing Bedrock and hosting the hackathon
- Healthcare professionals for domain insights
- Svelte team for the excellent framework

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact the maintainer

---

**Built with ❤️ for better healthcare through AI**

# AI Medical Student Assessment App

A comprehensive web application for medical education that simulates patient interactions using AI, provides real-time supervision, and evaluates student performance through SOAP note analysis.

## Features

### 🤖 AI-Powered Patient Simulation
- Interactive conversations with AI patients presenting various medical conditions
- Dynamic responses based on patient history, symptoms, and disease progression
- Realistic patient personas with detailed medical backgrounds

### 👨‍⚕️ Real-Time AI Supervision
- AI doctor supervisor monitors student-patient conversations
- Immediate intervention when students ask irrelevant or inappropriate questions
- Visual alerts (red screen) to guide learning in real-time

### 📝 SOAP Note Evaluation
- Comprehensive SOAP note editor with structured sections
- AI-powered comparison with reference SOAP notes
- Detailed feedback and scoring for each section (Subjective, Objective, Assessment, Plan)

### 📊 Progress Analytics
- Performance tracking across multiple cases
- Detailed analytics on conversation quality, intervention frequency, and SOAP note accuracy
- Personalized learning insights and recommendations
- Progress visualization with charts and metrics

### 🎯 Case Management
- Diverse medical cases across different specialties and difficulty levels
- Detailed case information with patient profiles and learning objectives
- Case filtering and search functionality

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **AI Integration**: OpenAI GPT-4o Mini via Vercel AI SDK
- **Data Storage**: Local Storage (browser-based)
- **Charts**: Recharts for analytics visualization

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- OpenAI API account and API key

### Installation

1. **Clone or download the project**
   \`\`\`bash
   # If using GitHub integration
   git clone <your-repo-url>
   cd medical-assessment-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local and add your OpenAI API key
   OPENAI_API_KEY=your_actual_openai_api_key_here
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open the application**
   Navigate to `http://localhost:3000` in your browser

### Getting Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`) and add it to your `.env.local` file

## Usage Guide

### For Students

1. **Registration/Login**
   - Create a new account or log in with existing credentials
   - Access your personalized dashboard

2. **Selecting Cases**
   - Browse available medical cases on the dashboard
   - Filter by specialty, difficulty, or search for specific conditions
   - Click on a case to view detailed patient information
   - Start the case to begin the simulation

3. **Patient Interaction**
   - Engage in conversation with the AI patient
   - Ask relevant medical history questions
   - Perform virtual examinations through questioning
   - Receive real-time feedback from the AI supervisor
   - Pay attention to intervention alerts for learning guidance

4. **SOAP Note Writing**
   - After completing the patient interaction, write your SOAP note
   - Fill in all four sections: Subjective, Objective, Assessment, Plan
   - Submit for AI evaluation and feedback

5. **Review Performance**
   - View detailed feedback on your SOAP note
   - Compare with AI-generated reference notes
   - Review analytics and progress tracking
   - Follow personalized recommendations for improvement

### Case Types Available

- **Cardiology**: Heart conditions, chest pain, arrhythmias
- **Pulmonology**: Respiratory issues, shortness of breath, cough
- **Gastroenterology**: Abdominal pain, digestive disorders
- **Neurology**: Headaches, neurological symptoms
- **Emergency Medicine**: Acute presentations, trauma cases

## Key Components

### AI Services
- **Patient AI**: Generates contextual responses based on medical conditions
- **Supervisor AI**: Monitors conversations and provides interventions
- **SOAP Evaluator**: Compares and grades student documentation
- **Analytics AI**: Generates personalized learning insights

### Data Models
- **User Management**: Student profiles and authentication
- **Case Library**: Medical scenarios and patient information
- **Conversations**: Chat history and context management
- **SOAP Notes**: Documentation and evaluation records
- **Analytics**: Performance metrics and progress tracking

## Educational Benefits

- **Realistic Practice**: Safe environment to practice clinical skills
- **Immediate Feedback**: Real-time guidance prevents bad habits
- **Comprehensive Assessment**: Evaluates both communication and documentation
- **Progress Tracking**: Identifies strengths and areas for improvement
- **Scalable Learning**: Unlimited practice opportunities

## Troubleshooting

### Common Issues

1. **AI responses not working**
   - Verify your OpenAI API key is correctly set in `.env.local`
   - Check that you have sufficient API credits
   - Ensure the API key has the correct permissions

2. **Data not persisting**
   - The app uses browser localStorage for data storage
   - Clearing browser data will reset progress
   - Consider implementing database storage for production use

3. **Performance issues**
   - AI responses may take a few seconds to generate
   - Ensure stable internet connection for API calls

### Support

For technical issues or questions:
- Check the browser console for error messages
- Verify environment variables are properly configured
- Ensure all dependencies are installed correctly

## Future Enhancements

- Database integration for persistent data storage
- Multi-user support with instructor dashboards
- Advanced case authoring tools
- Integration with medical education standards
- Mobile app development
- Voice interaction capabilities

## License

This project is designed for educational purposes in medical training and assessment.

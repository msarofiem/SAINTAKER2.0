const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 75,
                recommendation: "Accept",
                strengths: ["Clear liability", "Documented injuries"],
                redFlags: ["Delay in treatment"],
                explanation: "This is a strong case with clear liability."
              })
            }
          }
        ]
      })
    }
  }
};

export default class OpenAI {
  constructor() {
    return mockOpenAI;
  }
}

export const evaluateIntakePrompt = jest.fn().mockReturnValue('Mock prompt');

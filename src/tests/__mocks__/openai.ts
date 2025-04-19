export const openai = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 85,
                recommendation: "Accept",
                redFlags: "None",
                strengths: "Strong case"
              })
            }
          }
        ]
      })
    }
  }
};

export const evaluationPrompt = jest.fn().mockReturnValue('mock evaluation prompt');
export const litigationScorePrompt = jest.fn().mockReturnValue('mock litigation prompt');

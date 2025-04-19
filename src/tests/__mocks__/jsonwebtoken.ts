export const sign = jest.fn().mockReturnValue('mock-token');
export const verify = jest.fn().mockReturnValue({ userId: 'mock-user-id' });
export const decode = jest.fn().mockReturnValue({ userId: 'mock-user-id' });

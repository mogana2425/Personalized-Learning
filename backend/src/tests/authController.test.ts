import { Request, Response } from 'express';

// Create a holder for mock functions to bypass TDZ/hoisting issues in Jest
const mockSupabaseActions = {
  maybeSingle: jest.fn(),
  single: jest.fn(),
};

jest.mock('../config/supabaseClient', () => {
  return {
    supabase: {
      from: jest.fn().mockImplementation((table: string) => {
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: () => mockSupabaseActions.maybeSingle(),
          single: () => mockSupabaseActions.single(),
        };
        return chain;
      }),
    },
  };
});

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    genSalt: () => Promise.resolve('salt'),
    hash: () => Promise.resolve('hashed_password'),
    compare: () => Promise.resolve(true),
  },
  genSalt: () => Promise.resolve('salt'),
  hash: () => Promise.resolve('hashed_password'),
  compare: () => Promise.resolve(true),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: () => 'mock_jwt_token',
  },
  sign: () => 'mock_jwt_token',
}));

import { register, login } from '../controllers/authController';

describe('Authentication Controller Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    const { supabase } = require('../config/supabaseClient');
    supabase.from.mockImplementation((table: string) => {
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: () => mockSupabaseActions.maybeSingle(),
        single: () => mockSupabaseActions.single(),
      };
      return chain;
    });
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new student user and initialize progress', async () => {
      mockRequest.body = {
        name: 'Jane Doe',
        email: 'jane@plis.com',
        password: 'securePassword123',
        role: 'student',
      };

      // Mock email check: maybeSingle returns null (user doesn't exist)
      mockSupabaseActions.maybeSingle.mockResolvedValue({ data: null, error: null });

      // Mock user insert return
      mockSupabaseActions.single.mockResolvedValue({
        data: {
          id: 'mock_student_id',
          name: 'Jane Doe',
          email: 'jane@plis.com',
          role: 'student',
        },
        error: null,
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          email: 'jane@plis.com',
          token: 'mock_jwt_token',
        })
      );
    });

    it('should return 400 error if user email already exists', async () => {
      mockRequest.body = {
        name: 'Jane Doe',
        email: 'jane@plis.com',
        password: 'securePassword123',
      };

      // Mock email check: maybeSingle returns user data
      mockSupabaseActions.maybeSingle.mockResolvedValue({
        data: { id: 'existing_id', email: 'jane@plis.com' },
        error: null,
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User already exists with this email',
        })
      );
    });
  });

  describe('login', () => {
    it('should successfully login and return JWT for valid credentials', async () => {
      mockRequest.body = {
        email: 'jane@plis.com',
        password: 'securePassword123',
      };

      // Mock find user
      mockSupabaseActions.maybeSingle.mockResolvedValue({
        data: {
          id: 'mock_student_id',
          name: 'Jane Doe',
          email: 'jane@plis.com',
          password: 'hashed_password',
          role: 'student',
        },
        error: null,
      });

      await login(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          email: 'jane@plis.com',
          token: 'mock_jwt_token',
        })
      );
    });
  });
});

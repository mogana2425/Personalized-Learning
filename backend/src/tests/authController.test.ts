// Mocks MUST be defined at the very top of the file before any other imports
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../models/Progress', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

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

import { Request, Response } from 'express';
import { register, login } from '../controllers/authController';
import User from '../models/User';
import Progress from '../models/Progress';

describe('Authentication Controller Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
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

      // Mock user not existing in DB
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock User.create returning user object
      const mockCreatedUser = {
        _id: 'mock_student_id',
        name: 'Jane Doe',
        email: 'jane@plis.com',
        role: 'student',
      };
      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (Progress.create as jest.Mock).mockResolvedValue({});

      await register(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'jane@plis.com' });
      expect(User.create).toHaveBeenCalled();
      expect(Progress.create).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 'mock_student_id' })
      );
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

      // Mock user existing in DB
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'jane@plis.com' });

      await register(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'jane@plis.com' });
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

      // Mock user in DB
      const mockDBUser = {
        _id: 'mock_student_id',
        name: 'Jane Doe',
        email: 'jane@plis.com',
        password: 'hashed_password',
        role: 'student',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockDBUser);

      await login(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'jane@plis.com' });
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

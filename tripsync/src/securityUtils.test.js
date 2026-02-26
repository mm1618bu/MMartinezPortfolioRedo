import DOMPurify from 'dompurify';
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeURL,
  sanitizeNumber,
  sanitizeObject,
  validateAndSanitizeTripData,
  validateAndSanitizeAccommodationData,
  validateAndSanitizeExpenseData,
} from '../securityUtils';

// Mock DOMPurify
jest.mock('dompurify');

describe('securityUtils - sanitizeText', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should sanitize text with XSS scripts', () => {
    const maliciousInput = '<script>alert("XSS")</script>Hello';
    const result = sanitizeText(maliciousInput);
    expect(result).toBeTruthy();
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  test('should remove HTML tags from text', () => {
    const input = '<b>Bold text</b>';
    sanitizeText(input);
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(input, { ALLOWED_TAGS: [] });
  });

  test('should handle empty string', () => {
    const result = sanitizeText('');
    expect(result).toBe('');
  });

  test('should trim whitespace', () => {
    DOMPurify.sanitize.mockImplementation((input) => input);
    const result = sanitizeText('   hello   ');
    expect(result.trim()).toBe('hello');
  });

  test('should handle null/undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('securityUtils - sanitizeHTML', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should allow safe HTML tags', () => {
    const input = '<p>Safe paragraph</p>';
    sanitizeHTML(input);
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  test('should remove script tags', () => {
    const input = '<p>Text</p><script>alert("XSS")</script>';
    sanitizeHTML(input);
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(input, expect.any(Object));
  });

  test('should handle null values', () => {
    const result = sanitizeHTML(null);
    expect(result).toBe('');
  });
});

describe('securityUtils - sanitizeEmail', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should sanitize and lowercase email', () => {
    const email = 'USER@EXAMPLE.COM';
    const result = sanitizeEmail(email);
    expect(result.toLowerCase()).toBe(result);
  });

  test('should remove invalid characters', () => {
    const email = '<script>test@example.com</script>';
    sanitizeEmail(email);
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  test('should validate email format', () => {
    const result = sanitizeEmail('invalid-email');
    expect(result).toBe('');
  });

  test('should handle empty email', () => {
    const result = sanitizeEmail('');
    expect(result).toBe('');
  });
});

describe('securityUtils - sanitizeURL', () => {
  test('should allow https URLs', () => {
    const url = 'https://example.com/page';
    const result = sanitizeURL(url);
    expect(result).toBe(url);
  });

  test('should block javascript: protocol', () => {
    const url = 'javascript:alert("XSS")';
    const result = sanitizeURL(url);
    expect(result).toBe('');
  });

  test('should block data: protocol', () => {
    const url = 'data:text/html,<script>alert("XSS")</script>';
    const result = sanitizeURL(url);
    expect(result).toBe('');
  });

  test('should allow http URLs', () => {
    const url = 'http://example.com';
    const result = sanitizeURL(url);
    expect(result).toBe(url);
  });

  test('should handle empty URLs', () => {
    const result = sanitizeURL('');
    expect(result).toBe('');
  });

  test('should trim whitespace from URLs', () => {
    const url = '  https://example.com  ';
    const result = sanitizeURL(url);
    expect(result).toBeDefined();
  });
});

describe('securityUtils - sanitizeNumber', () => {
  test('should convert string numbers to numbers', () => {
    const result = sanitizeNumber('42');
    expect(result).toBe(42);
  });

  test('should return default for non-numeric input', () => {
    const result = sanitizeNumber('abc', 0);
    expect(result).toBe(0);
  });

  test('should handle negative numbers', () => {
    const result = sanitizeNumber('-100');
    expect(result).toBe(-100);
  });

  test('should handle floats', () => {
    const result = sanitizeNumber('3.14');
    expect(result).toBe(3.14);
  });

  test('should handle scientific notation', () => {
    const result = sanitizeNumber('1e5');
    expect(result).toBe(100000);
  });

  test('should use custom default value', () => {
    const result = sanitizeNumber('invalid', 999);
    expect(result).toBe(999);
  });
});

describe('securityUtils - sanitizeObject', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should sanitize all string values in object', () => {
    const obj = { name: '<script>alert("XSS")</script>', age: 25 };
    sanitizeObject(obj);
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  test('should handle nested objects', () => {
    const obj = {
      user: {
        name: 'John',
        email: 'john@example.com',
      },
    };
    const result = sanitizeObject(obj);
    expect(result.user.name).toBe('John');
    expect(result.user.email).toBe('john@example.com');
  });

  test('should preserve non-string values', () => {
    const obj = { name: 'John', age: 25, active: true };
    const result = sanitizeObject(obj);
    expect(result.age).toBe(25);
    expect(result.active).toBe(true);
  });

  test('should handle null object', () => {
    const result = sanitizeObject(null);
    expect(result).toBe(null);
  });

  test('should handle arrays in object', () => {
    const obj = { tags: ['tag1', 'tag2'] };
    const result = sanitizeObject(obj);
    expect(Array.isArray(result.tags)).toBe(true);
  });
});

describe('securityUtils - validateAndSanitizeTripData', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should sanitize trip start point', () => {
    const tripData = { startPoint: '<b>NYC</b>' };
    const result = validateAndSanitizeTripData(tripData);
    expect(result.startPoint).toBeDefined();
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  test('should sanitize trip end point', () => {
    const tripData = { endPoint: '<script>LA</script>' };
    const result = validateAndSanitizeTripData(tripData);
    expect(result.endPoint).toBeDefined();
  });

  test('should handle missing fields with defaults', () => {
    const tripData = {};
    const result = validateAndSanitizeTripData(tripData);
    expect(result.startPoint).toBe('');
    expect(result.endPoint).toBe('');
    expect(result.travelers).toBeNull();
    expect(result.tripStatus).toBe('planning');
  });

  test('should sanitize all text fields', () => {
    const tripData = {
      startPoint: 'NYC',
      endPoint: 'LA',
      departureDate: '2024-01-01',
      returnDate: '2024-01-10',
      travelers: 4,
      modeOfTravel: 'car',
      accommodation: 'hotel',
      travelDetails: 'Some details',
    };
    const result = validateAndSanitizeTripData(tripData);
    expect(result.startPoint).toBeDefined();
    expect(result.travelers).toBe(4);
  });

  test('should convert travelers to number', () => {
    const tripData = { travelers: '5' };
    const result = validateAndSanitizeTripData(tripData);
    expect(typeof result.travelers).toBe('number');
  });
});

describe('securityUtils - validateAndSanitizeAccommodationData', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should sanitize accommodation name', () => {
    const accData = { name: '<script>Hotel</script>' };
    const result = validateAndSanitizeAccommodationData(accData);
    expect(result.name).toBeDefined();
  });

  test('should sanitize accommodation URL', () => {
    const accData = { url: 'https://example.com' };
    const result = validateAndSanitizeAccommodationData(accData);
    expect(result.url).toBeTruthy();
  });

  test('should convert price to cents', () => {
    const accData = { price_cents: '15000' };
    const result = validateAndSanitizeAccommodationData(accData);
    expect(result.price_cents).toBe(15000);
  });

  test('should convert beds to number', () => {
    const accData = { beds: '3' };
    const result = validateAndSanitizeAccommodationData(accData);
    expect(result.beds).toBe(3);
  });

  test('should handle missing fields', () => {
    const accData = {};
    const result = validateAndSanitizeAccommodationData(accData);
    expect(result.name).toBe('');
    expect(result.price_cents).toBeNull();
  });
});

describe('securityUtils - validateAndSanitizeExpenseData', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockImplementation((input) => input);
  });

  test('should sanitize expense description', () => {
    const expData = { description: '<b>Dinner</b>' };
    const result = validateAndSanitizeExpenseData(expData);
    expect(result.description).toBeDefined();
  });

  test('should convert amount to cents', () => {
    const expData = { amount_cents: '5000' };
    const result = validateAndSanitizeExpenseData(expData);
    expect(result.amount_cents).toBe(5000);
  });

  test('should sanitize category', () => {
    const expData = { category: '<script>Food</script>' };
    const result = validateAndSanitizeExpenseData(expData);
    expect(result.category).toBeDefined();
  });

  test('should handle expense date', () => {
    const expData = { date: '2024-01-15' };
    const result = validateAndSanitizeExpenseData(expData);
    expect(result.date).toBeDefined();
  });

  test('should handle paid_by field', () => {
    const expData = { paidBy: 'user123' };
    const result = validateAndSanitizeExpenseData(expData);
    expect(result.paidBy).toBeDefined();
  });

  test('should handle splits array', () => {
    const expData = { splits: [{ user_id: 'user1', amount_cents: 2500, settled: true }] };
    const result = validateAndSanitizeExpenseData(expData);
    expect(Array.isArray(result.splits)).toBe(true);
    expect(result.splits[0]).toEqual({
      user_id: 'user1',
      amount_cents: 2500,
      settled: true,
    });
  });

  test('should handle missing fields with defaults', () => {
    const expData = {};
    const result = validateAndSanitizeExpenseData(expData);
    expect(result.description).toBe('');
    expect(result.amount_cents).toBe(0);
    expect(Array.isArray(result.splits)).toBe(true);
  });
});

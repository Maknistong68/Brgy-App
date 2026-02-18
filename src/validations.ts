import { z } from 'zod';

// ─── Helpers ────────────────────────────────────────────────────────────────

const philippinePhone = z
  .string()
  .regex(
    /^(\+63|0)(9\d{9})$/,
    'Enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567)',
  );

const nonEmptyString = (field: string) =>
  z.string().min(1, `${field} is required`);

// ─── Auth ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: nonEmptyString('First name').max(50, 'First name is too long'),
    lastName: nonEmptyString('Last name').max(50, 'Last name is too long'),
    middleName: z.string().max(50, 'Middle name is too long').optional(),
    phone: philippinePhone.optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
      error: 'Gender is required',
    }),
    birthDate: z.string().min(1, 'Birth date is required'),
    civilStatus: z.enum(
      ['single', 'married', 'widowed', 'separated', 'divorced'],
      { error: 'Civil status is required' },
    ),
    address: nonEmptyString('Address').max(500, 'Address is too long'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Profile ────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  firstName: nonEmptyString('First name').max(50, 'First name is too long'),
  lastName: nonEmptyString('Last name').max(50, 'Last name is too long'),
  middleName: z.string().max(50, 'Middle name is too long').optional(),
  phone: philippinePhone.optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    error: 'Gender is required',
  }),
  birthDate: z.string().min(1, 'Birth date is required'),
  civilStatus: z.enum(
    ['single', 'married', 'widowed', 'separated', 'divorced'],
    { error: 'Civil status is required' },
  ),
  address: nonEmptyString('Address').max(500, 'Address is too long'),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Complaints ─────────────────────────────────────────────────────────────

export const complaintSchema = z.object({
  title: nonEmptyString('Title')
    .max(150, 'Title must be 150 characters or fewer'),
  description: nonEmptyString('Description')
    .min(20, 'Description must be at least 20 characters')
    .max(3000, 'Description must be 3000 characters or fewer'),
  category: z.enum(
    [
      'noise',
      'property_dispute',
      'domestic',
      'theft',
      'vandalism',
      'public_disturbance',
      'boundary_dispute',
      'financial_dispute',
      'other',
    ],
    { error: 'Category is required' },
  ),
  location: z
    .string()
    .max(300, 'Location must be 300 characters or fewer')
    .optional(),
  respondentName: z
    .string()
    .max(100, 'Respondent name must be 100 characters or fewer')
    .optional(),
  respondentAddress: z
    .string()
    .max(300, 'Respondent address must be 300 characters or fewer')
    .optional(),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;

export const complaintCommentSchema = z.object({
  content: nonEmptyString('Comment')
    .max(1000, 'Comment must be 1000 characters or fewer'),
});

export type ComplaintCommentFormData = z.infer<typeof complaintCommentSchema>;

export const complaintUpdateSchema = z.object({
  status: z.enum(
    ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'],
    { error: 'Status is required' },
  ),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),
  assignedTo: z.string().uuid('Invalid staff ID').optional().or(z.literal('')),
  rejectionReason: z
    .string()
    .max(500, 'Rejection reason must be 500 characters or fewer')
    .optional(),
});

export type ComplaintUpdateFormData = z.infer<typeof complaintUpdateSchema>;

// ─── Document Requests ──────────────────────────────────────────────────────

export const documentRequestSchema = z.object({
  documentType: z.enum(
    [
      'barangay_clearance',
      'barangay_id',
      'certificate_of_residency',
      'certificate_of_indigency',
      'business_clearance',
      'cedula',
      'other',
    ],
    { error: 'Document type is required' },
  ),
  purpose: nonEmptyString('Purpose')
    .max(500, 'Purpose must be 500 characters or fewer'),
  additionalNotes: z
    .string()
    .max(1000, 'Additional notes must be 1000 characters or fewer')
    .optional(),
  numberOfCopies: z
    .number()
    .int('Number of copies must be a whole number')
    .min(1, 'At least 1 copy is required')
    .max(10, 'Maximum of 10 copies allowed')
    .default(1),
});

export type DocumentRequestFormData = z.infer<typeof documentRequestSchema>;

export const documentRequestUpdateSchema = z.object({
  status: z.enum(
    [
      'submitted',
      'processing',
      'for_approval',
      'approved',
      'for_release',
      'released',
      'rejected',
    ],
    { error: 'Status is required' },
  ),
  rejectionReason: z
    .string()
    .max(500, 'Rejection reason must be 500 characters or fewer')
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'waived']).optional(),
  paymentAmount: z
    .number()
    .min(0, 'Payment amount cannot be negative')
    .optional(),
  orNumber: z
    .string()
    .max(50, 'OR number must be 50 characters or fewer')
    .optional(),
});

export type DocumentRequestUpdateFormData = z.infer<typeof documentRequestUpdateSchema>;

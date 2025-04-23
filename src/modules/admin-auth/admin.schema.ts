import { z } from 'zod';

export const registerAdminSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    )
  })
});

export const loginAdminSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required')
  })
});

export const updatePasswordSchema = z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'New password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
      )
    })
  });
  
export type UpdatePasswordInput = z.TypeOf<typeof updatePasswordSchema>;
export type RegisterAdminInput = z.TypeOf<typeof registerAdminSchema>;
export type LoginAdminInput = z.TypeOf<typeof loginAdminSchema>;
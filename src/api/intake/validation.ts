import { z } from 'zod';

export const shortFormLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional(),
  language: z.string().default('English'),
  source: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(5, 'Valid zip code is required')
  }).optional(),
  typeOfAccident: z.string().min(1, 'Type of accident is required'),
  dateOfAccident: z.string().min(1, 'Date of accident is required'),
  injuryBodyParts: z.array(z.string()).min(1, 'At least one injury body part is required'),
  policeInvolved: z.boolean().default(false),
  insurance: z.string().optional(),
  priorAttorney: z.object({
    spokenTo: z.boolean().default(false),
    firmName: z.string().optional(),
    attorneyName: z.string().optional()
  }).optional(),
  uploads: z.array(
    z.object({
      fileName: z.string().min(1, 'File name is required'),
      fileType: z.string().min(1, 'File type is required'),
      fileUrl: z.string().min(1, 'File URL is required')
    })
  ).default([])
});

export type ShortFormLeadInput = z.infer<typeof shortFormLeadSchema>;

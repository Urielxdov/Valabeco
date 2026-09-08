import { z } from "zod";

export const OrganizationStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
const code = z.string().trim().min(1).max(50);
export const CreateJobPositionSchema = z.object({
  code,
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).nullable().optional(),
  maxPositions: z.number().int().positive().max(2147483647).nullable().optional(),
  status: OrganizationStatusSchema.optional(),
}).strict();
export const UpdateJobPositionSchema = CreateJobPositionSchema.partial().refine(
  (value) => Object.keys(value).length > 0, "At least one field is required.",
);
export const CreatePositionSchema = z.object({
  idJobPosition: z.string().uuid(), code,
  name: z.string().trim().min(1).max(100),
  status: OrganizationStatusSchema.optional(),
}).strict();
export const UpdatePositionSchema = CreatePositionSchema.omit({ idJobPosition: true }).partial().refine(
  (value) => Object.keys(value).length > 0, "At least one field is required.",
);
export const AssignPositionSchema = z.object({ idUser: z.string().uuid() }).strict();
export const TransferPositionSchema = z.object({ idPosition: z.string().uuid() }).strict();
export type CreateJobPositionInput = z.infer<typeof CreateJobPositionSchema>;
export type UpdateJobPositionInput = z.infer<typeof UpdateJobPositionSchema>;
export type CreatePositionInput = z.infer<typeof CreatePositionSchema>;
export type UpdatePositionInput = z.infer<typeof UpdatePositionSchema>;

export const JobPositionSchema = CreateJobPositionSchema.extend({
  idJobPosition: z.string().uuid(), description: z.string().nullable(),
  maxPositions: z.number().int().positive().nullable(), status: OrganizationStatusSchema,
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
export const PositionAssignmentSchema = z.object({
  idPositionAssignment: z.string().uuid(), idPosition: z.string().uuid(), idUser: z.string().uuid(),
  startDate: z.string().datetime(), endDate: z.string().datetime().nullable(),
  status: z.enum(["ACTIVE", "ENDED", "CANCELED"]),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
export const PositionSchema = CreatePositionSchema.extend({
  idPosition: z.string().uuid(), status: OrganizationStatusSchema,
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  occupancy: z.enum(["VACANT", "OCCUPIED"]).nullable(),
  currentAssignment: PositionAssignmentSchema.nullable(),
});
export type JobPositionDto = z.infer<typeof JobPositionSchema>;
export type PositionDto = z.infer<typeof PositionSchema>;
export type PositionAssignmentDto = z.infer<typeof PositionAssignmentSchema>;

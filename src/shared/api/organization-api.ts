import {
  AssignPositionSchema,
  CreateJobPositionSchema,
  CreatePositionSchema,
  JobPositionSchema,
  PositionAssignmentSchema,
  PositionSchema,
  TransferPositionSchema,
  UpdateJobPositionSchema,
  UpdatePositionSchema,
  type CreateJobPositionInput,
  type CreatePositionInput,
  type UpdateJobPositionInput,
  type UpdatePositionInput,
} from "@valabeco/contracts";
import { z } from "zod";
import { ApiClient } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const api = new ApiClient(API_BASE_URL);

export const organizationApi = {
  listJobs(init?: RequestInit) {
    return api.get("/organization/job-positions", z.array(JobPositionSchema), init);
  },

  createJob(input: CreateJobPositionInput, init?: RequestInit) {
    const request = CreateJobPositionSchema.parse(input);
    return api.post("/organization/job-positions", JobPositionSchema, request, init);
  },

  updateJob(idJobPosition: string, input: UpdateJobPositionInput, init?: RequestInit) {
    const request = UpdateJobPositionSchema.parse(input);
    return api.patch(`/organization/job-positions/${idJobPosition}`, JobPositionSchema, request, init);
  },

  listPositions(init?: RequestInit) {
    return api.get("/organization/positions", z.array(PositionSchema), init);
  },

  createPosition(input: CreatePositionInput, init?: RequestInit) {
    const request = CreatePositionSchema.parse(input);
    return api.post("/organization/positions", PositionSchema, request, init);
  },

  updatePosition(idPosition: string, input: UpdatePositionInput, init?: RequestInit) {
    const request = UpdatePositionSchema.parse(input);
    return api.patch(`/organization/positions/${idPosition}`, PositionSchema, request, init);
  },

  positionHistory(idPosition: string, init?: RequestInit) {
    return api.get(`/organization/positions/${idPosition}/assignments`, z.array(PositionAssignmentSchema), init);
  },

  userAssignments(idUser: string, init?: RequestInit) {
    return api.get(`/organization/users/${idUser}/assignments`, z.array(PositionAssignmentSchema), init);
  },

  assign(idPosition: string, idUser: string, init?: RequestInit) {
    const request = AssignPositionSchema.parse({ idUser });
    return api.post(`/organization/positions/${idPosition}/assignments`, PositionAssignmentSchema, request, init);
  },

  endAssignment(idPositionAssignment: string, init?: RequestInit) {
    return api.post(`/organization/assignments/${idPositionAssignment}/end`, PositionAssignmentSchema, undefined, init);
  },

  cancelAssignment(idPositionAssignment: string, init?: RequestInit) {
    return api.post(`/organization/assignments/${idPositionAssignment}/cancel`, PositionAssignmentSchema, undefined, init);
  },

  transfer(idPositionAssignment: string, idPosition: string, init?: RequestInit) {
    const request = TransferPositionSchema.parse({ idPosition });
    return api.post(`/organization/assignments/${idPositionAssignment}/transfer`, PositionAssignmentSchema, request, init);
  },
};

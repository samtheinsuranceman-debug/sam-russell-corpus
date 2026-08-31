import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPlanningCase,
  createPlanningCaseNote,
  ensureMembership,
  getClientById,
  getOrCreateWorkspace,
  getPlanningCaseById,
  getUserPortalPreferences,
  getWorkspaceByOwnerId,
  listPlanningCaseNotes,
  listPlanningCases,
  resolvePlanningCaseNote,
  updatePlanningCase,
  upsertUserPortalPreferences,
} from "./db";
import { protectedProcedure, router } from "./_core/trpc";

async function workspaceForUser(userId: number) {
  const existing = await getWorkspaceByOwnerId(userId);
  if (existing) {
    await ensureMembership(userId, existing.id);
    return existing;
  }
  const workspace = await getOrCreateWorkspace(userId, "My Workspace", `workspace-${userId}-${Date.now()}`);
  if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create workspace" });
  await ensureMembership(userId, workspace.id);
  return workspace;
}

const recordSchema = z.record(z.string(), z.unknown());

export const planningCasesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    return listPlanningCases(workspace.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    const planningCase = await getPlanningCaseById(input.id, workspace.id);
    if (!planningCase) throw new TRPCError({ code: "NOT_FOUND", message: "Planning case not found" });
    return planningCase;
  }),

  create: protectedProcedure.input(z.object({
    title: z.string().trim().min(2).max(300),
    clientId: z.number().int().positive().nullable().optional(),
    caseType: z.string().trim().min(2).max(100).default("comprehensive"),
  })).mutation(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    if (input.clientId) {
      const client = await getClientById(input.clientId, workspace.id);
      if (!client) throw new TRPCError({ code: "BAD_REQUEST", message: "Client does not belong to this workspace" });
    }
    return createPlanningCase({
      workspaceId: workspace.id,
      userId: ctx.user.id,
      clientId: input.clientId ?? null,
      title: input.title,
      caseType: input.caseType,
      status: "draft",
      currentStage: "discovery",
      assumptions: {},
      results: {},
      workflowState: { completedSteps: [] },
    });
  }),

  update: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    title: z.string().trim().min(2).max(300).optional(),
    status: z.enum(["draft", "active", "review", "completed", "archived"]).optional(),
    currentStage: z.string().trim().min(2).max(100).optional(),
    assumptions: recordSchema.optional(),
    results: recordSchema.optional(),
    workflowState: recordSchema.optional(),
  })).mutation(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    const existing = await getPlanningCaseById(input.id, workspace.id);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Planning case not found" });
    const { id, ...changes } = input;
    return updatePlanningCase(id, workspace.id, changes);
  }),

  notes: protectedProcedure.input(z.object({ planningCaseId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    const planningCase = await getPlanningCaseById(input.planningCaseId, workspace.id);
    if (!planningCase) throw new TRPCError({ code: "NOT_FOUND", message: "Planning case not found" });
    return listPlanningCaseNotes(input.planningCaseId);
  }),

  addNote: protectedProcedure.input(z.object({
    planningCaseId: z.number().int().positive(),
    noteType: z.enum(["advisor", "client", "compliance", "system"]).default("advisor"),
    content: z.string().trim().min(1).max(10_000),
  })).mutation(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    const planningCase = await getPlanningCaseById(input.planningCaseId, workspace.id);
    if (!planningCase) throw new TRPCError({ code: "NOT_FOUND", message: "Planning case not found" });
    return createPlanningCaseNote({ ...input, userId: ctx.user.id });
  }),

  resolveNote: protectedProcedure.input(z.object({
    planningCaseId: z.number().int().positive(),
    noteId: z.number().int().positive(),
    resolved: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    const planningCase = await getPlanningCaseById(input.planningCaseId, workspace.id);
    if (!planningCase) throw new TRPCError({ code: "NOT_FOUND", message: "Planning case not found" });
    await resolvePlanningCaseNote(input.noteId, input.planningCaseId, input.resolved);
    return { success: true } as const;
  }),

  preferences: protectedProcedure.query(async ({ ctx }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    return getUserPortalPreferences(ctx.user.id, workspace.id);
  }),

  savePreferences: protectedProcedure.input(z.object({
    defaultLandingPath: z.string().max(500).optional(),
    openNavGroups: z.array(z.string().max(200)).max(50).optional(),
    secondaryCategories: z.array(z.string().max(200)).max(20).optional(),
    compactSidebar: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    lastVisitedPath: z.string().max(500).optional(),
  })).mutation(async ({ ctx, input }) => {
    const workspace = await workspaceForUser(ctx.user.id);
    return upsertUserPortalPreferences(ctx.user.id, workspace.id, input);
  }),
});

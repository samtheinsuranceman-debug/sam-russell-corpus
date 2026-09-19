/**
 * A chain is the least supervised surface in the product. A user builds one
 * once, re-runs it, and nobody re-reads step three. So the things worth pinning
 * here are not that it runs — it obviously runs — but that the two ways it
 * could quietly produce a wrong number are closed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ENGINE_REGISTRY,
  ENGINE_NAMES,
  CHAIN_EXCLUDED,
  runEngineChain,
} from './engineChainingRouter';

const source = readFileSync(resolve(__dirname, 'engineChainingRouter.ts'), 'utf-8');

/** A step with the defaults the zod schema would have applied. */
const step = (engineId: string, order: number, inputs: Record<string, unknown> = {}, inputMappings: Record<string, string> = {}) =>
  ({ engineId, label: engineId, order, inputs, inputMappings });

describe('the engine chain', () => {
  it('registers every engine it names, and names every engine it registers', () => {
    expect(Object.keys(ENGINE_REGISTRY).sort()).toEqual(Object.keys(ENGINE_NAMES).sort());
    expect(Object.keys(ENGINE_REGISTRY).length).toBe(27);
  });

  it('cannot reach the ungated illustration generator', () => {
    // The version this was harvested from wired generateCompliantIllustration
    // straight in. That function derives its own maximum illustrated rate and
    // emits persuasion optimisations; inside a chain nobody would ever see it.
    // Reachability, not text: the header discusses the function by name, which
    // is the point of the header. What must not exist is an import of it or a
    // call to it, so comments are stripped before looking.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//'))
      .join('\n');
    expect(code).not.toMatch(/generateCompliantIllustration\s*[(,}]/);
    expect(code).not.toMatch(/import[\s\S]{0,120}generateCompliantIllustration/);
    expect(code).toMatch(/import \{ gatedIllustration \} from "@shared\/iulIllustrationGate"/);
    expect(code).toMatch(/gatedIllustration\(/);
  });

  it('refuses the illustration step without the exhibit facts rather than guessing them', () => {
    const { steps } = runEngineChain([step('iulCompliance', 1, { carrier: 'X', capRate: 10.5 })]);
    expect(steps[0].success).toBe(false);
    expect(steps[0].error).toMatch(/exhibitFacts/);
    expect(steps[0].error).toMatch(/product-specific/);
    expect(steps[0].result).toBeNull();
  });

  it('keeps each result under its own engine id, so two engines cannot overwrite one another', () => {
    // The original merged every output into one flat bag. Two engines that both
    // return `score` would silently collide and a later step could compute from
    // the wrong one. Nothing in a result may leak into a later step except
    // through an explicit mapping, so an unmapped step sees only its own inputs.
    const seen: Array<Record<string, unknown>> = [];
    const probe = (input: Record<string, unknown>) => {
      seen.push({ ...input });
      return { score: 42, collide: 'from-probe' };
    };
    const saved = ENGINE_REGISTRY.behavioralBias;
    const saved2 = ENGINE_REGISTRY.retirementGap;
    try {
      (ENGINE_REGISTRY as Record<string, unknown>).behavioralBias = probe;
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = probe;
      runEngineChain([
        step('behavioralBias', 1, { own: 'first' }),
        step('retirementGap', 2, { own: 'second' }),
      ]);
      expect(seen).toHaveLength(2);
      // The second step saw its own inputs and nothing from the first.
      expect(seen[1]).toEqual({ own: 'second' });
      expect(seen[1].score).toBeUndefined();
      expect(seen[1].collide).toBeUndefined();
    } finally {
      (ENGINE_REGISTRY as Record<string, unknown>).behavioralBias = saved;
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = saved2;
    }
  });

  it('passes earlier output forward when a mapping asks for it, by path', () => {
    const seen: Array<Record<string, unknown>> = [];
    const emit = () => ({ nested: { deep: 7 } });
    const capture = (input: Record<string, unknown>) => { seen.push({ ...input }); return {}; };
    const s1 = ENGINE_REGISTRY.behavioralBias;
    const s2 = ENGINE_REGISTRY.retirementGap;
    try {
      (ENGINE_REGISTRY as Record<string, unknown>).behavioralBias = emit;
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = capture;
      const { steps } = runEngineChain([
        step('behavioralBias', 1),
        step('retirementGap', 2, {}, { pulled: 'behavioralBias.nested.deep' }),
      ]);
      expect(seen[0]).toEqual({ pulled: 7 });
      expect(steps[1].unresolvedMappings).toBeUndefined();
    } finally {
      (ENGINE_REGISTRY as Record<string, unknown>).behavioralBias = s1;
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = s2;
    }
  });

  it('reports a mapping that resolved to nothing instead of passing undefined along silently', () => {
    const s2 = ENGINE_REGISTRY.retirementGap;
    try {
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = () => ({});
      const { steps } = runEngineChain([
        step('retirementGap', 1, {}, { pulled: 'behavioralBias.never.ran' }),
      ]);
      expect(steps[0].unresolvedMappings).toEqual(['pulled <- behavioralBias.never.ran']);
    } finally {
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = s2;
    }
  });

  it('runs steps in order regardless of the order they arrive in', () => {
    const order: string[] = [];
    const saved = { a: ENGINE_REGISTRY.behavioralBias, b: ENGINE_REGISTRY.retirementGap };
    try {
      (ENGINE_REGISTRY as Record<string, unknown>).behavioralBias = () => { order.push('first'); return {}; };
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = () => { order.push('second'); return {}; };
      runEngineChain([step('retirementGap', 2), step('behavioralBias', 1)]);
      expect(order).toEqual(['first', 'second']);
    } finally {
      (ENGINE_REGISTRY as Record<string, unknown>).behavioralBias = saved.a;
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = saved.b;
    }
  });

  it('records an unknown engine as a failed step rather than aborting the chain', () => {
    const { steps } = runEngineChain([
      step('no-such-engine', 1),
      step('carrierStrength', 2),
    ]);
    expect(steps).toHaveLength(2);
    expect(steps[0].success).toBe(false);
    expect(steps[0].error).toMatch(/not found/);
    // The chain continued: a later step still ran.
    expect(steps[1].engineId).toBe('carrierStrength');
  });

  it('refuses to chain the captive engine, and says why', () => {
    expect(CHAIN_EXCLUDED.captiveInsurance).toMatch(/listed-transaction/i);
    const { steps } = runEngineChain([step('captiveInsurance', 1)]);
    expect(steps[0].success).toBe(false);
    expect(steps[0].error).toMatch(/listed-transaction/i);
  });

  it('every exclusion names a real engine and gives a reason worth reading', () => {
    for (const id of Object.keys(CHAIN_EXCLUDED)) {
      expect(ENGINE_REGISTRY[id], `${id} is excluded but is not an engine`).toBeTruthy();
      expect(CHAIN_EXCLUDED[id].length, id).toBeGreaterThan(80);
    }
  });

  it('survives an engine that throws, and keeps the message', () => {
    const saved = ENGINE_REGISTRY.retirementGap;
    try {
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = () => { throw new Error('boom from engine'); };
      const { steps } = runEngineChain([step('retirementGap', 1)]);
      expect(steps[0].success).toBe(false);
      expect(steps[0].error).toBe('boom from engine');
    } finally {
      (ENGINE_REGISTRY as Record<string, unknown>).retirementGap = saved;
    }
  });

  it('the schema carries both tables the router writes to', () => {
    const schema = readFileSync(resolve(__dirname, '../drizzle/schema.ts'), 'utf-8');
    expect(schema).toContain('mysqlTable("engine_chains"');
    expect(schema).toContain('mysqlTable("engine_chain_runs"');
    const migration = readFileSync(resolve(__dirname, '../drizzle/migrations/0074_engine_chains.sql'), 'utf-8');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS `engine_chains`');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS `engine_chain_runs`');
  });
});

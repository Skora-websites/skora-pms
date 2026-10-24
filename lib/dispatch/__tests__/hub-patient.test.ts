/**
 * Patient SSE trackers: the /api/patient/sos/stream channel.
 *
 * The hub keeps doctor listeners and patient listeners in separate
 * registries under one globalThis singleton. These tests pin the patient
 * side: delivery, multi-listener fan-out, unsubscribe cleanup, and — the
 * security-relevant property — that one patient's frames never reach
 * another patient's or any doctor's listener.
 */

import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  broadcastToDoctor,
  broadcastToPatient,
  subscribe,
  subscribePatient,
  type SosEvent,
} from "../hub";

/** Every listener in these tests gets a fresh id — the hub is a process-wide singleton. */
let seq = 10_000;
const nextId = () => ++seq;

const statusEvent = (requestId: number, status: string): SosEvent => ({
  type: "sos:status",
  requestId,
  status,
});

test("a subscribed patient tracker receives status broadcasts", () => {
  const patientId = nextId();
  const seen: SosEvent[] = [];
  const unsub = subscribePatient(patientId, (e) => seen.push(e));

  broadcastToPatient(patientId, statusEvent(1, "accepted"));

  assert.equal(seen.length, 1);
  assert.equal(seen[0].type, "sos:status");
  unsub();
});

test("all of a patient's tabs receive the same broadcast", () => {
  const patientId = nextId();
  const a: SosEvent[] = [];
  const b: SosEvent[] = [];
  const unsubA = subscribePatient(patientId, (e) => a.push(e));
  const unsubB = subscribePatient(patientId, (e) => b.push(e));

  broadcastToPatient(patientId, statusEvent(2, "completed"));

  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
  unsubA();
  unsubB();
});

test("unsubscribing one tracker leaves the other listening", () => {
  const patientId = nextId();
  const a: SosEvent[] = [];
  const b: SosEvent[] = [];
  const unsubA = subscribePatient(patientId, (e) => a.push(e));
  const unsubB = subscribePatient(patientId, (e) => b.push(e));

  unsubA();
  broadcastToPatient(patientId, statusEvent(3, "accepted"));

  assert.equal(a.length, 0);
  assert.equal(b.length, 1);
  unsubB();
});

test("a broadcast is not delivered to a different patient", () => {
  const patientId = nextId();
  const otherId = nextId();
  const mine: SosEvent[] = [];
  const theirs: SosEvent[] = [];
  const unsubMine = subscribePatient(patientId, (e) => mine.push(e));
  const unsubTheirs = subscribePatient(otherId, (e) => theirs.push(e));

  broadcastToPatient(otherId, statusEvent(4, "accepted"));

  assert.equal(mine.length, 0);
  assert.equal(theirs.length, 1);
  unsubMine();
  unsubTheirs();
});

test("patient broadcasts never reach doctor listeners and vice versa", () => {
  const patientId = nextId();
  const doctorId = nextId();
  const patientSink: SosEvent[] = [];
  const doctorSink: SosEvent[] = [];
  const unsubPatient = subscribePatient(patientId, (e) => patientSink.push(e));
  const unsubDoctor = subscribe(doctorId, (e) => doctorSink.push(e));

  broadcastToPatient(patientId, statusEvent(5, "accepted"));
  assert.equal(doctorSink.length, 0, "doctor must not see patient frames");

  // A doctor-only event must not disturb patient listeners.
  broadcastToDoctor(doctorId, { type: "sos:taken", requestId: 5 });
  assert.equal(patientSink.length, 1, "patient keeps only their own frame");
  assert.equal(doctorSink.length, 1);
  unsubPatient();
  unsubDoctor();
});

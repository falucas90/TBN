---
id: bli-implementing-a-real-10
rawText: ''
title: Scaffold service layer for real backend integration
type: task
epic: data
size: m
labels:
- mock-data
groomingStatus: running
createdAt: 2026-06-02T22:00:25Z
events:
- type: grooming_started
  timestamp: 2026-06-02T22:00:25Z
- type: grooming_failed
  timestamp: 2026-06-02T22:01:18Z
  error: Grooming agent exited without completing.
- type: grooming_started
  timestamp: 2026-06-02T22:02:52Z
- type: grooming_failed
  timestamp: 2026-06-02T22:02:55Z
  error: Grooming agent exited without completing.
- type: grooming_started
  timestamp: 2026-06-03T14:50:35Z
---

Implementing a real backend, database, or hosted API — the service functions will be structured to accept real implementations, but the actual backend is deferred until the real data source is decided.

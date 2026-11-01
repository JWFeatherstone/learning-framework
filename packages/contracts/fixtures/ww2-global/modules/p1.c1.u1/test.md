---
id: p1.c1.u1/test
kind: test
unit: p1.c1.u1
objectives: [obj.manchuria.causes, obj.manchuria.league]
approach: mixed paper
planVersion: 1
provenance:
  generatedAt: 2026-10-31T19:50:00Z
  model: placeholder/strong
  prompt: test@0
  inputs: [plan.yaml@v1, modules/p1.c1.u1/reading.md]
  by: human
  reviewed: true
items:
  - id: q1
    objective: obj.manchuria.causes
    type: free
    prompt: Explain the Mukden incident from the Kwantung Army's point of view and from Nanjing's.
    rubric:
      - "0: one side only, or neither"
      - "1: both sides named, but one is a caricature"
      - "2: both sides given reasons they would recognise"
  - id: q2
    objective: obj.manchuria.league
    type: source
    source: "Excerpt from the Lytton Report, chapter IX."
    prompt: What does this passage show about what the Commission could and could not conclude?
    rubric:
      - "0: summarises the passage"
      - "1: identifies one limit on the Commission"
      - "2: ties a limit to the Covenant's procedures or to member states' interests"
  - id: q3
    objective: obj.manchuria.league
    type: choice
    prompt: Which government's domestic constraints most shaped the League's response in 1931-32?
    options: [Britain, Japan, China, The United States]
    key: Britain
passing:
  obj.manchuria.causes: 0.6
  obj.manchuria.league: 0.6
---

Items are the body of a test; nothing is needed here.

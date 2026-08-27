---
version: 1
slug: "src-app-workspace-work-page-tsx"
primary_target: "src/app/(workspace)/work/page.tsx"
related_targets: ["src/components/work/work-workspace.tsx","src/components/workspace/workspace-shell.tsx","src/app/(workspace)/page.tsx"]
---

## Scope and mode

Operate. The Work route is the Iteration 6 meeting-to-completion surface for
meetings, agendas, minutes, decisions, tasks, comments, and attachments.

## Audience and task

Employees review meetings they organize or attend, respond to invitations,
prepare agendas, record outcomes, and complete assigned work. Authorized
managers schedule scoped meetings and coordinate tasks without losing the link
between a decision and its follow-through.

## Content and constraints

- Every meeting, participant, agenda item, note, decision, task, comment,
  attachment relation, RSVP, and status is persisted; never fabricate activity.
- Meeting visibility follows organizer or participant membership. Task
  visibility follows creator or assignee membership, including tasks linked to
  an accessible meeting.
- Meeting outcomes and task assignments create durable notifications and live
  refetch signals. Persisted API state remains authoritative after reconnect.
- Dates are stored as instants and presented in the user's local timezone.
- Loading, empty, error, denied, overdue, cancelled, completed, disconnected,
  and partial-participation states remain explicit and keyboard operable.

## Chosen direction

Twin Registers, selected in the attended surface round. Code-led execution;
the critique reference is
`.impeccable/mocks/decision/iteration-6-twin-registers.png`.

The desktop first view uses a slim date orientation strip above two parallel
ruled registers: Meetings and Tasks. Selecting either record opens one shared
focused pane below, so agenda, minutes, decisions, assignments, comments, and
attachments read as one operational chain without merging their distinct
lifecycles. Meetings expose time, organizer, attendance, and RSVP; tasks expose
priority, assignees, due date, and status. Signal Orange identifies only the
active date, selected record, and decisive creation actions. On narrow screens,
the registers become an ordered mode switch followed by one register and its
focused record, preserving context without horizontal scrolling. The signature
interaction is cross-register focus: selecting a linked assignment from meeting
minutes moves task focus without leaving the workbench, while returning to its
source meeting remains one action away. Motion is limited to a short state
transition and respects reduced motion.

## Implementation inventory

| Visible commitment | Medium |
| --- | --- |
| Existing workspace rail and coordinate header | Existing semantic components |
| Date orientation strip | Semantic buttons and CSS rules |
| Parallel meeting and task registers | Accessible HTML lists/tables and CSS grid |
| Shared focused record pane | React components with server-owned state |
| Agenda-to-decision-to-task linkage | Semantic grouped records and authored CSS rules |
| Actions and status icons | Existing Lucide icon library |
| Comments and attachments | Existing form and file APIs extended by relations |
| Mobile ordered flow | CSS media queries; no alternate content model |

## Unresolved decisions

None for the build. Calendar-provider integrations and recurring meeting rules
remain outside Phase 1 until a real operational requirement is confirmed.

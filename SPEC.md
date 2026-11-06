# FoodLoop - Project Specification

A food waste redistribution and donation management system (B.Tech CSE mini project).
Donors list surplus food. NGOs and volunteers request it. The donor approves. Contact details are revealed only to the approved requester. Food is collected and distributed. Admin verifies and monitors.

## Tech stack
- Frontend: React (Vite), React Router, Axios
- Backend: Node.js, Express 5, ES modules (`"type": "module"`)
- Database: MongoDB with Mongoose
- Auth: JWT + bcryptjs
- Uploads: Multer (local `/uploads`)
- Scheduling: node-cron (expiry job)
- NOT included: maps/GPS, payments, beneficiary accounts, built-in chat, AI features

## Folder structure
```
FoodLoop/
  backend/  config/ controllers/ middleware/ models/ routes/ services/ jobs/ utils/ app.js server.js
  frontend/ src/ (assets, components, pages/{auth,donor,ngo,volunteer,admin}, layouts, context, services, hooks, utils)
```
Already created. Backend runs; `GET /api/health` works.

## Roles
| Role | Can do |
|---|---|
| donor | Create/edit/cancel listings, view requests on own listings, approve/reject, confirm handover |
| ngo | Browse available food, request, cancel own request, confirm collection, record distribution |
| volunteer | Same as NGO |
| admin | Verify NGOs, manage users, view all donations, handle reports, see statistics |

Beneficiaries (people in need) have NO accounts. NGOs/volunteers record distribution as aggregate counts.

## Statuses
**Listing:** available, partially_reserved, fully_reserved, completed, expired, cancelled
**Request:** pending, approved, rejected, cancelled, collected, distributed

Approved does not mean collected. Keep the stages separate.

## Workflow
1. Donor creates listing (food info, image, quantity, preparation time, safe pickup deadline, storage conditions, safety declaration, pickup instructions).
2. Listing appears to NGOs/volunteers (contact details hidden).
3. Requester submits request (quantity + optional message).
4. Donor approves or rejects.
5. On approval, donor contact details (name, phone, pickup instructions) become visible to THAT requester only.
6. Donor confirms handover; requester confirms receipt (status: collected).
7. Requester records distribution (quantity distributed, beneficiary count, notes) -> status: distributed.
8. Listing becomes completed when all approved quantity is distributed.

## Contact visibility rules
| Situation | Visible? |
|---|---|
| Browsing listings | No |
| Pending request | No |
| Rejected / cancelled | No |
| Approved (to that requester only) | Yes |

Enforce on the SERVER. Never rely on hiding fields in React.

## Database schema (Mongoose)

**User:** name, email (unique), password (hashed, `select: false`), phone, role (donor|ngo|volunteer|admin), organizationName, organizationDescription, verificationStatus (pending|verified|rejected), isActive, timestamps.
- NGOs must be verified by admin before they can request food.

**FoodListing:** donorId (ref User), foodName, description, category (cooked|packaged|fruits|bakery|other), image, quantity, unit, reservedQuantity, collectedQuantity, distributedQuantity, preparationTime, safePickupDeadline, storageConditions, foodSafetyDeclaration (must be true), pickupInstructions, status, timestamps.
- available quantity = quantity - reservedQuantity

**Request:** foodListingId, requesterId, requestedQuantity, message, status, donorDecisionAt, collectedAt, distributedAt, timestamps.

**Notification:** userId, title, message, type, relatedListingId, relatedRequestId, isRead, createdAt.

**DistributionRecord:** foodListingId, requestId, distributorId, quantityDistributed, beneficiaryCount, distributionNotes, distributedAt, createdAt.

**Report:** reportedBy, reportedUserId, foodListingId, reason, description, status (pending|reviewed|resolved|dismissed), adminRemarks, createdAt.

Add indexes on: listing status + safePickupDeadline, request foodListingId + requesterId, notification userId + isRead.

## API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET | /api/auth/me | any logged-in |
| POST | /api/food | donor |
| GET | /api/food | NGO/volunteer/admin (available listings, no contact info) |
| GET | /api/food/mine | donor |
| GET | /api/food/:id | logged-in (contact info only if approved requester or owner) |
| PUT | /api/food/:id | donor (owner) |
| DELETE | /api/food/:id | donor (owner) - cancels |
| POST | /api/requests | NGO/volunteer |
| GET | /api/requests/my | NGO/volunteer |
| GET | /api/requests/received | donor |
| PATCH | /api/requests/:id/approve | donor (owner of listing) |
| PATCH | /api/requests/:id/reject | donor (owner of listing) |
| PATCH | /api/requests/:id/cancel | requester |
| PATCH | /api/requests/:id/collect | donor/requester confirmation |
| PATCH | /api/requests/:id/distribute | requester |
| GET | /api/notifications | logged-in |
| PATCH | /api/notifications/:id/read | logged-in |
| POST | /api/reports | logged-in |
| GET | /api/admin/dashboard | admin |
| GET | /api/admin/users | admin |
| PATCH | /api/admin/users/:id/verify | admin |
| PATCH | /api/admin/reports/:id | admin |

All protected routes check authentication AND role on the server.

## Critical business rules
1. **No over-reservation.** Approved quantities must never exceed listing quantity. Use atomic conditional updates (`findOneAndUpdate` with a condition on remaining quantity) or a transaction.
2. **Release quantity** when an approved request is cancelled. Rejected requests never reserved any.
3. **Expiry job** (node-cron, every minute or few minutes): listings past `safePickupDeadline` become `expired`; no new requests/approvals on expired listings; approved-but-uncollected requests on expired listings are flagged for donor/admin review.
4. **Edit protection:** donors cannot reduce quantity below reserved quantity or move the deadline in ways that break approved requests.
5. **Distribution cannot exceed collected quantity.**
6. **Role separation:** a requester cannot approve their own request; donors cannot request food; only listing owners can approve/reject.
7. **Food safety:** donor must tick the safety declaration. The deadline is NOT a safety certification. Show a safety notice in the UI.
8. Never return password hashes in any response.
9. Validate all inputs; return consistent JSON: `{ success, message, data }`.

## Frontend pages
- Public: Home, About/How it works, Login, Register
- Donor: Dashboard, Add donation, My donations, Received requests
- NGO/Volunteer: Dashboard, Available food (search, category filter, sort by urgency), Food details, My requests, Approved donations, Distribution history
- Admin: Dashboard (statistics), User management, NGO verification, Donations, Reports

Use a route guard component that checks role. Store the JWT in memory/localStorage via an AuthContext.

## Build order (one module at a time, test each before the next)
1. Authentication (User model, register/login/me, JWT, auth + role middleware)
2. Food listings + donor CRUD + image upload
3. Requests + approve/reject + quantity logic
4. Collect/distribute + contact reveal + notifications
5. Admin APIs + expiry cron job + reports
6. React frontend, page by page

## Demo flow (for viva)
Donor uploads 50 meals -> NGO (other browser) requests 30 -> donor approves -> NGO sees donor contact -> collect -> distribute -> admin dashboard shows updated stats.

## Test checklist
- Donor cannot call NGO-only endpoints
- Requester cannot approve own request
- Rejected requester never sees donor contact
- Two requests cannot over-reserve
- Expired listings reject new requests/approvals
- Distributed quantity cannot exceed collected quantity
- Only owner can edit/cancel a listing

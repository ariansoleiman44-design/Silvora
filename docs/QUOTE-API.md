# Quote submission API contract

The site is frontend-only. To make quote and contact submissions actually
reach a human, implement one HTTP endpoint that accepts the payloads
below and set it in the environment:

```bash
NEXT_PUBLIC_FORMS_ENDPOINT=https://api.example.com/enquiries
```

That single variable flips `lib/quote-service.ts` from mock/unconfigured
into `api` mode. No code change is required.

> **The safety rule.** Until an endpoint is configured, a production
> build reports `mode: "unconfigured"` and the UI tells the visitor the
> request was NOT sent. Mock mode — which resolves successfully and
> stores the payload in `localStorage` — is available in development
> only, and is downgraded automatically in production. Do not remove
> that downgrade; connect a backend instead.

---

## Endpoint

```
POST <NEXT_PUBLIC_FORMS_ENDPOINT>
Content-Type: application/json
```

The body is always an envelope:

```json
{
  "type": "quote" | "contact",
  "payload": { ... }
}
```

CORS must allow the site origin and the `Content-Type` header. No auth
header is sent — the endpoint is called from the browser, so treat it as
public and protect it with rate limiting, a bot check (Turnstile,
hCaptcha) and server-side validation. Never put a secret key in
`NEXT_PUBLIC_*`.

---

## Request payload — `type: "quote"`

TypeScript source of truth: `QuoteRequest` in
[`types/quote.ts`](../types/quote.ts).

| Field | Type | Notes |
|---|---|---|
| `reference` | `string` | Client-generated, e.g. `CF-260906-4KX2`. **Not authoritative** — issue your own and return it. |
| `createdAt` | ISO 8601 `string` | Browser clock. Do not trust it for ordering. |
| `orderType` | `"farm" \| "commercial" \| "distributor" \| "export"` | Decides which `requirements` fields were shown. |
| `buyer` | `QuoteBuyer` | `name`, `company`, `email`, `phone`, `whatsapp`. |
| `company` | `string` | Convenience copy of `buyer.company`. |
| `products` | `QuoteItem[]` | May be empty — a buyer can describe a need without picking a product. |
| `requirements` | `QuoteRequirements` | Flat, all-optional. See below. |
| `delivery` | `QuoteDelivery` | `country`, `region`, `preferredDate`, `unloadEquipment`, `notes`. |
| `supplyMode` | `"one-time" \| "recurring"` | |
| `frequency` | `"weekly" \| "biweekly" \| "monthly" \| "custom" \| null` | `null` when `supplyMode` is `one-time`. |
| `frequencyNote` | `string` | Free text when `frequency` is `custom`. |
| `calculatorEstimate` | `CalculatorEstimate \| null` | The planning working, if the buyer used the calculator. **A planning estimate, not an order.** |
| `notes` | `string` | |
| `marketingConsent` | `boolean` | Only ever `true` if the buyer ticked the box. Honour it. |
| `source` | `string` | e.g. `"quote-wizard"`. |

### `QuoteItem`

```ts
{
  uid: string;        // line id — the same product can appear twice
  productId: string;  // e.g. "p-001"
  slug: string;       // e.g. "premium-round-bale"
  name: string;
  format: string;     // display label, e.g. "Round"
  quantity: number;   // bales
  image: string;      // absolute URL
  frequency?: SupplyFrequency;  // per-line cadence override
  notes?: string;
}
```

### `QuoteRequirements`

Every field is optional; which ones are populated depends on
`orderType`. Read them defensively.

- Shared: `estimatedQuantity`, `labDataRequested`
- Farm: `livestock`, `animalCount`, `deliveryRequired`
- Commercial: `monthlyVolume`, `preferredFormat`, `contractLength`
- Distributor: `resaleTerritory`, `packagingRequirements`, `privateLabelInterest`
- Export: `destinationCountry`, `destinationPort`, `loadPreference`, `incoterm`

---

## Request payload — `type: "contact"`

`ContactRequest` in [`types/quote.ts`](../types/quote.ts): `name`,
`company`, `phone`, `email`, `country`, `city`, `message`,
`submittedAt`.

---

## Response

### Success — `200 OK`

```json
{ "reference": "CF-2026-00184" }
```

`reference` is optional. When present it replaces the client-generated
one in the confirmation screen, so return your own order/ticket id if
you have one. Any 2xx with a valid JSON body is treated as delivered.

### Failure — any non-2xx

```json
{ "error": "Human-readable message shown to the visitor." }
```

The message is displayed verbatim, so write it for a farmer, not for a
log. If `error` is missing the UI falls back to `Request failed (<status>)`.

A network failure (DNS, CORS, timeout) is reported as an error too — the
visitor is never told the request succeeded.

---

## Example

Request:

```json
{
  "type": "quote",
  "payload": {
    "reference": "CF-260906-4KX2",
    "createdAt": "2026-09-06T09:14:22.418Z",
    "orderType": "commercial",
    "buyer": {
      "name": "Aram Qadir",
      "company": "Zagros Dairy",
      "email": "aram@example.com",
      "phone": "+964 000 000 0000",
      "whatsapp": ""
    },
    "company": "Zagros Dairy",
    "products": [
      {
        "uid": "k3f9d1qa",
        "productId": "p-001",
        "slug": "premium-round-bale",
        "name": "Premium Round Bale",
        "format": "Round",
        "quantity": 120,
        "image": "https://images.unsplash.com/photo-...",
        "frequency": "monthly"
      }
    ],
    "requirements": {
      "estimatedQuantity": "120",
      "monthlyVolume": "120 bales",
      "preferredFormat": "Round",
      "contractLength": "One season",
      "labDataRequested": true
    },
    "delivery": {
      "country": "Iraq",
      "region": "Erbil",
      "preferredDate": "2026-10-01",
      "unloadEquipment": "yes",
      "notes": "Telehandler on site. Gate is 4 m wide."
    },
    "supplyMode": "recurring",
    "frequency": "monthly",
    "frequencyNote": "",
    "calculatorEstimate": {
      "mode": "herd",
      "animalType": "Dairy cows (lactating)",
      "animals": 240,
      "perAnimalPerDay": 25,
      "days": 180,
      "usablePerBale": 700,
      "wastePercent": 8,
      "reservePercent": 10,
      "totalKg": 1166400,
      "bales": 1667,
      "reserveBales": 167,
      "balesWithReserve": 1834,
      "weeklyKg": 45360,
      "monthlyKg": 194400
    },
    "notes": "Feeding starts mid-October.",
    "marketingConsent": false,
    "source": "quote-wizard"
  }
}
```

Response:

```json
{ "reference": "CF-2026-00184" }
```

---

## Implementation notes

- **Validate server-side.** Everything above comes from a browser.
  Treat `quantity`, dates and every string as untrusted.
- **Deduplicate on `reference`.** A buyer who retries after a network
  error resends the same reference.
- **Store the whole payload.** The requirement fields differ per order
  type; a rigid column-per-field schema will fight you. A JSONB column
  plus a few indexed fields (reference, email, createdAt, orderType)
  works well.
- **`calculatorEstimate` is a plan, not an order.** It records the
  assumptions behind the buyer's number so sales can sanity-check them.
- Sketches for Supabase and similar backends are at the bottom of
  [`lib/quote-service.ts`](../lib/quote-service.ts).

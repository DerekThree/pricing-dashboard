# Pricing Configuration

This context defines the terms used to configure products, pricing plans, fees, and eligibility reasons.

## Language

**Pricing Plan**:
A pricing configuration for one product and one region over an effective period. It may have an empty Pricing Plan Fee collection.
_Avoid_: Plan record, pricing row

**Pricing Plan Fee**:
A fee associated with a Pricing Plan. A fee may belong to many Pricing Plans but only once per individual Pricing Plan; it is eligible only when it supports the Pricing Plan's product and may have waiver reasons.
_Avoid_: Fee row, fee entry

**Fee Amount**:
The configured numeric amount of a Pricing Plan Fee. It may be zero but cannot be negative.
_Avoid_: Price, fee value

**Incomplete Pricing Plan Fee**:
A Pricing Plan Fee missing its fee or a valid Fee Amount. It must be completed before another Pricing Plan Fee is added.
_Avoid_: New fee, partial fee

**Waiver Reason**:
An eligibility reason that permits a Pricing Plan Fee to be waived. It may be associated with multiple Pricing Plan Fees in one Pricing Plan.
_Avoid_: Fee exception, reason row

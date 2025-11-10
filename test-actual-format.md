# Research Document - CDM Platform

This section describes the overall architecture of the CDM platform.

flowchart TD
    A[Trade Capture / Front-Office Systems] -->|send trade| CDM[CDM Hub (Event Store)]
    CDM --> B[Confirmation/Allocation Service]
    B -->|alloc confirmed| CDM
    CDM --> C[Lifecycle Engine (Resets/Novations)]
    C -->|event| CDM
    CDM --> D[Valuation System / Risk]
    D --> E[Collateral/Margin System]
    E -->|calls & reports| CDM
    CDM --> F[Regulatory Reporting]

The above diagram shows how different systems interact with the CDM hub.

flowchart TD
    subgraph Upstream Systems
        A1[Murex / Calypso] -->|Adapter| AD1(Murex→CDM Adapter)
        A2[Trading Front-end] -->|Adapter| AD2
    end
    AD1 --> CDM[CDM Services / Topics]
    AD2 --> CDM
    subgraph Downstream Systems
        CDM --> B1[Risk Engine]
        CDM --> B2[Collateral]
        CDM --> B3[P&L/Finance]
    end

This shows the upstream and downstream system connections.

sequenceDiagram
    participant FO as "Front-Office System"
    participant CDM as "CDM Platform"
    participant Val as "Valuation/Risk"
    participant Coll as "Collateral/Margin"
    participant Reg as "RegReporting"
    FO->>CDM: Submit new trade (CDM format)
    CDM->>Val: New trade event → update positions
    Val-->>CDM: Confirm trade and valuations
    CDM->>FO: Acknowledge book
    Note over CDM:  (later, on fix date)
    FO->>CDM: Submit RateReset event
    CDM->>Val: Recalc exposure
    Val->>Coll: Instruct margin call
    Coll-->>CDM: Collateral value event
    CDM->>Reg: Emit reportable events (EMIR, etc.)
    CDM-->>FO: Confirm reset applied

The sequence diagram above illustrates the trade lifecycle process.

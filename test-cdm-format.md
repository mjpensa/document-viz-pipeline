# CDM Trade Processing Flow

This document demonstrates the Common Data Model (CDM) architecture.

## Trade Processing Architecture

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

## System Components

graph LR
    FO[Front Office] --> CDM[CDM Hub]
    CDM --> MO[Middle Office]
    CDM --> BO[Back Office]
    CDM --> RISK[Risk Systems]

## Event Processing

sequenceDiagram
    participant Trader
    participant FO as Front Office
    participant CDM as CDM Hub
    participant LifeCycle
    
    Trader->>FO: Execute Trade
    FO->>CDM: Store Trade Event
    CDM->>LifeCycle: Process Lifecycle
    LifeCycle->>CDM: Update State

## Summary

This document contains Mermaid diagrams without the "mermaid" keyword or backticks - just the diagram type directly (flowchart, graph, sequenceDiagram).

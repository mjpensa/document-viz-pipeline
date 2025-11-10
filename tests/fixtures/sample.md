# Sample Document with Mermaid Diagrams

This is a test document that contains embedded Mermaid visualization code.

## Project Architecture

Here's a simple flowchart showing our system architecture:

```mermaid
graph TD
    A[User Upload] --> B{File Type?}
    B -->|PDF| C[PDF Parser]
    B -->|DOCX| D[DOCX Parser]
    B -->|Markdown| E[MD Parser]
    C --> F[Code Detector]
    D --> F
    E --> F
    F --> G[Render Visualizations]
    G --> H[Generate PDF]
    H --> I[Download]
```

## User Flow

The following sequence diagram illustrates the user interaction flow:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Renderer
    participant Storage
    
    User->>Frontend: Upload Document
    Frontend->>API: POST /api/upload
    API->>Renderer: Render Visualizations
    Renderer-->>API: Image Buffers
    API->>Storage: Save PDF
    Storage-->>API: File ID
    API-->>Frontend: Download URL
    Frontend-->>User: Auto Download PDF
```

## System States

Here's a state diagram showing document processing states:

```mermaid
stateDiagram-v2
    [*] --> Uploaded
    Uploaded --> Parsing
    Parsing --> Detecting
    Detecting --> Rendering: Code Found
    Detecting --> Error: No Code
    Rendering --> Reconstructing
    Reconstructing --> Generating
    Generating --> Complete
    Complete --> [*]
    Error --> [*]
```

## Conclusion

This document demonstrates the proper use of Mermaid diagrams in Markdown. After processing, all code blocks should be replaced with rendered images.

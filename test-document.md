# Test Document for Visualization Pipeline

This document contains Mermaid diagrams that will be converted to images.

## System Architecture

Here's a flowchart showing the document processing flow:

```mermaid
graph TD
    A[User Uploads Document] --> B{File Type?}
    B -->|PDF| C[Parse PDF]
    B -->|DOCX| D[Parse DOCX]
    B -->|Markdown| E[Parse Markdown]
    C --> F[Detect Code Blocks]
    D --> F
    E --> F
    F --> G[Render Visualizations]
    G --> H[Generate PDF]
    H --> I[Download Ready!]
```

## User Journey

This sequence diagram shows the interaction between components:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Renderer
    participant PDFGen
    
    User->>Frontend: Upload Document
    Frontend->>API: POST /api/upload
    API->>Renderer: Render Mermaid Code
    Renderer-->>API: PNG Images
    API->>PDFGen: Generate PDF
    PDFGen-->>API: PDF Buffer
    API-->>Frontend: Download URL
    Frontend->>User: Auto Download PDF
```

## Application States

Here's a state diagram of the processing workflow:

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Uploading: User selects file
    Uploading --> Parsing: File uploaded
    Parsing --> Detecting: Text extracted
    Detecting --> Rendering: Code found
    Detecting --> Error: No code found
    Rendering --> Reconstructing: Images ready
    Reconstructing --> Generating: Doc rebuilt
    Generating --> Complete: PDF created
    Complete --> [*]
    Error --> [*]
```

## Technology Stack

```mermaid
graph LR
    A[Frontend] -->|AJAX| B[Express API]
    B --> C[Document Parser]
    B --> D[Code Detector]
    B --> E[Visual Renderer]
    E --> F[Puppeteer]
    F --> G[Mermaid.js]
    F --> H[PlantUML]
    B --> I[PDF Generator]
    I --> J[pdf-lib]
```

## Conclusion

After processing, this document will have all the Mermaid code blocks replaced with rendered images, and the output will be a searchable PDF!

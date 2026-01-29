const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class AiStructorPdfGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads/pdfs');
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }

        // Professional page layout constants
        this.PAGE_MARGIN = {
            top: 60,
            bottom: 60,
            left: 60,
            right: 60
        };
        this.CONTENT_PADDING = 20;
        this.HEADER_HEIGHT = 100;

        // Professional color scheme
        this.COLORS = {
            primary: '#1a365d',      // Deep blue
            secondary: '#2c5282',    // Medium blue
            accent: '#4299e1',       // Light blue
            text: '#2d3748',         // Dark gray
            textLight: '#4a5568',    // Medium gray
            background: '#f7fafc',   // Very light gray
            border: '#e2e8f0',       // Light border
            success: '#2f855a',      // Green for answers
            headerBg: '#1a202c'      // Almost black for header
        };

        // AI Global Instructions
        this.AI_GLOBAL_INSTRUCTIONS = `
AI WORK INSTRUCTIONS – WORKING METHODS, LANGUAGE LOGIC, PAGE FLOW

1. Principle
The AI receives a PDF file containing:
- All customer information
- The chosen communication language of the case worker
- The output languages for the texts (one, two, or three languages)
- All template codes (T1–Txx) for all pages

The AI always processes data page by page, never across multiple pages.

2. Communication language (case worker)
The AI communicates exclusively in the language specified in the questionnaire as the internal communication language.

This language is used for:
- Questions
- Notes
- Confirmations ("Yes / No")
- Status messages

3. Output languages (website texts)

3.1 Basic rule
- Texts are only output in the languages defined in the questionnaire
- One, two, or three languages are possible

3.2 Order when using multiple languages (mandatory)
If multiple languages are selected, the order is fixed and defined once (e.g.):
1. English
2. German
3. French

This order applies:
- To all texts
- To all pages
- Without deviation

3.3 Output format for multiple languages (mandatory)
The AI outputs field by field, not page by page per language.

Example (3 languages):
T1 (EN):
English text
T1 (DE):
German text
T1 (FR):
French text
T2 (EN):
…
T2 (DE):
…
T2 (FR):
…

Not allowed:
- Outputting the full page in one language before switching to another language

4. Translation rule (content identity)

4.1 Mandatory rule
All language versions of a text field must be identical in meaning.
No shifts in meaning, metaphors, or focus are allowed.

Forbidden:
- Different statements per language
- Different idioms or metaphors
- Different focus areas

4.2 Special case: No meaningful direct translation
If a literal translation does not exist or is culturally meaningless:
- The AI creates the best possible meaningful translation
- The AI sends a notice to the case worker:

NOTICE:
The translation of Txx was adapted for language [XY]
because no meaningful direct equivalent exists.
Please review and approve or provide an alternative.

The AI does not decide independently; it only flags the issue.

5. Page order (mandatory)
- The AI always starts with the homepage
- The homepage is created:
  - Completely
  - In all output languages
  - For all T-fields

Only after the homepage is finished may the next page be processed.

6. Completion & approval per page
After completing a page, the AI asks (in the communication language):

"The page [page name] is fully created.
Is everything OK?
Please reply with:
- YES → Edit next page
- NO → Report changes"

Rules:
- YES → Start next page
- NO → Only correct the reported points

7. Text length & layout stability
If no text length is specified:
- The AI selects the ideal length
- The primary goal is layout stability:
  - Equal text lengths for adjacent elements
  - No visual imbalance

Guideline:
Short and precise texts are preferred over long, layout-breaking texts.

8. Absolute rules
The AI:
- Fills only specified T-fields
- Never changes template codes
- Never skips fields
- Never adds extra texts

The AI works:
- Page by page
- Structured
- Reproducible

--------------------------------------------------

AI WORK INSTRUCTIONS – INPUT, INTERPRETATION & HINT LOGIC

0. Purpose
Defines how the AI interprets customer data and handles missing or contradictory information.
No layout or design rules are defined here.

1. Inputs
The AI processes only:
- Customer questionnaire data
- Information in any format (bullet points, text, short or long answers)

Rule:
No external data sources are used.

2. Preliminary review (mandatory)
Before text creation, the AI checks for:

2.1 Missing information
If information is missing, display:
NOTICE – INFORMATION MISSING
- Missing information: …

2.2 Contradictory information
If contradictions exist, display:
NOTICE – OBJECTION
- Contradictory information: …

Rules:
- The AI proceeds anyway
- Uses only consistent data
- Does not invent facts

3. Interpretation (limited and controlled)

3.1 Basic rule
Interpretation is allowed only if:
- Based on customer input
- Logically comprehensible
- No new facts are added

Logic:
Customer input → factual derivation → cautious wording

3.2 Permissible interpretations
- Long-term activity → "many years of experience"
- Previous professional exposure → "prior interest / reference"
- Location + industry → typical fields of application (no references claimed)

3.3 Inadmissible
The AI must not:
- Invent achievements or references
- Exaggerate facts
- Make potentially untrue claims

4. Creativity (data-driven only)
Creativity is allowed only in:
- Language
- Style
- Structuring existing information
- Storytelling based on real data

Not allowed:
- Marketing promises
- Superlatives ("leading", "No. 1")
- Guarantees
- Strategic goals not stated by the client

5. Tone & text format

5.1 Tone
If no tone is specified, the AI uses:
- Professional
- Neutral
- Factual

Mandatory notice:
NOTE – TONALITY NOT DEFINED
- Standard tone was used.

5.2 Text format
If not specified, the AI selects an appropriate default and displays:
NOTE – TEXT FORMAT NOT SET
- Default format was used.

6. Prohibited actions (absolute)
The AI must never:
- Invent content
- Provide legal assessments
- State prices or guarantees without data
- Make competitive comparisons
- Make strategic decisions

7. Fallback tone
If no guidance exists:
- Professional
- Factual
- Clear
- B2B suitable
- No emotional or colloquial language

--------------------------------------------------

AI WORK INSTRUCTIONS – HANDLING POOR INPUT & CONTRADICTIONS

0. Purpose
Defines how poor-quality input and contradictions are handled.

1. Poor texts

1.1 Definition
A text is poor if it is:
- Empty or meaningless
- Incoherent
- Emotionally charged without facts
- Professionally unusable

1.2 AI behavior
- No creative "rescue"
- Use only valid facts
- Flag the case

Mandatory notice:
NOTE – QUALITY OF CUSTOMER INPUT
The submitted text is inadequate.
Case worker review is recommended.

Minimal neutral output is still generated.

2. Contradictions

2.1 Definition
Contradictions include:
- Mutually exclusive statements
- Conflicting goals
- Unclear positioning

2.2 AI behavior
- Identify the contradiction
- Inform the case worker
- Propose neutral solution options

2.3 Mandatory notice:
NOTE – CONTRADICTORY INFORMATION
Contradictory content detected: [brief description]

3. AI-proposed solutions
Rules:
- No decisions
- No resolution
- Only objective options

Sources:
- Official statistics
- Public industry data
- Neutral institutions

Format:
Option A: …
Option B: …

Solutions appear only in case-worker notes, not customer texts.

4. Boundaries
The AI may:
- Inform
- Structure
- Suggest options

The AI must not:
- Decide
- Define strategy
- Correct customer intent
- Resolve contradictions unilaterally

5. Summary logic
- Poor text → Flag + minimal output
- Contradiction → Flag + options
- Decisions → Always human
`;
    }

    /**
     * Generate a professional project information PDF
     */
    async generateAiInstructions(project, questions, templateStructure) {
        return new Promise(async (resolve, reject) => {
            try {
                const filename = `instructeur-${project._id}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0,
                    bufferPages: true // Enable page numbering
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // ===== PAGE 1: PROJECT INFORMATION =====
                await this.addProfessionalHeader(doc, 'PROJECT INFORMATION');
                this.addProjectInformation(doc, project);

                // ===== PAGE 2+: QUESTIONS & ANSWERS =====
                doc.addPage();
                await this.addProfessionalHeader(doc, 'PROJECT QUESTIONS');
                this.addQuestionsSection(doc, questions);

                // ===== NEXT PAGES: AI GLOBAL INSTRUCTIONS =====
                doc.addPage();
                await this.addProfessionalHeader(doc, 'AI GLOBAL INSTRUCTIONS');
                this.addAiGlobalInstructions(doc);

                // ===== LAST PAGES: TEMPLATE STRUCTURE =====
                if (templateStructure) {
                    doc.addPage();
                    await this.addProfessionalHeader(doc, 'TEMPLATE INSTRUCTIONS');
                    await this.addTemplateStructure(doc, templateStructure);
                }

                // Add page numbers to all pages (AFTER all content is added)
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    this.addPageNumber(doc, i + 1, pageCount);
                }

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filePath,
                        url: `/uploads/pdfs/${filename}`,
                        documentId: `doc_${Date.now()}`,
                        pages: pageCount,
                        message: 'Professional PDF created successfully!'
                    });
                });

                stream.on('error', (error) => {
                    console.error("❌ Stream error:", error);
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Error generating PDF:', error);
                reject(error);
            }
        });
    }

    /**
     * Add Template Structure content (LAST PAGES)
     * Header only appears on first page, not on continuation pages
     */
    async addTemplateStructure(doc, templateStructure) {
        if (!templateStructure) {
            doc.fontSize(12)
                .fillColor(this.COLORS.textLight)
                .text('No template structure available.', {
                    align: 'center'
                });
            return;
        }

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;
        const maxY = pageHeight - this.PAGE_MARGIN.bottom - 40;

        // Convert template structure to string if it's an object
        const templateText = typeof templateStructure === 'string' 
            ? templateStructure 
            : JSON.stringify(templateStructure, null, 2);

        const lines = templateText.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            // Check if we need a new page
            if (doc.y > maxY) {
                doc.addPage();
                // Don't add header on continuation pages - just reset position
                doc.x = this.PAGE_MARGIN.left;
                doc.y = this.PAGE_MARGIN.top + 20;
            }

            const trimmedLine = line.trim();
            
            // Skip completely empty lines but add spacing
            if (!trimmedLine) {
                doc.moveDown(0.2);
                continue;
            }

            // Detect different line types and format accordingly
            
            // Page/Template headers (e.g., "TEMPLATE 1 (Page 1: HOME)")
            if (trimmedLine.startsWith('TEMPLATE') && trimmedLine.includes('Page')) {
                doc.moveDown(1);
                const headerY = doc.y;
                const headerHeight = 35;
                
                // Background
                doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 5)
                    .fillColor(this.COLORS.primary)
                    .fill();
                
                // Text
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text(trimmedLine, 
                        this.PAGE_MARGIN.left + 15, 
                        headerY + 10, 
                        {
                            width: contentWidth - 30,
                            align: 'left'
                        });
                
                doc.y = headerY + headerHeight;
                doc.moveDown(0.8);
            }
            // Main property keys (e.g., "template:", "fill_policy:", "sections:")
            else if (/^[a-z_]+:$/i.test(trimmedLine) && !trimmedLine.includes(' ')) {
                doc.moveDown(0.5);
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.secondary)
                    .text(trimmedLine, this.PAGE_MARGIN.left + 5, doc.y, {
                        width: contentWidth - 10
                    });
                doc.moveDown(0.3);
            }
            // List items with dash
            else if (trimmedLine.startsWith('-')) {
                const bulletY = doc.y;
                const indent = (line.length - line.trimLeft().length) / 2;
                
                // Bullet point
                doc.circle(this.PAGE_MARGIN.left + 15 + indent, bulletY + 5, 2)
                    .fillColor(this.COLORS.accent)
                    .fill();
                
                // Text
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor(this.COLORS.text)
                    .text(trimmedLine.substring(1).trim(), 
                        this.PAGE_MARGIN.left + 25 + indent, 
                        bulletY, 
                        {
                            width: contentWidth - 30 - indent,
                            lineGap: 1
                        });
                doc.moveDown(0.2);
            }
            // Property with value (e.g., "id: 'T1'", "role: 'Hero Headline'")
            else if (trimmedLine.includes(':') && !trimmedLine.endsWith(':')) {
                const indent = (line.length - line.trimLeft().length) / 2;
                const [key, ...valueParts] = trimmedLine.split(':');
                const value = valueParts.join(':').trim();
                
                doc.fontSize(9)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.text)
                    .text(`${key}:`, 
                        this.PAGE_MARGIN.left + 10 + indent, 
                        doc.y, 
                        { 
                            continued: true,
                            width: contentWidth - 15 - indent
                        })
                    .font('Helvetica')
                    .fillColor(this.COLORS.textLight)
                    .text(` ${value}`);
                
                doc.moveDown(0.15);
            }
            // Regular text or description
            else {
                const indent = (line.length - line.trimLeft().length) / 2;
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor(this.COLORS.text)
                    .text(trimmedLine, 
                        this.PAGE_MARGIN.left + 10 + indent, 
                        doc.y, 
                        {
                            width: contentWidth - 15 - indent,
                            lineGap: 1
                        });
                doc.moveDown(0.15);
            }
        }

        // Footer note
        doc.moveDown(2);
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text('This template structure defines the layout and content fields for the website.',
                this.PAGE_MARGIN.left,
                doc.y,
                {
                    width: contentWidth,
                    align: 'center'
                });
    }

    /**
     * Add AI Global Instructions content (MIDDLE PAGES)
     */
    addAiGlobalInstructions(doc) {
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;
        const maxY = pageHeight - this.PAGE_MARGIN.bottom - 40; // Leave space for page numbers

        // Split the instructions into sections
        const sections = this.AI_GLOBAL_INSTRUCTIONS.trim().split('--------------------------------------------------');

        sections.forEach((section, sectionIndex) => {
            if (!section.trim()) return;

            // Check if we need a new page before starting a new section
            if (doc.y > maxY - 100) {
                doc.addPage();
                doc.x = this.PAGE_MARGIN.left;
                doc.y = this.PAGE_MARGIN.top + 20;
            }

            const lines = section.trim().split('\n');
            
            lines.forEach((line, lineIndex) => {
                // Check if we need a new page
                if (doc.y > maxY) {
                    doc.addPage();
                    doc.x = this.PAGE_MARGIN.left;
                    doc.y = this.PAGE_MARGIN.top + 20;
                }

                const trimmedLine = line.trim();
                
                // Skip empty lines but add small spacing
                if (!trimmedLine) {
                    doc.moveDown(0.3);
                    return;
                }

                // Main section title (starts with "AI WORK INSTRUCTIONS")
                if (trimmedLine.startsWith('AI WORK INSTRUCTIONS')) {
                    doc.moveDown(0.5);
                    doc.fontSize(16)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.primary)
                        .text(trimmedLine, this.PAGE_MARGIN.left, doc.y, {
                            width: contentWidth,
                            align: 'left'
                        });
                    doc.moveDown(1);
                }
                // Major numbered sections (e.g., "1. Principle", "2. Communication language")
                else if (/^\d+\.\s+[A-Z]/.test(trimmedLine)) {
                    doc.moveDown(0.8);
                    
                    // Add subtle background for section headers
                    const headerY = doc.y;
                    const headerHeight = 30;
                    
                    doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 4)
                        .fillColor(this.COLORS.background)
                        .fill();
                    
                    // Left accent bar
                    doc.rect(this.PAGE_MARGIN.left, headerY, 4, headerHeight)
                        .fillColor(this.COLORS.accent)
                        .fill();
                    
                    doc.fontSize(13)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.secondary)
                        .text(trimmedLine, 
                            this.PAGE_MARGIN.left + 15, 
                            headerY + 8, 
                            {
                                width: contentWidth - 20,
                                align: 'left'
                            });
                    
                    doc.y = headerY + headerHeight;
                    doc.moveDown(0.5);
                }
                // Sub-sections (e.g., "3.1 Basic rule", "4.2 Special case")
                else if (/^\d+\.\d+\s+/.test(trimmedLine)) {
                    doc.moveDown(0.6);
                    doc.fontSize(11)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.text)
                        .text(trimmedLine, this.PAGE_MARGIN.left + 10, doc.y, {
                            width: contentWidth - 10,
                            align: 'left',
                            indent: 0
                        });
                    doc.moveDown(0.4);
                }
                // Bullet points or list items
                else if (trimmedLine.startsWith('-')) {
                    const bulletY = doc.y;
                    
                    // Bullet point
                    doc.circle(this.PAGE_MARGIN.left + 15, bulletY + 6, 2.5)
                        .fillColor(this.COLORS.accent)
                        .fill();
                    
                    // Text
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(this.COLORS.text)
                        .text(trimmedLine.substring(1).trim(), 
                            this.PAGE_MARGIN.left + 25, 
                            bulletY, 
                            {
                                width: contentWidth - 30,
                                lineGap: 2
                            });
                    doc.moveDown(0.3);
                }
                // Special sections (e.g., "Rule:", "Logic:", "Example", "Not allowed:", "Forbidden:")
                else if (trimmedLine.endsWith(':')) {
                    doc.moveDown(0.4);
                    doc.fontSize(10)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.secondary)
                        .text(trimmedLine, this.PAGE_MARGIN.left + 10, doc.y, {
                            width: contentWidth - 10,
                            align: 'left'
                        });
                    doc.moveDown(0.3);
                }
                // Regular paragraph text
                else {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(this.COLORS.text)
                        .text(trimmedLine, this.PAGE_MARGIN.left + 10, doc.y, {
                            width: contentWidth - 10,
                            align: 'left',
                            lineGap: 3
                        });
                    doc.moveDown(0.2);
                }
            });

            // Add extra space between major sections
            if (sectionIndex < sections.length - 1) {
                doc.moveDown(1.5);
            }
        });

        // Footer note at bottom of last AI instructions page
        doc.moveDown(2);
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text('These AI instructions are binding and must be followed for all content generation tasks.',
                this.PAGE_MARGIN.left,
                doc.y,
                {
                    width: contentWidth,
                    align: 'center'
                });
    }

    /**
     * Add professional project information section (PAGE 1)
     */
    addProjectInformation(doc, project) {
        if (!project) {
            doc.fontSize(14)
                .fillColor(this.COLORS.text)
                .text('No project information available.');
            return;
        }

        const pageWidth = 595.28;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

        // ===== PROJECT TITLE =====
        doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor(this.COLORS.primary)
            .text(project.title || 'Untitled Project', {
                align: 'left',
                width: contentWidth
            });

        doc.moveDown(0.3);

        // Subtle underline
        doc.moveTo(this.PAGE_MARGIN.left, doc.y)
            .lineTo(this.PAGE_MARGIN.left + 80, doc.y)
            .lineWidth(3)
            .strokeColor(this.COLORS.accent)
            .stroke();

        doc.moveDown(2);

        // ===== DESCRIPTION SECTION =====
        if (project.description) {
            this.addSectionHeader(doc, 'Project Description', contentWidth);
            doc.moveDown(0.8);

            // Description in elegant box
            const descBoxY = doc.y;
            const descHeight = Math.min(
                doc.heightOfString(project.description, {
                    width: contentWidth - 40,
                    align: 'justify'
                }) + 30,
                250
            );

            doc.roundedRect(this.PAGE_MARGIN.left, descBoxY, contentWidth, descHeight, 6)
                .fillColor('#ffffff')
                .fill()
                .strokeColor(this.COLORS.border)
                .lineWidth(1)
                .stroke();

            // Left accent border
            doc.rect(this.PAGE_MARGIN.left, descBoxY, 4, descHeight)
                .fillColor(this.COLORS.accent)
                .fill();

            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(this.COLORS.text)
                .text(project.description,
                    this.PAGE_MARGIN.left + 24,
                    descBoxY + 15,
                    {
                        width: contentWidth - 48,
                        align: 'justify',
                        lineGap: 4
                    });

            doc.y = descBoxY + descHeight + 20;
        }

        doc.moveDown(1.5);

        // ===== PROJECT DETAILS IN VERTICAL LIST =====
        this.addSectionHeader(doc, 'Project Details', contentWidth);
        doc.moveDown(1);

        const projectDetails = [
            { label: 'Client', value: project.client?.name || 'Not specified' },
            { label: 'Category', value: project.category || 'Not specified' },
            { label: 'Priority', value: project.priority || 'Not specified' },
            { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
            { label: 'End Date', value: project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
            { label: 'Budget', value: `${project.budget || 0} ${project.currency || 'MAD'}` },
        ];

        // Vertical list layout (like ul > li)
        projectDetails.forEach((detail, index) => {
            const itemY = doc.y;

            // Bullet point
            doc.circle(this.PAGE_MARGIN.left + 10, itemY + 6, 2.5)
                .fillColor(this.COLORS.accent)
                .fill();

            // Label (bold)
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.text)
                .text(`${detail.label}:`, this.PAGE_MARGIN.left + 25, itemY, {
                    continued: true
                })
                // Value (normal, on same line)
                .font('Helvetica')
                .fillColor(this.COLORS.textLight)
                .text(` ${detail.value}`, {
                    width: contentWidth - 35
                });

            doc.moveDown(0.6);
        });

        // Add footer note for page 1
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text('Continue to next page for project questions and answers →',
                this.PAGE_MARGIN.left,
                780,
                {
                    width: contentWidth,
                    align: 'right'
                });
    }

    /**
     * Add questions section (PAGE 2+)
     */
    addQuestionsSection(doc, questions) {
        const pageWidth = 595.28;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

        if (!questions || questions.length === 0) {
            doc.fontSize(12)
                .fillColor(this.COLORS.textLight)
                .text('No questions have been added to this project yet.', {
                    align: 'center',
                    width: contentWidth
                });
            return;
        }

        // Group questions by section
        const questionsBySection = {};
        questions.forEach((q) => {
            const section = q.section || 'general';
            if (!questionsBySection[section]) {
                questionsBySection[section] = {
                    sectionName: q.sectionName || 'General Information',
                    questions: []
                };
            }
            questionsBySection[section].questions.push(q);
        });

        // Render each section
        Object.keys(questionsBySection).forEach((sectionKey, sectionIndex) => {
            const section = questionsBySection[sectionKey];

            // Check if we need a new page
            this.checkPageBreakQuestions(doc, 100);

            // Section header
            this.addSectionHeader(doc, section.sectionName, contentWidth, true);
            doc.moveDown(0.8);

            // Questions in this section
            section.questions.forEach((question, qIndex) => {
                this.checkPageBreakQuestions(doc, 80);

                // Question card
                const cardY = doc.y;
                const questionHeight = this.calculateQuestionHeight(doc, question, contentWidth);

                // Card background
                doc.roundedRect(this.PAGE_MARGIN.left, cardY, contentWidth, questionHeight, 5)
                    .fillColor('#ffffff')
                    .fill()
                    .strokeColor(this.COLORS.border)
                    .lineWidth(0.5)
                    .stroke();

                // Question number badge
                doc.circle(this.PAGE_MARGIN.left + 20, cardY + 20, 14)
                    .fillColor(this.COLORS.secondary)
                    .fill();

                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text(`${qIndex + 1}`,
                        this.PAGE_MARGIN.left + 15,
                        cardY + 14,
                        { width: 10, align: 'center' });

                // Question text
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.text)
                    .text(question.question,
                        this.PAGE_MARGIN.left + 45,
                        cardY + 14,
                        { width: contentWidth - 60 });

                const answerY = cardY + 38;

                // Handle different answer types
                if (question.type === 'brand-colors' ||
                    (question.answer && question.answer.includes('#'))) {
                    this.displayBrandColorsProfessional(doc, question.answer, answerY, contentWidth);
                } else {
                    // Regular text answer
                    const answerText = question.answer || 'Not answered yet';
                    const answerColor = question.answer ? this.COLORS.success : this.COLORS.textLight;

                    // Answer background
                    doc.roundedRect(
                        this.PAGE_MARGIN.left + 45,
                        answerY - 4,
                        contentWidth - 60,
                        questionHeight - 48,
                        3
                    )
                        .fillColor(this.COLORS.background)
                        .fill();

                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(answerColor)
                        .text(answerText,
                            this.PAGE_MARGIN.left + 55,
                            answerY + 4,
                            {
                                width: contentWidth - 80,
                                lineGap: 2
                            });
                }

                doc.y = cardY + questionHeight + 15;
            });

            doc.moveDown(1);
        });

        // Add generation timestamp
        doc.moveDown(2);
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text(`Document generated on ${new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, {
                align: 'center',
                width: contentWidth
            });
    }

    /**
     * Calculate question card height dynamically
     */
    calculateQuestionHeight(doc, question, contentWidth) {
        const questionHeight = doc.heightOfString(question.question, {
            width: contentWidth - 60,
            font: 'Helvetica-Bold',
            fontSize: 11
        });

        let answerHeight = 30;
        if (question.answer) {
            if (question.type === 'brand-colors' || question.answer.includes('#')) {
                answerHeight = 50; // Fixed height for color swatches
            } else {
                answerHeight = Math.max(30, doc.heightOfString(question.answer, {
                    width: contentWidth - 80,
                    font: 'Helvetica',
                    fontSize: 10
                }) + 16);
            }
        }

        return Math.max(70, questionHeight + answerHeight + 30);
    }

    /**
     * Professional brand colors display
     */
    displayBrandColorsProfessional(doc, colorsString, startY, contentWidth) {
        try {
            const colors = colorsString.split(',').map(color => color.trim()).filter(color => color);

            if (colors.length === 0) {
                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(this.COLORS.textLight)
                    .text('No colors specified',
                        this.PAGE_MARGIN.left + 55,
                        startY + 4);
                return;
            }

            // Background for colors
            doc.roundedRect(
                this.PAGE_MARGIN.left + 45,
                startY - 4,
                contentWidth - 60,
                60,
                3
            )
                .fillColor(this.COLORS.background)
                .fill();

            // Display colors horizontally
            let currentX = this.PAGE_MARGIN.left + 60;
            const swatchSize = 32;
            const spacing = 15;

            colors.forEach((colorHex, index) => {
                if (index > 0 && index % 8 === 0) {
                    // New row if too many colors
                    currentX = this.PAGE_MARGIN.left + 60;
                    startY += swatchSize + 10;
                }

                // Color swatch with shadow effect
                doc.roundedRect(currentX, startY + 2, swatchSize, swatchSize, 4)
                    .fillColor(colorHex)
                    .fill()
                    .strokeColor('#000000')
                    .lineWidth(1)
                    .opacity(0.2)
                    .stroke()
                    .opacity(1);

                // Hex code below swatch
                doc.fontSize(7)
                    .font('Helvetica')
                    .fillColor(this.COLORS.textLight)
                    .text(colorHex,
                        currentX - 5,
                        startY + swatchSize + 6,
                        { width: swatchSize + 10, align: 'center' });

                currentX += swatchSize + spacing;
            });

        } catch (error) {
            console.error('Error displaying brand colors:', error);
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor(this.COLORS.textLight)
                .text(colorsString || 'Not answered yet',
                    this.PAGE_MARGIN.left + 55,
                    startY + 4);
        }
    }

    /**
     * Download image from URL
     */
    downloadImage(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;

            protocol.get(url, (response) => {
                if (response.statusCode !== 200) {
                    console.error(`❌ Failed to download image: ${response.statusCode}`);
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
            }).on('error', (error) => {
                console.error(`❌ Network error downloading logo:`, error);
                reject(error);
            });
        });
    }

    /**
     * Add professional header with logo and title
     */
    async addProfessionalHeader(doc, pageTitle) {
        const pageWidth = 595.28;
        const headerHeight = this.HEADER_HEIGHT;

        // Modern gradient header background
        doc.rect(0, 0, pageWidth, headerHeight)
            .fillColor(this.COLORS.headerBg)
            .fill();

        // Subtle accent line at bottom of header
        doc.rect(0, headerHeight - 3, pageWidth, 3)
            .fillColor(this.COLORS.accent)
            .fill();

        try {
            // Download and add logo on LEFT side
            const logoUrl = 'https://mayabusinessclub.com/wp-content/uploads/2025/11/logo-horizontal-maya-vct.png';
            const logoBuffer = await this.downloadImage(logoUrl);

            const logoWidth = 130;
            const logoHeight = 45;
            const logoX = this.PAGE_MARGIN.left;
            const logoY = (headerHeight - logoHeight - 3) / 2;

            doc.image(logoBuffer, logoX, logoY, {
                width: logoWidth,
                height: logoHeight
            });
        } catch (error) {
            console.warn('⚠️ Could not load logo:', error.message);

            // Placeholder if logo fails
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('Maya Business Club', this.PAGE_MARGIN.left, headerHeight / 2 - 7);
        }

        // Add page title on RIGHT side
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(20)
            .text(pageTitle,
                pageWidth - this.PAGE_MARGIN.right - 220,
                headerHeight / 2 - 13,
                {
                    width: 220,
                    align: 'right'
                });

        // Set starting position for content
        doc.x = this.PAGE_MARGIN.left;
        doc.y = headerHeight + 40;
    }

    /**
     * Add page number footer
     */
    addPageNumber(doc, currentPage, totalPages) {
        const pageHeight = 841.89;
        const pageWidth = 595.28;

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(this.COLORS.textLight)
            .text(
                `Page ${currentPage} of ${totalPages}`,
                this.PAGE_MARGIN.left,
                pageHeight - this.PAGE_MARGIN.bottom + 20,
                {
                    width: pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right,
                    align: 'center'
                }
            );
    }

    /**
     * Add professional section header
     */
    addSectionHeader(doc, title, contentWidth, isSubSection = false) {
        const headerY = doc.y;
        const headerHeight = isSubSection ? 35 : 40;

        // Header background gradient effect
        doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 6)
            .fillColor(isSubSection ? this.COLORS.background : this.COLORS.secondary)
            .fill();

        // Left accent
        doc.rect(this.PAGE_MARGIN.left, headerY, 5, headerHeight)
            .fillColor(this.COLORS.accent)
            .fill();

        // Title
        doc.fontSize(isSubSection ? 13 : 16)
            .font('Helvetica-Bold')
            .fillColor(isSubSection ? this.COLORS.text : '#ffffff')
            .text(title,
                this.PAGE_MARGIN.left + 20,
                headerY + (headerHeight / 2) - 7,
                { width: contentWidth - 40 });

        doc.y = headerY + headerHeight;
    }

    /**
     * Check page break for questions section
     */
    checkPageBreakQuestions(doc, neededHeight = 80) {
        const pageHeight = 841.89;
        const remainingHeight = pageHeight - doc.y - this.PAGE_MARGIN.bottom - 30;

        if (remainingHeight < neededHeight) {
            doc.addPage();
            doc.x = this.PAGE_MARGIN.left;
            doc.y = this.PAGE_MARGIN.top + 20;
            return true;
        }
        return false;
    }
}

module.exports = new AiStructorPdfGenerator();
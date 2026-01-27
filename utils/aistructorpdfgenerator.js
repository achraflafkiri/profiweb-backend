const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class PDFGenerator {
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
    }

    /**
     * Generate a professional project information PDF
     */
    generateAiInstructions(project, questions) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("📄 PDF Generator called with:");
                console.log("   Project ID:", project?._id);
                console.log("   Project Title:", project?.title);
                console.log("   Questions count:", questions?.length || 0);

                const filename = `ai-${Date.now()}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0,
                    bufferPages: true // Enable page numbering
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // ===== PAGE 1: AI INSTRUCTIONS =====
                console.log("📝 Adding AI instructions to page 1...");
                await this.addProfessionalHeader(doc, 'AI INSTRUCTIONS FOR WEBSITE CONTENT (BINDING)');
                this.addAiInstructionsContent(doc);

                // ===== PAGE 2: PROJECT INFORMATION =====
                console.log("📝 Adding project information to page 2...");
                doc.addPage();
                await this.addProfessionalHeader(doc, 'PROJECT INFORMATION');
                this.addProjectInformation(doc, project);

                // ===== PAGE 3: QUESTIONS & ANSWERS =====
                console.log("📝 Adding questions to page 3...");
                doc.addPage();
                await this.addProfessionalHeader(doc, 'PROJECT QUESTIONS');
                this.addQuestionsSection(doc, questions);

                // Add page numbers to all pages
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    this.addPageNumber(doc, i + 1, pageCount);
                }

                doc.end();

                stream.on('finish', () => {
                    console.log("✅ PDF created successfully:", filename);
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
     * Add AI Instructions content (PAGE 1)
     */
    addAiInstructionsContent(doc) {
        const pageWidth = 595.28;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

        // Main title
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor(this.COLORS.primary)
            .text('AI INSTRUCTIONS FOR WEBSITE CONTENT (BINDING)', {
                align: 'center',
                width: contentWidth
            });

        doc.moveDown(2);

        // Section 1: Role of AI
        this.addSectionHeader(doc, '1. Role of AI', contentWidth);
        doc.moveDown(0.8);

        doc.fontSize(11)
            .font('Helvetica')
            .fillColor(this.COLORS.text)
            .text('You are a rules-based content generator for websites. You do not make your own decisions and do not add any content that does not come from the information sheet. You work strictly according to these instructions.', {
                align: 'left',
                width: contentWidth,
                lineGap: 4
            });

        doc.moveDown(2);

        // Divider line
        doc.moveTo(this.PAGE_MARGIN.left, doc.y)
            .lineTo(this.PAGE_MARGIN.left + contentWidth, doc.y)
            .lineWidth(0.5)
            .strokeColor(this.COLORS.border)
            .stroke();

        doc.moveDown(2);

        // Section 2: General rules
        this.addSectionHeader(doc, '2. General rules (mandatory)', contentWidth);
        doc.moveDown(0.8);

        const rules = [
            '1. Use only the information from the information sheet.',
            '2. Make no assumptions, additions, or interpretations.',
            '3. Do not use marketing claims (e.g., "leading", "best", "No. 1").',
            '4. Write objectively, professionally, and clearly.',
            '5. If information is missing or unclear: → STOP and report:\n   **INFORMATION MISSING - please add it.**'
        ];

        rules.forEach(rule => {
            const bulletY = doc.y;
            
            // Bullet point
            doc.circle(this.PAGE_MARGIN.left + 5, bulletY + 6, 3)
                .fillColor(this.COLORS.accent)
                .fill();

            // Rule text
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(this.COLORS.text)
                .text(rule,
                    this.PAGE_MARGIN.left + 20,
                    bulletY,
                    {
                        width: contentWidth - 25,
                        lineGap: 3
                    });

            doc.moveDown(0.6);
        });

        doc.moveDown(2);

        // Divider line
        doc.moveTo(this.PAGE_MARGIN.left, doc.y)
            .lineTo(this.PAGE_MARGIN.left + contentWidth, doc.y)
            .lineWidth(0.5)
            .strokeColor(this.COLORS.border)
            .stroke();

        doc.moveDown(2);

        // Section 3: Working methods
        this.addSectionHeader(doc, '3. Working methods (very important)', contentWidth);
        doc.moveDown(0.8);

        const methods = [
            '- You always work page by page.',
            '- You only ever create one page completely.',
            '- After each page, you wait for approval from the operator.',
            '- You only continue working after receiving positive feedback.'
        ];

        methods.forEach(method => {
            const bulletY = doc.y;
            
            // Dash bullet
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.accent)
                .text('•', this.PAGE_MARGIN.left + 5, bulletY, {
                    width: 10
                });

            // Method text
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(this.COLORS.text)
                .text(method,
                    this.PAGE_MARGIN.left + 20,
                    bulletY,
                    {
                        width: contentWidth - 25,
                        lineGap: 3
                    });

            doc.moveDown(0.5);
        });

        doc.moveDown(3);

        // Footer note
        // doc.fontSize(9)
        //     .font('Helvetica-Oblique')
        //     .fillColor(this.COLORS.textLight)
        //     .text('These instructions are binding and must be followed for all content generation →',
        //         this.PAGE_MARGIN.left,
        //         750,
        //         {
        //             width: contentWidth,
        //             align: 'right'
        //         });
    }

    /**
     * Add professional project information section (PAGE 2)
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

        // Add footer note for page 2
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
     * Add questions section (PAGE 3+)
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

            console.log(`⬇️ Downloading logo from: ${url}`);

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
                    console.log(`✅ Logo downloaded successfully (${buffer.length} bytes)`);
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

            console.log('✅ Logo added to PDF header');
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

module.exports = new PDFGenerator();
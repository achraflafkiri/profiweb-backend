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

        // Page layout constants
        this.PAGE_MARGIN = {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
        };
        this.CONTENT_PADDING = 15;
        this.HEADER_HEIGHT = 120;
    }

    /**
     * Generate a simple story PDF (max 3 pages)
     */
    generateProjectInfo(project, questions) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("📄 PDF Generator called with:");
                console.log("   Project ID:", project?._id);
                console.log("   Project Title:", project?.title);
                console.log("   Questions count:", questions?.length || 0);

                const filename = `document-informations-${Date.now()}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0 // We'll handle margins manually
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                let pageCount = 1;

                // Add header to first page
                await this.addGradientHeader(doc);

                // Set up page margins
                doc.x = this.PAGE_MARGIN.left;
                doc.y = this.HEADER_HEIGHT + this.PAGE_MARGIN.top;

                // Add project information from the parameters
                await this.addProjectInfo(doc, project, questions);

                doc.end();

                stream.on('finish', () => {
                    console.log("✅ PDF created successfully:", filename);
                    resolve({
                        filename,
                        filePath,
                        url: `/uploads/pdfs/${filename}`,
                        documentId: `doc_${Date.now()}`,
                        pages: pageCount,
                        message: 'Story PDF created successfully!'
                    });
                });

                stream.on('error', (error) => {
                    console.error("❌ Stream error:", error);
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Error generating story PDF:', error);
                reject(error);
            }
        });
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
     * Add gradient black header with logo on left and title on right
     */
    async addGradientHeader(doc) {
        const pageWidth = 595.28; // A4 width in points (210mm)
        const headerHeight = this.HEADER_HEIGHT;

        // Draw header background
        doc.rect(0, 0, pageWidth, headerHeight)
            .fillColor('#131313')
            .fill();

        try {
            // Download and add logo on LEFT side
            const logoUrl = 'https://mayabusinessclub.com/wp-content/uploads/2025/11/logo-horizontal-maya-vct.png';
            const logoBuffer = await this.downloadImage(logoUrl);

            // Logo on left (adjust size as needed)
            const logoWidth = 120;
            const logoHeight = 40;
            const logoX = this.PAGE_MARGIN.left;
            const logoY = (headerHeight - logoHeight) / 2; // Center vertically

            doc.image(logoBuffer, logoX, logoY, {
                width: logoWidth,
                height: logoHeight
            });

            console.log('✅ Logo added to PDF header');
        } catch (error) {
            console.warn('⚠️ Could not load logo, using placeholder:', error.message);

            // Placeholder if logo fails
            const logoX = this.PAGE_MARGIN.left;
            const logoY = headerHeight / 2 - 10;

            doc.fillColor('#ffffff')
                .fontSize(12)
                .text('Maya Business Club', logoX, logoY);
        }

        // Add "Document Information" title on RIGHT side
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Document Information',
                pageWidth - this.PAGE_MARGIN.right - 200, // Adjusted position
                headerHeight / 2 - 10,
                {
                    width: 200,
                    align: 'right'
                });

        // Add a subtle separator line below header
        doc.moveTo(0, headerHeight)
            .lineTo(pageWidth, headerHeight)
            .lineWidth(1)
            .strokeColor('#444444')
            .stroke();
    }

    /**
     * Check if we need to add a new page
     */
    checkPageBreak(doc, neededHeight = 50) {
        const pageHeight = 841.89; // A4 height in points
        const remainingHeight = pageHeight - doc.y - this.PAGE_MARGIN.bottom;

        if (remainingHeight < neededHeight) {
            doc.addPage();

            // Draw header on new page
            this.addSimpleHeader(doc);

            // Reset position with margins
            doc.x = this.PAGE_MARGIN.left;
            doc.y = this.PAGE_MARGIN.top;

            // Add spacing after page break
            return this.CONTENT_PADDING;
        }
        return 0;
    }

    /**
     * Simple header for subsequent pages
     */
    addSimpleHeader(doc) {
        const pageWidth = 595.28;
        const headerHeight = 40;

        // Simple header background
        doc.rect(0, 0, pageWidth, headerHeight)
            .fillColor('#f5f5f5')
            .fill();

        // Header text
        doc.fillColor('#333333')
            .fontSize(10)
            .font('Helvetica')
            .text('Maya Business Club - Document Information',
                this.PAGE_MARGIN.left,
                headerHeight / 2 - 5,
                { width: pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right }
            );

        // Separator line
        doc.moveTo(0, headerHeight)
            .lineTo(pageWidth, headerHeight)
            .lineWidth(0.5)
            .strokeColor('#cccccc')
            .stroke();
    }

    /**
     * Add project information content with proper spacing
     */
    async addProjectInfo(doc, project, questions) {
        console.log("📝 Adding project information to PDF...");

        if (!project) {
            doc.fontSize(14).text('No project information available.');
            return;
        }

        // ===== PROJECT TITLE SECTION =====
        doc.fillColor('#000000');
        this.checkPageBreak(doc, 100);

        doc.fontSize(24)
            .font('Helvetica-Bold')
            .text(project.title || 'Untitled Project', {
                align: 'center',
                width: 595.28 - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right
            });

        doc.moveDown(1.5);

        // ===== PROJECT DETAILS SECTION =====
        this.checkPageBreak(doc, 150);

        // Section header with background
        const sectionWidth = 595.28 - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

        doc.rect(this.PAGE_MARGIN.left, doc.y, sectionWidth, 20)
            .fillColor('#f0f0f0')
            .fill();

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#333333')
            .text('Project Details:', this.PAGE_MARGIN.left + this.CONTENT_PADDING, doc.y + 4);

        doc.y += 30; // Move down after section header
        doc.moveDown(0.5);

        // Basic project info with spacing
        const projectDetails = [
            { label: 'Client', value: project.client?.name || 'Not specified' },
            { label: 'Category', value: project.category || 'Not specified' },
            { label: 'Priority', value: project.priority || 'Not specified' },
            { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified' },
            { label: 'End Date', value: project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not specified' },
            { label: 'Budget', value: `${project.budget || 0} ${project.currency || 'MAD'}` },
        ];

        // NEW: Render project details as simple label + value blocks (label bold, value below)
        projectDetails.forEach((detail) => {
            // Ensure there's space for the label + value, otherwise add a new page
            this.checkPageBreak(doc, 50);

            // Label (bold)
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#444444')
                .text(`${detail.label}:`, this.PAGE_MARGIN.left + this.CONTENT_PADDING, doc.y, {
                    width: sectionWidth - this.CONTENT_PADDING * 2
                });

            doc.moveDown(0.15);

            // Value (normal)
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor('#000000')
                .text(detail.value, {
                    indent: this.CONTENT_PADDING,
                    width: sectionWidth - this.CONTENT_PADDING * 2,
                    align: 'left'
                });

            doc.moveDown(0.8);
        });

        doc.moveDown(1);

        // ===== DESCRIPTION SECTION =====
        if (project.description) {
            this.checkPageBreak(doc, 100);

            // Section header
            doc.rect(this.PAGE_MARGIN.left, doc.y, sectionWidth, 20)
                .fillColor('#f0f0f0')
                .fill();

            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#333333')
                .text('Description:', this.PAGE_MARGIN.left + this.CONTENT_PADDING, doc.y + 4);

            doc.y += 30;
            doc.moveDown(0.5);

            // Description content with padding
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#000000')
                .text(project.description, {
                    align: 'left',
                    width: sectionWidth,
                    indent: this.CONTENT_PADDING
                })
                .moveDown(1.5);
        }

        // ===== QUESTIONS SECTION =====
        if (questions && questions.length > 0) {
            this.checkPageBreak(doc, 100);

            // Questions section header
            doc.rect(this.PAGE_MARGIN.left, doc.y, sectionWidth, 20)
                .fillColor('#e8f4f8')
                .fill();

            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#2c5282')
                .text('Project Questions & Answers:', this.PAGE_MARGIN.left + this.CONTENT_PADDING, doc.y + 4);

            doc.y += 30;
            doc.moveDown(0.5);

            // Group questions by section
            const questionsBySection = {};
            questions.forEach((q, index) => {
                const section = q.section || 'general';
                if (!questionsBySection[section]) {
                    questionsBySection[section] = {
                        sectionName: q.sectionName || 'General Information',
                        questions: []
                    };
                }
                questionsBySection[section].questions.push(q);
            });

            // Add each section
            Object.keys(questionsBySection).forEach((sectionKey, sectionIndex) => {
                const section = questionsBySection[sectionKey];

                this.checkPageBreak(doc, 80);

                // Section header with different color
                doc.rect(this.PAGE_MARGIN.left, doc.y, sectionWidth, 18)
                    .fillColor('#f8f8f8')
                    .fill();

                doc.fontSize(13)
                    .font('Helvetica-Bold')
                    .fillColor('#555555')
                    .text(`${sectionIndex + 1}. ${section.sectionName}`,
                        this.PAGE_MARGIN.left + this.CONTENT_PADDING,
                        doc.y + 2);

                doc.y += 25;
                doc.moveDown(0.3);

                // Questions in this section
                section.questions.forEach((question, qIndex) => {
                    this.checkPageBreak(doc, question.type === 'brand-colors' ? 70 : 50);

                    // Question with background
                    doc.rect(this.PAGE_MARGIN.left + 5, doc.y - 2, sectionWidth - 10, 18)
                        .fillColor('#f9f9f9')
                        .fill();

                    doc.fontSize(11)
                        .font('Helvetica-Bold')
                        .fillColor('#222222')
                        .text(`Q${qIndex + 1}: ${question.question}`,
                            this.PAGE_MARGIN.left + this.CONTENT_PADDING,
                            doc.y);

                    doc.y += 22;

                    // SPECIAL HANDLING FOR BRAND COLORS
                    if (question.type === 'brand-colors' || question.question.toLowerCase().includes('color') || question.question.toLowerCase().includes('brand')) {
                        this.displayBrandColors(doc, question.answer, sectionWidth);
                    } else {
                        // Regular answer with indentation
                        const answerText = question.answer || 'Not answered yet';
                        const answerColor = question.answer ? '#006600' : '#999999';

                        doc.rect(this.PAGE_MARGIN.left + 20, doc.y - 2, sectionWidth - 25, 16)
                            .fillColor('#ffffff')
                            .strokeColor('#eeeeee')
                            .lineWidth(0.5)
                            .fillAndStroke();

                        doc.fontSize(10)
                            .font('Helvetica')
                            .fillColor(answerColor)
                            .text(`A: ${answerText}`,
                                this.PAGE_MARGIN.left + 25,
                                doc.y);

                        doc.y += 25;
                    }

                    doc.moveDown(0.3);
                });

                // Add spacing between sections
                this.checkPageBreak(doc, 20);
                doc.moveDown(0.5);
            });
        }

        // ===== FOOTER =====
        this.checkPageBreak(doc, 60);

        doc.moveDown(2);

        // Footer separator
        doc.moveTo(this.PAGE_MARGIN.left, doc.y)
            .lineTo(595.28 - this.PAGE_MARGIN.right, doc.y)
            .lineWidth(0.5)
            .strokeColor('#cccccc')
            .stroke();

        doc.moveDown(0.5);

        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor('#666666')
            .text(`Generated on: ${new Date().toLocaleString()}`, {
                align: 'center',
                width: sectionWidth
            });
    }

    /**
     * Display brand colors with visual color swatches
     */
    displayBrandColors(doc, colorsString, sectionWidth) {
        try {
            // Parse colors from string (comma separated)
            const colors = colorsString.split(',').map(color => color.trim()).filter(color => color);

            if (colors.length === 0) {
                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor('#999999')
                    .text(`A: No colors specified`,
                        this.PAGE_MARGIN.left + 25,
                        doc.y);
                doc.y += 25;
                return;
            }

            // Answer label
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#006600')
                .text(`A:`,
                    this.PAGE_MARGIN.left + 25,
                    doc.y);

            // Starting position for colors
            let currentX = this.PAGE_MARGIN.left + 45;
            const startY = doc.y;
            const colorBoxSize = 20;
            const colorSpacing = 10;

            // Display each color with swatch
            colors.forEach((colorHex, index) => {
                // Check if we need to move to next line
                if (currentX + colorBoxSize + 100 > sectionWidth + this.PAGE_MARGIN.left) {
                    doc.y += colorBoxSize + 15;
                    currentX = this.PAGE_MARGIN.left + 45;
                }

                // Draw color swatch
                doc.rect(currentX, startY, colorBoxSize, colorBoxSize)
                    .fillColor(colorHex)
                    .fill()
                    .strokeColor('#cccccc')
                    .lineWidth(0.5)
                    .stroke();

                // Add hex code next to swatch
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor('#000000')
                    .text(colorHex, currentX + colorBoxSize + 5, startY + 5);

                currentX += colorBoxSize + 85; // Width of swatch + text + spacing
            });

            // Move cursor down for next content
            doc.y = startY + colorBoxSize + 15;

        } catch (error) {
            console.error('Error displaying brand colors:', error);
            // Fallback to regular text display
            const answerColor = colorsString ? '#006600' : '#999999';
            const answerText = colorsString || 'Not answered yet';

            doc.rect(this.PAGE_MARGIN.left + 20, doc.y - 2, sectionWidth - 25, 16)
                .fillColor('#ffffff')
                .strokeColor('#eeeeee')
                .lineWidth(0.5)
                .fillAndStroke();

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor(answerColor)
                .text(`A: ${answerText}`,
                    this.PAGE_MARGIN.left + 25,
                    doc.y);

            doc.y += 25;
        }
    }
}

module.exports = new PDFGenerator();
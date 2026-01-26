// utils/aistructorpdfgenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class AIStructorPDFGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads/pdfs');

        // Create directory if it doesn't exist
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            console.log(`Created directory: ${this.uploadsDir}`);
        }

        // Brand colors for AI Structor
        this.brandColors = {
            primary: '#4f46e5',      // Indigo
            secondary: '#7c3aed',    // Violet
            accent: '#06b6d4',       // Cyan
            text: '#1f2937',
            lightGray: '#f3f4f6'
        };
    }

    /**
     * Add AI Structor header with text-based logo
     */
    async addHeader(doc, title) {
        try {
            // Save current state
            doc.save();

            // Header background with gradient effect
            const gradient = doc.linearGradient(0, 0, doc.page.width, 0)
                .stop(0, this.brandColors.primary)
                .stop(1, this.brandColors.secondary);

            doc.rect(0, 0, doc.page.width, 100).fill(gradient);

            // Reset fill color and opacity
            doc.fillColor('#ffffff').opacity(1);

            // Add text logo on the left
            const logoX = 40;
            const logoY = 15;

            doc.fontSize(24)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text('AI STRUCTOR', logoX, logoY + 20, {
                    width: 300,
                    align: 'left'
                });

            doc.fontSize(12)
                .fillColor('#ffffff')
                .font('Helvetica')
                .text('Advanced AI Project Structuring', logoX, logoY + 45, {
                    width: 300,
                    align: 'left'
                });

            // Add document title on the right
            const titleX = doc.page.width - 250;
            const titleY = 35;

            doc.fontSize(20)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(title, titleX, titleY, {
                    width: 200,
                    align: 'right'
                });

            // Add "AI-Powered Analysis" subtitle on right
            doc.fontSize(12)
                .fillColor('#ffffff')
                .font('Helvetica-Oblique')
                .text('AI-Powered Analysis', titleX, titleY + 25, {
                    width: 200,
                    align: 'right'
                });

            // Add decorative accent line
            doc.save();
            doc.strokeColor(this.brandColors.accent)
                .opacity(0.8)
                .lineWidth(2)
                .moveTo(50, 95)
                .lineTo(doc.page.width - 50, 95)
                .stroke();
            doc.restore();

            // Add AI icon/emoji
            doc.fontSize(16)
                .fillColor('#ffffff')
                .text('', doc.page.width - 60, 22, {
                    width: 30,
                    align: 'left'
                });

            // Restore state and set position for content
            doc.restore();
            doc.fillColor(this.brandColors.text).opacity(1);
            doc.x = 50; // Reset x position
            doc.y = 125; // Set y position below header

        } catch (error) {
            console.error('Error in AI Structor addHeader:', error);
            // Fallback header
            doc.rect(0, 0, doc.page.width, 90)
                .fill(this.brandColors.primary);

            doc.fontSize(26)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text('🤖 AI STRUCTOR', 50, 25, {
                    width: 300,
                    align: 'left'
                });

            doc.fontSize(18)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(title, doc.page.width - 250, 30, {
                    width: 200,
                    align: 'right'
                });

            doc.fillColor(this.brandColors.text).opacity(1);
            doc.x = 50;
            doc.y = 110;
        }
    }

    /**
     * Add professional footer for AI Structor
     */
    addFooter(doc, pageText) {
        try {
            const bottomY = doc.page.height - 50;

            doc.save();

            // Top line
            doc.strokeColor(this.brandColors.lightGray)
                .lineWidth(0.5)
                .moveTo(50, bottomY - 25)
                .lineTo(doc.page.width - 50, bottomY - 25)
                .stroke();

            // AI Structor tagline (left)
            doc.fontSize(9)
                .fillColor(this.brandColors.primary)
                .font('Helvetica-Bold')
                .text('AI-Powered Project Analysis', 50, bottomY - 20, {
                    width: 180,
                    align: 'left'
                });

            // Page info (center left)
            doc.fontSize(9)
                .fillColor('#6b7280')
                .font('Helvetica')
                .text(pageText, 250, bottomY - 20, {
                    width: 200,
                    align: 'left'
                });

            // Page number (center)
            const pageNumber = `Page ${doc.bufferedPageRange().start + 1}`;
            const centerX = doc.page.width / 2;
            doc.text(pageNumber, centerX - 50, bottomY - 20, {
                width: 100,
                align: 'center'
            });

            // Confidential notice (right)
            doc.fontSize(9)
                .fillColor('#ef4444')
                .font('Helvetica-Bold')
                .text('CONFIDENTIAL - AI GENERATED', doc.page.width - 220, bottomY - 20, {
                    width: 170,
                    align: 'right'
                });

            // Bottom line
            doc.strokeColor(this.brandColors.accent)
                .lineWidth(0.5)
                .opacity(0.5)
                .moveTo(50, bottomY - 5)
                .lineTo(doc.page.width - 50, bottomY - 5)
                .stroke();

            doc.restore();

        } catch (error) {
            console.error('Error in AI Structor addFooter:', error);
        }
    }

    /**
     * Generate AI Structor Analysis Report
     */
    generateAIAnalysisReport(projectData, aiAnalysis) {
        return new Promise(async (resolve, reject) => {
            try {
                const docId = uuidv4();
                const filename = `ai-analysis-report-${Date.now()}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    bufferPages: true,
                    info: {
                        Title: 'AI Structor Analysis Report',
                        Author: 'AI Structor System',
                        Subject: 'AI-Powered Project Analysis',
                        Keywords: 'AI, Analysis, Project, Structuring',
                        Creator: 'AI Structor v1.0',
                        CreationDate: new Date()
                    }
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Header with AI Structor branding
                await this.addHeader(doc, 'AI Analysis Report');
                doc.moveDown(1);

                // Executive Summary Section
                doc.fontSize(18)
                    .fillColor(this.brandColors.primary)
                    .font('Helvetica-Bold')
                    .text('EXECUTIVE SUMMARY', 50, doc.y, {
                        underline: true,
                        width: doc.page.width - 100
                    });
                doc.moveDown(0.5);

                doc.fontSize(11)
                    .fillColor(this.brandColors.text)
                    .font('Helvetica');

                if (aiAnalysis?.executiveSummary) {
                    doc.text(aiAnalysis.executiveSummary, 50, doc.y, {
                        align: 'justify',
                        width: doc.page.width - 100
                    });
                } else {
                    doc.text('No executive summary available from AI analysis.', 50, doc.y, {
                        width: doc.page.width - 100
                    });
                }

                doc.moveDown(2);

                // Project Overview Section
                doc.fontSize(16)
                    .fillColor(this.brandColors.primary)
                    .font('Helvetica-Bold')
                    .text('PROJECT OVERVIEW', 50, doc.y, {
                        underline: true,
                        width: doc.page.width - 100
                    });
                doc.moveDown(0.5);

                const overviewData = [
                    ['Project Title', projectData.title || 'N/A'],
                    ['Project ID', projectData.id || docId.substring(0, 8)],
                    ['AI Analysis Date', new Date().toLocaleDateString()],
                    ['Analysis Confidence', aiAnalysis?.confidence ? `${aiAnalysis.confidence}%` : 'N/A'],
                    ['Complexity Level', aiAnalysis?.complexity || 'N/A']
                ];

                overviewData.forEach(([label, value]) => {
                    doc.font('Helvetica-Bold')
                        .fillColor(this.brandColors.text)
                        .text(`${label}: `, 50, doc.y, {
                            continued: true,
                            width: doc.page.width - 100
                        })
                        .font('Helvetica')
                        .fillColor(this.brandColors.secondary)
                        .text(value);
                    doc.moveDown(0.3);
                });

                doc.moveDown(2);

                // AI Recommendations Section
                if (aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0) {
                    doc.fontSize(16)
                        .fillColor(this.brandColors.primary)
                        .font('Helvetica-Bold')
                        .text('AI RECOMMENDATIONS', 50, doc.y, {
                            underline: true,
                            width: doc.page.width - 100
                        });
                    doc.moveDown(0.5);

                    aiAnalysis.recommendations.forEach((rec, index) => {
                        // Check if we need a new page
                        if (doc.y > doc.page.height - 150) {
                            doc.addPage();
                            doc.x = 50;
                            doc.y = 50;
                        }

                        // Recommendation card style
                        const cardY = doc.y;
                        doc.save();
                        doc.rect(50, cardY, doc.page.width - 100, 60)
                            .fillOpacity(0.1)
                            .fill(this.brandColors.lightGray);
                        doc.restore();

                        doc.fontSize(12)
                            .fillColor(this.brandColors.primary)
                            .font('Helvetica-Bold')
                            .text(`${index + 1}. ${rec.title || 'Recommendation'}`, 60, cardY + 10, {
                                width: doc.page.width - 120
                            });

                        doc.fontSize(10)
                            .fillColor(this.brandColors.text)
                            .font('Helvetica')
                            .text(rec.description || 'No description', 60, cardY + 30, {
                                width: doc.page.width - 120
                            });

                        doc.y = cardY + 70;
                        doc.moveDown(0.5);
                    });
                }

                doc.moveDown(2);

                // Risk Assessment Section
                if (aiAnalysis?.risks && aiAnalysis.risks.length > 0) {
                    // Check if we need a new page
                    if (doc.y > doc.page.height - 150) {
                        doc.addPage();
                        doc.x = 50;
                        doc.y = 50;
                    }

                    doc.fontSize(16)
                        .fillColor(this.brandColors.primary)
                        .font('Helvetica-Bold')
                        .text('RISK ASSESSMENT', 50, doc.y, {
                            underline: true,
                            width: doc.page.width - 100
                        });
                    doc.moveDown(0.5);

                    aiAnalysis.risks.forEach((risk, index) => {
                        const riskColor = risk.severity === 'High' ? '#ef4444' :
                            risk.severity === 'Medium' ? '#f59e0b' : '#10b981';

                        doc.fontSize(11)
                            .fillColor(riskColor)
                            .font('Helvetica-Bold')
                            .text(`• ${risk.description} [${risk.severity} Risk]`, 50, doc.y, {
                                width: doc.page.width - 100
                            });

                        if (risk.mitigation) {
                            doc.fontSize(10)
                                .fillColor(this.brandColors.text)
                                .font('Helvetica')
                                .text(`   Mitigation: ${risk.mitigation}`, 70, doc.y, {
                                    width: doc.page.width - 120
                                });
                        }
                        doc.moveDown(0.5);
                    });
                }

                doc.moveDown(2);

                // Technical Requirements Section
                if (aiAnalysis?.technicalRequirements) {
                    // Check if we need a new page
                    if (doc.y > doc.page.height - 150) {
                        doc.addPage();
                        doc.x = 50;
                        doc.y = 50;
                    }

                    doc.fontSize(16)
                        .fillColor(this.brandColors.primary)
                        .font('Helvetica-Bold')
                        .text('TECHNICAL REQUIREMENTS', 50, doc.y, {
                            underline: true,
                            width: doc.page.width - 100
                        });
                    doc.moveDown(0.5);

                    doc.fontSize(11)
                        .fillColor(this.brandColors.text)
                        .font('Helvetica')
                        .text(aiAnalysis.technicalRequirements, 50, doc.y, {
                            align: 'justify',
                            width: doc.page.width - 100
                        });
                }

                // Add footer to all pages
                const range = doc.bufferedPageRange();
                for (let i = 0; i < range.count; i++) {
                    doc.switchToPage(i);
                    this.addFooter(doc, `AI Analysis for: ${projectData.title || 'Project'}`);
                }

                doc.end();

                stream.on('finish', () => {
                    console.log(`AI Structor Analysis PDF generated: ${filename}`);
                    resolve({
                        filename,
                        filePath,
                        url: `/uploads/pdfs/${filename}`,
                        documentId: docId,
                        type: 'ai-analysis',
                        analysisId: aiAnalysis?.id || docId,
                        generatedAt: new Date().toISOString()
                    });
                });

                stream.on('error', reject);

            } catch (error) {
                console.error('Error generating AI Structor Analysis PDF:', error);
                reject(error);
            }
        });
    }

    /**
 * Generate Detailed AI Structor Report with multiple pages
 */
    generateDetailedAIReport(projectData, fullAnalysis) {
        return new Promise(async (resolve, reject) => {
            try {
                const docId = uuidv4();
                const filename = `detailed-ai-report-${Date.now()}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    bufferPages: true,
                    info: {
                        Title: 'Detailed AI Structor Report',
                        Author: 'AI Structor Advanced Analysis',
                        Subject: 'Comprehensive AI Project Analysis',
                        Keywords: 'AI, Detailed, Analysis, Report, Project',
                        Creator: 'AI Structor Pro v2.0'
                    }
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // ========== COVER PAGE ==========
                await this.addHeader(doc, 'DETAILED AI REPORT');
                doc.moveDown(4);

                // Title
                doc.fontSize(28)
                    .fillColor(this.brandColors.primary)
                    .font('Helvetica-Bold')
                    .text('AI STRUCTOR', 50, doc.y, {
                        align: 'center',
                        width: doc.page.width - 100
                    });

                doc.fontSize(22)
                    .fillColor(this.brandColors.secondary)
                    .font('Helvetica-Bold')
                    .text('Advanced Project Analysis', 50, doc.y, {
                        align: 'center',
                        width: doc.page.width - 100
                    });

                doc.moveDown(3);

                // Project Info box
                const boxWidth = 400;
                const boxHeight = 200;
                const boxX = (doc.page.width - boxWidth) / 2;
                const boxY = doc.y;

                doc.save();
                doc.rect(boxX, boxY, boxWidth, boxHeight)
                    .fillOpacity(0.2)
                    .fill(this.brandColors.lightGray);

                doc.strokeColor(this.brandColors.primary)
                    .lineWidth(1)
                    .rect(boxX, boxY, boxWidth, boxHeight)
                    .stroke();
                doc.restore();

                doc.fontSize(20)
                    .fillColor(this.brandColors.primary)
                    .font('Helvetica-Bold')
                    .text(projectData.title || 'Project Analysis', boxX + 20, boxY + 30, {
                        width: boxWidth - 40,
                        align: 'center'
                    });

                doc.fontSize(14)
                    .fillColor(this.brandColors.text)
                    .font('Helvetica')
                    .text(`Generated: ${new Date().toLocaleString()}`, boxX + 20, boxY + 80, {
                        width: boxWidth - 40,
                        align: 'center'
                    });

                doc.fontSize(12)
                    .fillColor(this.brandColors.secondary)
                    .font('Helvetica-Oblique')
                    .text('Powered by Advanced AI Analysis', boxX + 20, boxY + 120, {
                        width: boxWidth - 40,
                        align: 'center'
                    });

                // ========== CONTENT PAGES ==========
                // Add a new page for actual content
                doc.addPage();

                // Add header to the new page
                await this.addHeader(doc, 'DETAILED ANALYSIS');

                // Table of Contents
                doc.fontSize(18)
                    .fillColor(this.brandColors.primary)
                    .font('Helvetica-Bold')
                    .text('TABLE OF CONTENTS', 50, doc.y, {
                        underline: true,
                        width: doc.page.width - 100
                    });

                doc.moveDown(1);

                const sections = [
                    '1. Executive Summary',
                    '2. Project Analysis',
                    '3. Technical Specifications',
                    '4. Architecture Overview',
                    '5. Implementation Plan',
                    '6. Risk Assessment',
                    '7. Resource Allocation',
                    '8. Timeline & Milestones',
                    '9. Success Metrics',
                    '10. Conclusion'
                ];

                sections.forEach(section => {
                    doc.fontSize(11)
                        .fillColor(this.brandColors.text)
                        .font('Helvetica')
                        .text(section, 60, doc.y, {
                            width: doc.page.width - 120
                        });
                    doc.moveDown(0.8);
                });

                // Add more content sections based on fullAnalysis
                if (fullAnalysis) {
                    // Check if we need a new page
                    if (doc.y > doc.page.height - 150) {
                        doc.addPage();
                        doc.x = 50;
                        doc.y = 50;
                    }

                    // Add more pages with actual analysis content
                    if (fullAnalysis.executiveSummary) {
                        doc.addPage();
                        await this.addHeader(doc, 'EXECUTIVE SUMMARY');

                        doc.fontSize(12)
                            .fillColor(this.brandColors.text)
                            .font('Helvetica')
                            .text(fullAnalysis.executiveSummary, 50, doc.y, {
                                align: 'justify',
                                width: doc.page.width - 100
                            });
                    }

                    // Add technical specifications if available
                    if (fullAnalysis.technicalSpecs) {
                        doc.addPage();
                        await this.addHeader(doc, 'TECHNICAL SPECIFICATIONS');

                        if (Array.isArray(fullAnalysis.technicalSpecs)) {
                            fullAnalysis.technicalSpecs.forEach((spec, index) => {
                                doc.fontSize(11)
                                    .fillColor(this.brandColors.primary)
                                    .font('Helvetica-Bold')
                                    .text(`${index + 1}. ${spec.title || 'Specification'}`, 50, doc.y, {
                                        width: doc.page.width - 100
                                    });

                                doc.fontSize(10)
                                    .fillColor(this.brandColors.text)
                                    .font('Helvetica')
                                    .text(spec.description || 'No description', 70, doc.y, {
                                        width: doc.page.width - 120
                                    });

                                doc.moveDown(1);
                            });
                        }
                    }

                    // Add implementation plan if available
                    if (fullAnalysis.implementationPlan) {
                        doc.addPage();
                        await this.addHeader(doc, 'IMPLEMENTATION PLAN');

                        doc.fontSize(12)
                            .fillColor(this.brandColors.text)
                            .font('Helvetica')
                            .text(fullAnalysis.implementationPlan, 50, doc.y, {
                                align: 'justify',
                                width: doc.page.width - 100
                            });
                    }
                } else {
                    // If no fullAnalysis provided, add placeholder content
                    doc.addPage();
                    await this.addHeader(doc, 'ANALYSIS CONTENT');

                    doc.fontSize(14)
                        .fillColor(this.brandColors.text)
                        .font('Helvetica')
                        .text('Detailed analysis content would appear here...', 50, doc.y, {
                            width: doc.page.width - 100
                        });

                    doc.moveDown(2);

                    doc.fontSize(12)
                        .fillColor(this.brandColors.secondary)
                        .font('Helvetica-Oblique')
                        .text('This is a template for detailed AI analysis reports.', 50, doc.y, {
                            width: doc.page.width - 100
                        });
                }

                // ========== FINALIZE ==========
                // Add footer to all pages
                const range = doc.bufferedPageRange();
                for (let i = 0; i < range.count; i++) {
                    doc.switchToPage(i);
                    this.addFooter(doc, `Detailed Report - Page ${i + 1} of ${range.count}`);
                }

                doc.end();

                stream.on('finish', () => {
                    console.log(`✅ Detailed AI Report generated: ${filename} (${range.count} pages)`);
                    resolve({
                        filename,
                        filePath,
                        url: `/uploads/pdfs/${filename}`,
                        documentId: docId,
                        type: 'detailed-ai-report',
                        pageCount: range.count,
                        generatedAt: new Date().toISOString()
                    });
                });

                stream.on('error', reject);

            } catch (error) {
                console.error('Error generating Detailed AI Report:', error);
                reject(error);
            }
        });
    }

    /**
     * Delete PDF files
     */
    async deletePDFs(fileUrls) {
        try {
            if (!Array.isArray(fileUrls)) {
                fileUrls = [fileUrls];
            }

            const results = await Promise.allSettled(
                fileUrls.map(url => {
                    if (!url) return Promise.resolve(false);

                    const filename = url.split('/').pop();
                    const filePath = path.join(this.uploadsDir, filename);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted AI Structor PDF: ${filename}`);
                        return true;
                    }
                    return false;
                })
            );

            return {
                deleted: results.filter(r => r.value).length,
                failed: results.filter(r => !r.value).length,
                total: results.length
            };
        } catch (error) {
            console.error('Error deleting AI Structor PDFs:', error);
            return { deleted: 0, failed: 1, total: 1 };
        }
    }
}

module.exports = new AIStructorPDFGenerator();
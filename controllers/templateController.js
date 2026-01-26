// controllers/templateController.js
const Template = require("../models/template.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Create a new template
const createTemplate = catchAsync(async (req, res, next) => {
    const { title, shortDesc, structure, colors } = req.body;

    // 1. Check if required fields are provided
    if (!title || !shortDesc || !structure) {
        return next(new AppError('Title, short description, and CSS structure are required', 400));
    }

    // 2. Check if template with same title already exists
    const existingTemplate = await Template.findOne({ title });
    if (existingTemplate) {
        return next(new AppError('A template with this title already exists', 400));
    }

    // 3. Validate colors array
    if (colors && !Array.isArray(colors)) {
        return next(new AppError('Colors must be an array', 400));
    }

    // 4. Create new template
    const newTemplate = await Template.create({
        title,
        shortDesc,
        structure,
        colors: colors || [],
        createdBy: req.user.id
    });

    res.status(201).json({
        status: 'success',
        data: {
            template: newTemplate
        }
    });
});

// Get all templates
const getAllTemplates = catchAsync(async (req, res, next) => {
    const { category, search } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { shortDesc: { $regex: search, $options: 'i' } }
        ];
    }

    const templates = await Template.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: templates.length,
        data: {
            templates
        }
    });
});

// Get single template
const getTemplate = catchAsync(async (req, res, next) => {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            template
        }
    });
});

module.exports = {
    createTemplate,
    getAllTemplates,
    getTemplate
};
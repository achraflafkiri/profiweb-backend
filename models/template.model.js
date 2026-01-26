const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    // Template title (unique identifier)
    title: {
        type: String,
        required: [true, 'Template title is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Title should not exceed 100 characters']
    },

    // Short description
    shortDesc: {
        type: String,
        required: [true, 'Short description is required'],
        trim: true,
        maxlength: [200, 'Short description should not exceed 200 characters']
    },

    // CSS Structure/Styling rules
    structure: {
        type: String,
        required: [true, 'Template structure is required'],
        trim: true
    },

    // Colors palette for this template
    colors: {
        type: [String],
        default: []
    },

    // Who created/added this template
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

}, {
    timestamps: true
});

const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

module.exports = Template;
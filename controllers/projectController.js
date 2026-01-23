const catchAsync = require("../utils/catchAsync");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const Question = require("../models/question.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

const createProject = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    clientId,
    category,
    startDate,
    endDate,
    budget,
    cost,
    priority = "standard",
    tags,
    note
  } = req.body;

  // Validate required fields
  if (!title || !description || !clientId || !category || !startDate || !endDate || !budget) {
    return next(new AppError("Please provide all required fields", 400));
  }

  // Check if client exists
  const client = await Client.findById(clientId);
  if (!client) {
    return next(new AppError("Client not found", 404));
  }

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set start date to beginning of day
  start.setHours(0, 0, 0, 0);

  // Set end date to end of day
  end.setHours(23, 59, 59, 999);

  // Validate dates
  if (start >= end) {
    return next(new AppError("End date must be after start date", 400));
  }

  // Create project
  const project = await Project.create({
    title,
    description,
    client: {
      name: client.name,
      id: client._id,
      contactPerson: client.contactPerson
    },
    category,
    status: 'planning',
    priority,
    startDate: start,
    endDate: end,
    budget,
    currency: 'MAD',
    projectManager: req.user.id,
    progress: 0,
    cost: cost || {
      estimated: budget,
      actual: 0,
      expenses: []
    },
    createdBy: req.user.id,
    isActive: true,
    tags,
    note
  });

  // Add project to client's projects list
  await Client.findByIdAndUpdate(clientId, {
    $push: { projects: project._id }
  });

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name email')

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    data: {
      project: populatedProject
    }
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find project by ID with selective population
  const project = await Project.findById(id)
    .select('-__v')
    .populate({
      path: 'projectManager',
      select: 'name email role avatar'
    })
    .populate({
      path: 'client.id',
      select: 'name email company phone address contactPerson'
    });

  // Check if project exists
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Authorization check
  const userRole = req.user.role;
  const userId = req.user.id;

  const canViewProject =
    userRole === 'admin' ||
    userRole === 'manager' ||
    project.projectManager.toString() === userId.toString() ||
    project.createdBy.toString() === userId.toString() ||
    project.teamMembers.some(member => member.user._id.toString() === userId.toString());

  if (!canViewProject && !project.isPublic) {
    return next(new AppError('You do not have permission to view this project', 403));
  }

  // Calculate additional project metrics
  const projectData = project.toObject();

  // Add virtual fields if not already included
  projectData.duration = project.duration;
  projectData.isOverdue = project.isOverdue;
  projectData.daysRemaining = project.daysRemaining;

  // Calculate completion rate of milestones
  if (projectData.milestones && projectData.milestones.length > 0) {
    const completedMilestones = projectData.milestones.filter(m => m.status === 'completed').length;
    projectData.milestoneCompletionRate = Math.round((completedMilestones / projectData.milestones.length) * 100);
  }

  res.status(200).json({
    status: 'success',
    data: {
      project: projectData
    }
  });
});

const getAllProjects = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    client,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeArchived = false
  } = req.query;

  // Build query - always exclude archived unless explicitly requested
  const query = { isActive: true };

  // Handle status and archived logic
  if (status) {
    if (status === 'archived') {
      query.status = 'archived';
    } else {
      query.status = status;
      // Exclude archived for non-archived status queries unless explicitly included
      if (!includeArchived) {
        query.status = { $eq: status, $ne: 'archived' };
      }
    }
  } else {
    // Default: exclude archived if not explicitly included
    if (!includeArchived) {
      query.status = { $ne: 'archived' };
    }
  }

  if (category) query.category = category;
  if (client) query['client.id'] = client;

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by user's projects if not admin
  // if (req.user.role !== 'admin') {
  //   query.$or = [
  //     { projectManager: req.user.id },
  //     { createdBy: req.user.id },
  //   ];
  // }

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const projects = await Project.find(query)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Project.countDocuments(query);

  // Calculate stats
  const stats = await Project.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
      pagination: {
        currentPage: page * 1,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit * 1
      },
      stats
    }
  });
});

const archiveProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find the project
  const project = await Project.findById(id);

  // Check if project exists
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if already archived
  if (project.status === 'archived') {
    return next(new AppError('Project is already archived', 400));
  }

  // Archive the project by changing status to 'archived'
  project.status = 'archived';
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Project archived successfully',
    data: {
      project
    }
  });
});

const getArchivedProjects = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    category,
    client,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query for archived projects
  const query = {
    status: 'archived',
  };

  if (category) query.category = category;
  if (client) query['client.id'] = client;

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const projects = await Project.find(query)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Project.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
      pagination: {
        currentPage: page * 1,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit * 1
      }
    }
  });
});

const restoreProject = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Get project ID from URL parameter
  const { status = 'planning' } = req.body; // Default status after restore

  // Validate status (cannot restore to archived status)
  const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // Check if project exists and is archived
  const project = await Project.findOne({
    _id: id,
    status: 'archived'
  });

  if (!project) {
    return res.status(404).json({
      status: 'fail',
      message: 'Project not found or not archived'
    });
  }

  // Restore the project
  const restoredProject = await Project.findByIdAndUpdate(
    id,
    {
      $set: {
        status: status,
        isActive: true,
        updatedAt: Date.now(),
        updatedBy: req.user.id
      }
    },
    { new: true, runValidators: true }
  )
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .populate('createdBy', 'name email');

  res.status(200).json({
    status: 'success',
    message: 'Project restored successfully',
    data: {
      project: restoredProject
    }
  });
});

const createOrUpdateQuestions = catchAsync(async (req, res, next) => {
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  console.log("herllo babay ");
  
  const { id: projectId } = req.params;
  const { questions, projectType } = req.body;

  console.log("req.body : ", req.body);

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  console.log("project : ", project);

  // Validate that questions array exists
  if (!questions || !Array.isArray(questions)) {
    return next(new AppError('Questions array is required', 400));
  }

  // Process each question
  const savedQuestions = [];
  
  for (const questionData of questions) {
    const {
      questionKey,
      question,
      type,
      answer,
      section,
      sectionName,
      order,
      isRequired,
      options,
      placeholder,
      settings,
      isCustom
    } = questionData;

    // Determine status based on whether answer exists
    const status = answer ? 'answered' : 'pending';

    // Use findOneAndUpdate with upsert to create or update
    const savedQuestion = await Question.findOneAndUpdate(
      { 
        project: projectId, 
        questionKey: questionKey 
      },
      {
        project: projectId,
        questionKey,
        question,
        type,
        answer,
        section,
        sectionName,
        order,
        isRequired,
        projectType: projectType || 'wordpress',
        status,
        ...(options && { options }),
        ...(placeholder && { placeholder }),
        ...(settings && { settings }),
        ...(isCustom !== undefined && { isCustom })
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    savedQuestions.push(savedQuestion);
  }

  // Optionally update project's questionsStatus
  const allAnswered = savedQuestions.every(q => q.status === 'answered');
  const anyAnswered = savedQuestions.some(q => q.status === 'answered');
  
  let questionsStatus = 'pending';
  if (allAnswered) {
    questionsStatus = 'completed';
  } else if (anyAnswered) {
    questionsStatus = 'in-progress';
  }

  await Project.findByIdAndUpdate(
    projectId,
    { 
      questionsStatus,
      ...(allAnswered && { questionsCompletedAt: new Date() })
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Project questions updated successfully',
    data: {
      questions: savedQuestions,
      questionsStatus
    }
  });
});

const getQuestionsByProject = catchAsync(async (req, res, next) => {
  const { id: projectId } = req.params;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Get all questions for this project
  const questions = await Question.find({ project: projectId })
    .sort({ order: 1, createdAt: 1 }) // Sort by order then by creation date
    .select('-__v'); // Exclude version key

  // If no questions found, return empty array
  if (!questions || questions.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No questions found for this project',
      data: {
        questions: [],
        project: {
          id: project._id,
          title: project.title,
          questionsStatus: project.questionsStatus || 'pending'
        }
      }
    });
  }

  // Group questions by section for better organization
  const groupedQuestions = questions.reduce((acc, question) => {
    const section = question.section || 'general';
    const sectionName = question.sectionName || 'General Information';
    
    if (!acc[section]) {
      acc[section] = {
        sectionName,
        questions: []
      };
    }
    
    acc[section].questions.push(question);
    return acc;
  }, {});

  // Convert to array for easier frontend consumption
  const sections = Object.keys(groupedQuestions).map(section => ({
    section,
    sectionName: groupedQuestions[section].sectionName,
    questions: groupedQuestions[section].questions
  }));

  // Calculate completion statistics
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === 'answered').length;
  const pendingQuestions = questions.filter(q => q.status === 'pending').length;
  const completionPercentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;

  // Get required questions statistics
  const requiredQuestions = questions.filter(q => q.isRequired);
  const requiredAnswered = requiredQuestions.filter(q => q.status === 'answered').length;
  const requiredCompletion = requiredQuestions.length > 0
    ? Math.round((requiredAnswered / requiredQuestions.length) * 100)
    : 100;

  res.status(200).json({
    status: 'success',
    data: {
      questions,
      sections,
      statistics: {
        total: totalQuestions,
        answered: answeredQuestions,
        pending: pendingQuestions,
        completionPercentage,
        required: {
          total: requiredQuestions.length,
          answered: requiredAnswered,
          completionPercentage: requiredCompletion
        }
      },
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        questionsStatus: project.questionsStatus || 'pending',
        questionsCompletedAt: project.questionsCompletedAt,
        projectType: project.projectType || 'wordpress'
      },
      metadata: {
        lastUpdated: new Date(),
        count: questions.length,
        customFieldsCount: questions.filter(q => q.isCustom).length,
        standardFieldsCount: questions.filter(q => !q.isCustom).length
      }
    }
  });
});

module.exports = {
  createProject,
  getProjectById,
  archiveProject,
  getArchivedProjects,
  getAllProjects,
  restoreProject,
  getQuestionsByProject,
  createOrUpdateQuestions
};

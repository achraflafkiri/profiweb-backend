// controllers/clientController.js
const catchAsync = require("../utils/catchAsync");
const Client = require("../models/client.model");
const AppError = require("../utils/AppError");

const createClient = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    company,
    industry,
    address,
    contactPerson,
    notes,
    status = "lead",
    source = "other"
  } = req.body;

  // Validate required fields
  if (!name) {
    return next(new AppError("Client name is required", 400));
  }

  if (!email) {
    return next(new AppError("Client email is required", 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Please provide a valid email address", 400));
  }

  // Check if client with email already exists
  const existingClient = await Client.findOne({ email });
  
  if (existingClient) {
    return next(new AppError("A client with this email already exists", 409));
  }

  // Prepare address object
  const clientAddress = address || {
    street: "",
    city: "",
    state: "",
    country: "Morocco",
    postalCode: ""
  };

  // Prepare contact person object
  const clientContactPerson = contactPerson || {
    name: name,
    position: "Contact",
    email: email,
    phone: phone || ""
  };

  // Create client (only fields that exist in schema)
  const client = await Client.create({
    name,
    email,
    phone: phone || "",
    company: company || "",
    industry: industry || "Other",
    address: clientAddress,
    contactPerson: clientContactPerson,
    notes: notes || "",
    status,
    source
  });

  res.status(201).json({
    status: 'success',
    message: 'Client created successfully',
    data: {
      client
    }
  });
});

const deleteClient = catchAsync(async (req, res, next) => {
  
});

const getClients = catchAsync(async (req, res, next) => {
  // Get query parameters for filtering, sorting, pagination
  const { 
    search,
    status,
    industry,
    sort = 'name',
    page = 1,
    limit = 10
  } = req.query;

  // Build query
  let query = { isActive: true };
  
  // Search by name, email, company, or phone
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by industry
  if (industry) {
    query.industry = industry;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);

  // Execute query with pagination
  const clients = await Client.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitInt)
    .populate('projects', 'title status')
    .select('-__v'); // Exclude version key

  // Get total count for pagination
  const total = await Client.countDocuments(query);
  const totalPages = Math.ceil(total / limitInt);

  res.status(200).json({
    status: 'success',
    results: clients.length,
    data: {
      clients,
      pagination: {
        currentPage: pageInt,
        totalPages,
        totalItems: total,
        itemsPerPage: limitInt
      }
    }
  });
});

module.exports = {
  createClient,
  deleteClient,
  getClients
};
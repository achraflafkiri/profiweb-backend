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

module.exports = {
  createClient,
  deleteClient
};
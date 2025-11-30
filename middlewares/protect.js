const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  try {
    // console.log(" ================ protect ===============");

    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // console.log("token ==> ", token);

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // console.log("currentUser ==> ", currentUser)

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed password! Please log in again.'
      });
    }

    // Grant access to protected route
    req.user = currentUser;

    // console.log("req.user ==> ", req.user) // i see output of req.user :

    // Output:
    // currentUser ==>  {
    //   _id: new ObjectId('6836e2d712aa920829399dc3'),
    //   username: 'achraf',
    //   email: 'achraf@lafkiri.com',
    //   password: '$2b$12$R5.u3lihqMDUT9x0WNoK.uJZehegFALpwEHWEHx3PoQGf31g8djIu',
    //   firstName: 'John',
    //   lastName: 'Doe',
    //   phone: '+33612345678',
    //   photo: null,
    //   age: 35,
    //   status: 'célibataire',
    //   profession: 'Software Developer',
    //   hobbies: [ 'sport', 'lecture', 'voyage' ],
    //   children: 2,
    //   childrenAges: [ '7-11', '12-15' ],
    //   custody: 'alternée',
    //   conductAgreement: true,
    //   role: 'parent',
    //   isActive: true,
    //   isVerified: false,
    //   lastLogin: 2025-05-28T10:39:10.818Z,
    //   createdAt: 2025-05-28T10:17:59.183Z,
    //   updatedAt: 2025-05-28T10:39:10.818Z,
    //   __v: 0,
    //   passwordChangedAt: 2025-05-28T12:19:47.953Z,
    //   fullName: 'John Doe',
    //   id: '6836e2d712aa920829399dc3'
    // }
    
    
    
    
    

    next();
  } catch (error) {
    // console.log("error: ", error);

    return res.status(401).json({
      status: 'error',
      message: 'Invalid token or authorization error'
    });
  }
};

module.exports = protect;
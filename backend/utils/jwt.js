const jwt = require("jsonwebtoken");

exports.sign = (id)=>{
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"7d"});
};

const User = require("../models/User");

module.exports = async (req,res,next)=>{

  const user = await User.findById(req.user.id);

  if(user.plan === "FREE" && user.alertsUsed >= 5){
    return res.json({
      upgrade: true,
      msg: "Upgrade required"
    });
  }

  next();
};
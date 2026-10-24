const express = require("express");
const authenticateToken = require("../../middlewares/authMiddleware");
const { requirePermission } = require("../../middlewares/rbacMiddleware");
const {
  GenerateSlip,
  Addsalaryinfo,
  Updatesalaryinfo,
  usersalarybyitsid,
} = require("./payrollcontroller");

const router = express.Router();

// Self-check or HR permission for ID params
const allowSelfOrPermission = (perm) => {
  return (req, res, next) => {
    // If requesting own salary, allow
    if (req.user && (req.user.user_id === req.params.id || req.user.userId === req.params.id)) {
      return next();
    }
    // Otherwise require HR permission
    return requirePermission(perm)(req, res, next);
  };
};

// Self-check or HR permission for Slip Generation body
const allowSelfSlipOrPermission = (perm) => {
  return (req, res, next) => {
    const targetUserId = req.body?.user_id || req.body?.employee_id;
    const currentUserId = req.user?.user_id || req.user?.userId;
    if (currentUserId && targetUserId && String(currentUserId) === String(targetUserId)) {
      return next();
    }
    return requirePermission(perm)(req, res, next);
  };
};

router.post("/Generate", authenticateToken, allowSelfSlipOrPermission("payroll:slip:generate"), GenerateSlip);
router.post("/usersalaryinfo/add", authenticateToken, requirePermission("payroll:structure:manage"), Addsalaryinfo);
router.put("/usersalaryinfo/update", authenticateToken, requirePermission("payroll:structure:manage"), Updatesalaryinfo);
router.get("/usersalaryinfo/:id", authenticateToken, allowSelfOrPermission("payroll:read:all"), usersalarybyitsid);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
    getDispatchPolicies,
    updateDispatchPolicies,
    getDisputes,
    resolveDispute
} = require("../controllers/dispatchPolicyController");

// Public / Token Optional for fast Admin usage
router.get("/dispatch-policies", getDispatchPolicies);
router.put("/dispatch-policies", updateDispatchPolicies);
router.get("/disputes", getDisputes);
router.post("/disputes/:id/resolve", resolveDispute);

module.exports = router;

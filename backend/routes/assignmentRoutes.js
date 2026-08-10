const express=require("express");

const router=express.Router();

const{

createAssignment,
viewAssignments,
viewDriverAssignments,
completeAssignment,
assignmentHistory,
analytics

}=require("../controllers/assignmentController");

const authMiddleware=require("../middleware/authMiddleware");


// Assign Driver
router.post(

"/",

authMiddleware,

createAssignment

);


// View All Assignments
router.get(

"/",

authMiddleware,

viewAssignments

);


// View Driver Assignments
router.get(

"/driver/:driverId",

authMiddleware,

viewDriverAssignments

);


// Complete Delivery
router.put(

"/:id/complete",

authMiddleware,

completeAssignment

);


// Assignment History
router.get(

"/history",

authMiddleware,

assignmentHistory

);


// Dashboard Analytics
router.get(

"/analytics",

authMiddleware,

analytics

);

module.exports=router;
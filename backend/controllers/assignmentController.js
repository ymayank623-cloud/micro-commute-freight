const{

assignDriver,
getAllAssignments,
getAssignmentsByDriver,
getDriverStatus,
updateDriverStatus,
updateParcelStatus,
completeDelivery,
getAssignmentHistory,
getAnalytics

}=require("../models/assignmentModel");


// Assign Driver
const createAssignment=async(req,res)=>{

try{

const{parcel_id,driver_id}=req.body;

const driver=await getDriverStatus(driver_id);

if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}

if(driver.status==="Busy"){

return res.status(400).json({

message:"Driver is already busy"

});

}

const assignment=await assignDriver(parcel_id,driver_id);

await updateDriverStatus(driver_id,"Busy");

await updateParcelStatus(parcel_id,"Assigned");

res.status(201).json({

message:"Driver assigned successfully",

assignment

});

}catch(error){

console.error(error);

res.status(500).json({

message:"Server Error"

});

}

};


// View Assignments
const viewAssignments=async(req,res)=>{

try{

const assignments=await getAllAssignments();

res.status(200).json(assignments);

}catch(error){

console.error(error);

res.status(500).json({

message:"Server Error"

});

}

};


// Driver Assignments
const viewDriverAssignments=async(req,res)=>{

try{

const assignments=await getAssignmentsByDriver(

req.params.driverId

);

res.status(200).json(assignments);

}catch(error){

console.error(error);

res.status(500).json({

message:"Server Error"

});

}

};


// Complete Delivery
const completeAssignment=async(req,res)=>{

try{

const assignment=await completeDelivery(req.params.id);

if(!assignment){

return res.status(404).json({

message:"Assignment not found"

});

}

res.status(200).json({

message:"Delivery completed successfully",

assignment

});

}catch(error){

console.error(error);

res.status(500).json({

message:"Server Error"

});

}

};


// Assignment History
const assignmentHistory=async(req,res)=>{

try{

const history=await getAssignmentHistory();

res.status(200).json(history);

}catch(error){

console.error(error);

res.status(500).json({

message:"Server Error"

});

}

};


// Analytics
const analytics=async(req,res)=>{

try{

const data=await getAnalytics();

res.status(200).json(data);

}catch(error){

console.error(error);

res.status(500).json({

message:"Server Error"

});

}

};

module.exports={

createAssignment,
viewAssignments,
viewDriverAssignments,
completeAssignment,
assignmentHistory,
analytics

};
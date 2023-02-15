const db = require("../db");
const {
  API_getGenericConfiguration,
  API_updateConfig,
  api_getAverageWorkingHours,savePolicyDocument,API_generateSecretKey,
  API_getAllSecretKeys,API_regenerateSecretKey,API_deleteSecretKey,
  getAllPagesWithStatus,API_deleteAttendanceStatsSummary,API_getEmployeesLeavesStats,
  getEmployeesHistoryStats,API_getStatsAttendanceSummary
} = require("../settingsFunction");
const{getAllPages}=require("../roles")

exports.get_generic_configuration = async (req, res, next) => {
  try {
    let user = req.userData;
    let showSecureData = false;
    if (user) {
      if (typeof user.role !== "undefined") {
        showSecureData = true;
      }
    }
    let result = await API_getGenericConfiguration(showSecureData, db);
    res.status_code = 200;
    res.data = result.data;
    res.error = result.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.update_config = async (req, res, next) => {
  try {
    if (
      typeof req.body.type === "undefind" &&
      typeof req.body.data === "undefined"
    ) {
      res.error = 1;
      res.data.message = "type and data can't be empty";
      return next();
    } else {
      let type = req.body.type;
      let data = req.body.data;
      let result = await API_updateConfig(type, data, db);
      res.status_code = 200;
      res.message = result.data.message;
      res.error = result.error;
      return next();
    }
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.get_average_working_hours = async (req, res, next) => {
  try {
    let start_date = req.body.start_date;
    let end_date = req.body.end_date;
    let result = await api_getAverageWorkingHours(start_date,end_date, db);
    res.status_code = 200;
    res.message = result.message;
    res.data=result.data;
    res.error = result.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.save_policy_document=async(req,res,next)=>{
  try{
    let resp =await savePolicyDocument(req,db);
    res.status_code=200;
    res.message=resp.data.message;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.get_all_secret_keys=async(req,res,next)=>{
  try{
    let resp =await API_getAllSecretKeys(db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.generate_secret_key=async(req,res,next)=>{
  try{
    app_name = req.body['app_name'];
    user_id = req.userData['id'];   
    console.log(app_name,user_id)
    let resp =await API_generateSecretKey( app_name, user_id,db );
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.regenerate_secret_key=async(req,res,next)=>{
  try{
    let app_id = req.body['app_id'];
    let resp = await API_regenerateSecretKey( app_id,db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};

exports.delete_secret_key=async(req,res,next)=>{
  try{
    let app_id = req.body['app_id'];
    let resp = await API_deleteSecretKey( app_id,db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};

exports.get_all_pages=async(req,res,next)=>{
  try{
    let loggedUserInfo=req.userData;
    let resp;
    if((loggedUserInfo['role'].toLowerCase()) == 'admin' ){
      resp =await getAllPagesWithStatus(db);
  } else {
    resp['data']['message'] = 'You are not authorised. Contact Admin !';
  }
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.delete_attendance_stats_summary=async(req,res,next)=>{
  try{
    let year=req.body.year;
    let resp = await API_deleteAttendanceStatsSummary(year,db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.get_employees_leaves_stats=async(req,res,next)=>{
  try{
    let year = req.body['year'];
    let month = req.body['month'];
    let resp = await API_getEmployeesLeavesStats( year, month,req,db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.get_employees_history_stats=async(req,res,next)=>{
  try{
    let resp = await getEmployeesHistoryStats(db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
exports.get_stats_attendance_summary=async(req,res,next)=>{
  try{
    let resp = await API_getStatsAttendanceSummary(db);
    res.status_code=200;
    res.message=resp.data;
    res.error=resp.error;
    return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=resp.error;
    res.error=resp.error;
    return next();
  }
};
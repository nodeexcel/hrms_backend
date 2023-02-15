function assignManager(database, type) {
    const assignedData = database.define("assignedmanager",{
        userId : {type:Number},
        managerId : {type:Number}

    },{
        timestamps:false
    })
    return assignedData;
}
module.exports=assignManager;
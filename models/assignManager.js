function assignManager(database, type) {
    const assignManager = database.define("assignManager",{
        user_Id:type.INTEGER,
        manager_Id:type.INTEGER
    },{
        timestamps:false
    })
    return assignManager;
}
module.exports=assignManager;
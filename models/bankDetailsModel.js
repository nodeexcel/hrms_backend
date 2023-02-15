function user_bank_detail(database, type) {
    const user_bank_detail = database.define("user_bank_detail",{
        user_Id:type.INTEGER,
        bank_name:type.STRING,
        bank_address:type.STRING,
        bank_account_no:type.STRING,
        ifsc:type.STRING,

    },{
        timestamps:false
    })
    return user_bank_detail;
}
module.exports=user_bank_detail;
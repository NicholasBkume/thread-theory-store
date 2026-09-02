import mongoose from "mongoose";
const notificationSchema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},type:{type:String,default:"system"},title:{type:String,required:true,trim:true,maxlength:160},message:{type:String,required:true,trim:true,maxlength:2000},read:{type:Boolean,default:false},metadata:{type:Object,default:{}}},{timestamps:true});
notificationSchema.index({user:1,createdAt:-1});notificationSchema.index({user:1,read:1});
export default mongoose.model("Notification",notificationSchema);

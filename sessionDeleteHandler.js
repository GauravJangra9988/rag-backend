import { deleteCollection } from "./db_collection.js";

export const sessionDeleteHandler = async(req, res) =>{
    const user = req.cookies.sessionId;
    await deleteCollection(user)
    res.cookie("sessionId", "");
    res.status(200).json({message: "session removed and all documents data cleared"})
}
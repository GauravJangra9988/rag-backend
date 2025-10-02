import { deleteCollection } from "./db_collection.js";

export const sessionDeleteHandler = async(req, res) =>{
    try{
        const user = req.cookies.sessionId;
        if (!user) {
          return res.status(404).json({message: "No userdata present, please refresh the page",});
            }
        await deleteCollection(user);
        res.cookie("sessionId", "", {
          sameSite: "none",
          secure: "true",
          maxAge: 60 * 60 * 24 * 1000,
        });
        res.status(200).json({ message: "Session removed and all documents deleted" });
    } catch(error){
        res.status(500).json({message: "Internal Server Error"})
    }

}
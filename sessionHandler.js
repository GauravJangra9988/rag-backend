import { v4 as uuidv4 } from "uuid";

const uuid = uuidv4();

export const sessionHandler = (req, res) => {

    var sessionId = req.cookies.sessionId
    

    if(!sessionId){
        sessionId = uuid;
        
        res.cookie("sessionId", sessionId, {maxAge: 60 * 60 * 24 * 1000});
        return res.status(200).json({ message: "New session assigned, Please add a document" });
    }

    res.status(200).json({message: "Found previous session, click remove history to start fresh"})
};

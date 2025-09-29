import { v4 as uuidv4 } from "uuid";

const uuid = uuidv4();

export const sessionHandler = (req, res) => {
    console.log("sessionHandler")
    var sessionId = req.cookies.sessionId
    console.log(sessionId)

    if(!sessionId){
        console.log("assigning session id")
        sessionId = uuid;
        console.log(sessionId)
        res.cookie("sessionId", sessionId);
        return res.status(200).json({ message: "sessionId assigned" });
    }

    res.status(200).json({message: "Found a session history using that, if want to start fresh click start fresh"})
};
